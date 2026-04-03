'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

type Item = {
    id: string; title: string; description: string; category: string;
    status: string; locationFloor: string; locationRoom: string;
    imageUrl?: string; dateLost: string; createdAt: string;
    finderId?: string; ownerId?: string;
};
type UserInfo = { id: string; name: string; email: string } | null;
type ItemDetail = { item: Item; finder: UserInfo; owner: UserInfo } | null;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    REPORTED: { label: 'Reported', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', dot: 'bg-emerald-400' },
    CLAIMED: { label: 'Claimed', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', dot: 'bg-amber-400' },
    HANDED_OVER: { label: 'Handed Over', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40', dot: 'bg-blue-400' },
    RECEIVED: { label: 'Received', color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/40', dot: 'bg-violet-400' },
};

export default function AdminDashboard() {
    const params = useParams();
    const subdomain = params.subdomain as string;
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'HISTORY'>('ALL');
    const [selectedDetail, setSelectedDetail] = useState<ItemDetail>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Add Item State
    const [newItem, setNewItem] = useState({
        title: '', description: '', category: 'Electronics', dateLost: '', locationFloor: '', locationRoom: '', imageUrl: ''
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/items?subdomain=${subdomain}`);
            const data = await res.json();
            if (data.items) setAllItems(data.items);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [subdomain]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        setSelectedDetail({ item: allItems.find(i => i.id === id)!, finder: null, owner: null });
        try {
            const res = await fetch(`/api/items/${id}`);
            const data = await res.json();
            if (data.item) setSelectedDetail(data);
        } catch (e) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    const closeModal = () => setSelectedDetail(null);

    const exportToExcel = () => {
        const worksheetData = allItems.map(item => ({
            ID: item.id,
            Title: item.title,
            Category: item.category,
            Status: item.status,
            DateLost: item.dateLost,
            Floor: item.locationFloor,
            Room: item.locationRoom,
            CreatedAt: item.createdAt,
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
        XLSX.writeFile(workbook, `Unifind_${subdomain}_Items.xlsx`);
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...newItem, subdomain }),
            });

            if (res.ok) {
                setShowReportModal(false);
                setNewItem({ title: '', description: '', category: 'Electronics', dateLost: '', locationFloor: '', locationRoom: '', imageUrl: '' });
                fetchItems();
            } else {
                alert('Failed to report item');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setNewItem({ ...newItem, imageUrl: data.url });
            } else {
                alert('Upload failed');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Delete an item
    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this item? This cannot be undone.')) return;
        const token = localStorage.getItem('token');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                closeModal();
                fetchItems();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to delete');
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    // Walk-in: Admin manually marks a REPORTED item as CLAIMED
    const handleMarkClaimed = async (id: string) => {
        if (!confirm('Mark this item as claimed? Use this when the owner visited in person.')) return;
        const token = localStorage.getItem('token');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'CLAIMED' })
            });
            if (res.ok) {
                const refreshed = await fetch(`/api/items/${id}`);
                const data = await refreshed.json();
                if (data.item) setSelectedDetail(data);
                fetchItems();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to update status');
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    // Verify & handover
    const handleHandover = async (id: string) => {
        if (!confirm("Verify the owner's identity in person. Mark as handed over?")) return;
        const token = localStorage.getItem('token');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/items/${id}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const refreshed = await fetch(`/api/items/${id}`);
                const data = await refreshed.json();
                if (data.item) setSelectedDetail(data);
                fetchItems();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to verify');
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    const pendingItems = allItems.filter(i => i.status === 'CLAIMED');
    const historyItems = allItems.filter(i => ['HANDED_OVER', 'RECEIVED'].includes(i.status));
    const displayItems = activeTab === 'ALL' ? allItems : activeTab === 'PENDING' ? pendingItems : historyItems;

    const stats = [
        { label: 'Total Items', value: allItems.length, icon: '📦', color: 'from-indigo-600/20 to-violet-600/20', border: 'border-indigo-500/30' },
        { label: 'Pending Claims', value: pendingItems.length, icon: '⏳', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
        { label: 'Handed Over', value: allItems.filter(i => i.status === 'HANDED_OVER').length, icon: '🤝', color: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/30' },
        { label: 'Completed', value: allItems.filter(i => i.status === 'RECEIVED').length, icon: '✅', color: 'from-emerald-600/20 to-teal-600/20', border: 'border-emerald-500/30' },
    ];

    const tabs = [
        { key: 'ALL' as const, label: 'All Items', count: allItems.length },
        { key: 'PENDING' as const, label: 'Pending Verification', count: pendingItems.length },
        { key: 'HISTORY' as const, label: 'Handover History', count: historyItems.length },
    ];

    return (
        <div className="min-h-screen text-white bg-[#0a0514] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
            
            <Navbar />

            {/* Header */}
            <div className="border-b border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>🛡️</div>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                                Admin Dashboard
                            </h1>
                        </motion.div>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-gray-400 ml-14 font-medium">Manage and verify all submitted items</motion.p>
                    </div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                        <button onClick={() => setShowReportModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide shadow-lg shadow-purple-500/25 transition-all text-sm flex items-center gap-2 border border-white/10">
                            <span>+</span> Add Item
                        </button>
                        <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30">
                            📊 Export Excel
                        </button>
                    </motion.div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {stats.map((stat, i) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={stat.label} className={`rounded-2xl p-6 border ${stat.border} bg-gradient-to-br ${stat.color} backdrop-blur-md shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all`}>
                            <div className="text-3xl mb-3 drop-shadow-md">{stat.icon}</div>
                            <div className="text-4xl font-black mb-1 drop-shadow-sm">{stat.value}</div>
                            <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 p-1.5 rounded-2xl w-fit bg-black/40 border border-white/10 backdrop-blur-xl">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${activeTab === tab.key ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}>
                            {tab.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'}`}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Items Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
                        <p className="text-gray-400 font-medium tracking-wide animate-pulse">Synchronizing Data...</p>
                    </div>
                ) : displayItems.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 gap-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <div className="text-7xl opacity-40 drop-shadow-lg mb-2">📭</div>
                        <p className="text-gray-300 font-bold text-xl">Queue is empty</p>
                        <p className="text-gray-500 font-medium text-sm">No items currently in this category.</p>
                    </motion.div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {displayItems.map(item => {
                                const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['REPORTED'];
                                return (
                                    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 bg-white/5 border border-white/10 shadow-xl hover:border-indigo-500/30 hover:shadow-indigo-500/10 backdrop-blur-sm relative"
                                        onClick={() => openDetail(item.id)}>
                                        <div className="h-48 relative overflow-hidden bg-black/50 flex items-center justify-center">
                                            {item.imageUrl
                                                ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                : <div className="text-5xl text-gray-600 transition-transform duration-500 group-hover:scale-125">📷</div>
                                            }
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-50" />
                                            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-xl ${sc.bg} ${sc.color}`}>
                                                <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />
                                                {sc.label}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="font-extrabold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{item.title}</h3>
                                            </div>
                                            <span className="inline-block px-2.5 py-1 mb-3 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-gray-300 tracking-wide">{item.category}</span>
                                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">{item.description}</p>
                                            
                                            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-400 mb-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-1.5"><span className="text-indigo-400">📅</span> {new Date(item.dateLost).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-1.5"><span className="text-purple-400">📍</span> Fl. {item.locationFloor}</div>
                                            </div>
                                        </div>
                                        {item.status === 'CLAIMED' && (
                                            <div className="px-5 pb-5">
                                                <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner flex items-center justify-center gap-2">
                                                    <span className="text-base">⚠️</span> Needs Verification
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* ======= ADD ITEM MODAL ======= */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-xl bg-gray-900 rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="p-8 pb-6 flex justify-between items-center border-b border-white/5">
                                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Add Found Item</h2>
                                <button onClick={() => setShowReportModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
                            </div>
                            <form onSubmit={handleReportSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 transparent' }}>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Title</label>
                                    <input required type="text" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-600" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="e.g. Blue Air Chugger Flask" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                    <select className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-200" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Books">Books</option>
                                        <option value="Bottle">Bottle</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <textarea required rows={3} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-600 resize-none" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Distinctive features, brand, color..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date Found</label>
                                    <input required type="date" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-200" value={newItem.dateLost} onChange={e => setNewItem({ ...newItem, dateLost: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Floor No.</label>
                                        <input type="text" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-600" value={newItem.locationFloor} onChange={e => setNewItem({ ...newItem, locationFloor: e.target.value })} placeholder="2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Room No.</label>
                                        <input type="text" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-600" value={newItem.locationRoom} onChange={e => setNewItem({ ...newItem, locationRoom: e.target.value })} placeholder="C204" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Photo Proof (Required)</label>
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 border-dashed flex items-center justify-between">
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm font-medium text-gray-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-wide file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer" />
                                        {newItem.imageUrl && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">✓ Uploaded</span>}
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold tracking-wide transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold tracking-wide shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5">Publish Item</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= ITEM DETAIL MODAL ======= */}
            <AnimatePresence>
                {selectedDetail && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,3,10,0.85)', backdropFilter: 'blur(16px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                        <motion.div initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_20px_100px_rgba(79,70,229,0.15)] max-h-[90vh] overflow-y-auto relative"
                            style={{ background: '#0d091a', border: '1px solid rgba(255,255,255,0.08)' }}>

                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-10" />

                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-white/5 sticky top-0 bg-[#0d091a]/90 backdrop-blur-md z-10">
                                <h2 className="text-xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                                    Manage Item
                                </h2>
                                <button onClick={closeModal} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
                            </div>

                            {detailLoading ? (
                                <div className="flex items-center justify-center py-24">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
                                </div>
                            ) : (
                                <div>
                                    {/* Image */}
                                    {selectedDetail.item.imageUrl && (
                                        <div className="h-72 relative overflow-hidden bg-black flex items-center justify-center">
                                            <img src={selectedDetail.item.imageUrl} alt={selectedDetail.item.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d091a] via-transparent to-transparent opacity-90" />
                                        </div>
                                    )}

                                    <div className="p-8 space-y-8 -mt-10 relative z-10">
                                        {/* Title & Status */}
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <h3 className="text-3xl font-black drop-shadow-md tracking-tight leading-tight">{selectedDetail.item.title}</h3>
                                                {(() => {
                                                    const sc = STATUS_CONFIG[selectedDetail.item.status] || STATUS_CONFIG['REPORTED'];
                                                    return (
                                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-2 shrink-0 shadow-lg ${sc.bg} ${sc.color}`}>
                                                            <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />
                                                            {sc.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-gray-400 text-base leading-relaxed">{selectedDetail.item.description}</p>
                                        </div>

                                        {/* Metadata */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { label: 'Category', value: selectedDetail.item.category, icon: '🏷️' },
                                                { label: 'Location Found', value: `Floor ${selectedDetail.item.locationFloor}, Room ${selectedDetail.item.locationRoom}`, icon: '📍' },
                                                { label: 'Date Retrieved', value: new Date(selectedDetail.item.dateLost).toLocaleDateString(), icon: '📅' },
                                                { label: 'System Addition', value: new Date(selectedDetail.item.createdAt).toLocaleDateString(), icon: '🕐' },
                                            ].map(({ label, value, icon }) => (
                                                <div key={label} className="p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">{icon} {label}</div>
                                                    <div className="text-base font-semibold text-gray-200">{value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* People */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Involved Parties</h4>
                                            
                                            {/* Finder */}
                                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg bg-indigo-500/20 border border-indigo-500/30">🔍</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Reporter / Finder</div>
                                                    {selectedDetail.finder
                                                        ? (<><div className="font-bold text-base text-gray-100">{selectedDetail.finder.name}</div><div className="text-sm text-gray-400 truncate font-medium">{selectedDetail.finder.email}</div></>)
                                                        : <div className="text-sm font-semibold text-gray-500 italic mt-1">Found Item (No user data)</div>
                                                    }
                                                </div>
                                            </div>
                                            
                                            {/* Owner */}
                                            <div className={`flex items-center gap-4 p-5 rounded-2xl shadow-inner ${selectedDetail.owner ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/5'}`}>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg ${selectedDetail.owner ? 'bg-amber-500/20 border-amber-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>👤</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-[11px] font-black uppercase tracking-widest mb-1 ${selectedDetail.owner ? 'text-amber-400' : 'text-gray-500'}`}>Verified Owner</div>
                                                    {selectedDetail.owner
                                                        ? (<><div className="font-bold text-base text-gray-100">{selectedDetail.owner.name}</div><div className="text-sm text-gray-400 truncate font-medium">{selectedDetail.owner.email}</div></>)
                                                        : <div className="text-sm font-semibold text-gray-500 italic mt-1">Item remains unclaimed</div>
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        {/* ===== ACTION BUTTONS ===== */}
                                        <div className="space-y-4 pt-4 border-t border-white/5 mt-8">
                                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1 mb-2">Administrative Actions</h4>

                                            {/* REPORTED: admin can mark as claimed for walk-in owners */}
                                            {selectedDetail.item.status === 'REPORTED' && (
                                                <button
                                                    onClick={() => handleMarkClaimed(selectedDetail.item.id)}
                                                    disabled={actionLoading}
                                                    className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 25px rgba(245,158,11,0.25)' }}
                                                >
                                                    <span className="text-lg">🤝</span> Initiate Manual Walk-in Claim
                                                </button>
                                            )}

                                            {/* CLAIMED: verify and hand over */}
                                            {selectedDetail.item.status === 'CLAIMED' && (
                                                <button
                                                    onClick={() => handleHandover(selectedDetail.item.id)}
                                                    disabled={actionLoading}
                                                    className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}
                                                >
                                                    <span className="text-lg">✓</span> Verify & Authorize Handover
                                                </button>
                                            )}

                                            {/* HANDED_OVER: waiting */}
                                            {selectedDetail.item.status === 'HANDED_OVER' && (
                                                <div className="w-full py-4 rounded-xl text-center text-sm font-bold tracking-wide flex items-center justify-center gap-2" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                    Awaiting Final Receipt Validation
                                                </div>
                                            )}

                                            {/* RECEIVED: complete */}
                                            {selectedDetail.item.status === 'RECEIVED' && (
                                                <div className="w-full py-4 rounded-xl text-center text-sm font-bold tracking-wide flex items-center justify-center gap-2" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                                                    <span className="text-lg">🏅</span> Item Closed & Process Completed
                                                </div>
                                            )}

                                            {/* Delete — always available */}
                                            <button
                                                onClick={() => handleDelete(selectedDetail.item.id)}
                                                disabled={actionLoading}
                                                className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm tracking-wide transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
                                                style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                                            >
                                                Purge Record from Database
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
