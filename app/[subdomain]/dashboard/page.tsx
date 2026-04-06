'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '@/lib/uploadToCloudinary';

export default function Dashboard() {
    const params = useParams();
    const subdomain = params.subdomain as string;
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [category, setCategory] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // New filter for My Claims
    const [viewMode, setViewMode] = useState<'BROWSE' | 'MY_CLAIMS'>('BROWSE');
    const [showReportModal, setShowReportModal] = useState(false);

    // Report Form State
    const [newItem, setNewItem] = useState({
        title: '', description: '', category: 'Electronics', dateLost: '', locationFloor: '', locationRoom: '', imageUrl: ''
    });
    const [uploadLoading, setUploadLoading] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            let url = `/api/items?subdomain=${subdomain}`;
            if (filter && viewMode === 'BROWSE') url += `&search=${filter}`;
            if (category && viewMode === 'BROWSE') url += `&category=${category}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.items) {
                if (viewMode === 'MY_CLAIMS') {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    let myItems = data.items.filter((i: any) => i.ownerId === user.id || i.finderId === user.id);
                    if (statusFilter) myItems = myItems.filter((i: any) => i.status === statusFilter);
                    if (filter) myItems = myItems.filter((i: any) => i.title.toLowerCase().includes(filter.toLowerCase()));
                    if (category) myItems = myItems.filter((i: any) => i.category === category);
                    setItems(myItems);
                } else {
                    setItems(data.items.filter((i: any) => i.status === 'REPORTED'));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [filter, category, statusFilter, viewMode]);

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
        setUploadLoading(true);
        try {
            const url = await uploadToCloudinary(e.target.files[0]);
            setNewItem(prev => ({ ...prev, imageUrl: url }));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            console.error('Upload error:', msg);
            alert('Upload failed: ' + msg);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleClaim = async (id: string, currentlyClaimed: boolean) => {
        if (currentlyClaimed) return;

        const token = localStorage.getItem('token');
        if (!confirm('Are you the owner of this item? Claiming implies you will visit the admin for verification.')) return;

        try {
            const res = await fetch(`/api/items/${id}/claim`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const item = items.find(i => i.id === id);
                const floorMsg = item?.locationFloor ? `Floor ${item.locationFloor}` : 'the designated';
                alert(`Item claimed! Please go to the Admin of ${floorMsg} for verification.`);
                fetchItems();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to claim');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleConfirmReceipt = async (id: string) => {
        const token = localStorage.getItem('token');
        if (!confirm('Confirm you have physically received this item from the Admin?')) return;

        try {
            const res = await fetch(`/api/items/${id}/return`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert('Receipt confirmed. Item process completed.');
                fetchItems();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to confirm receipt');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'REPORTED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'CLAIMED': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'HANDED_OVER': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'RECEIVED': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-[#070514] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            <Navbar />

            <main className="p-6 max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 mb-2"
                        >
                            {viewMode === 'BROWSE' ? 'Campus Lost & Found' : 'My Activity Dashboard'}
                        </motion.h1>
                        <p className="text-gray-400 font-medium">Find what you lost. Return what you found.</p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowReportModal(true)}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide shadow-xl shadow-purple-500/30 transition-all flex items-center gap-2 border border-white/10"
                    >
                        <span>+</span> Report Found Item
                    </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 mb-8 border-b border-white/10">
                    {['BROWSE', 'MY_CLAIMS'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => { setViewMode(mode as any); setFilter(''); setCategory(''); setStatusFilter(''); }}
                            className={`pb-4 px-2 font-semibold tracking-wide transition-all relative ${viewMode === mode ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {mode === 'BROWSE' ? 'Browse Found found Items' : 'My Claims & Reports'}
                            {viewMode === mode && (
                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
                    <div className="flex-1 min-w-[200px] relative">
                        <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search items by name..."
                            className="w-full pl-10 pr-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-500"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-300"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Books">Books</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Other">Other</option>
                    </select>

                    {viewMode === 'MY_CLAIMS' && (
                        <select
                            className="px-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-300"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="REPORTED">Reported</option>
                            <option value="CLAIMED">Claimed (Pending Verification)</option>
                            <option value="HANDED_OVER">Handed Over (Action Required)</option>
                            <option value="RECEIVED">Completed</option>
                        </select>
                    )}
                </motion.div>

                {/* Grid */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {loading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : items.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20">
                                <div className="text-6xl mb-4 opacity-50">📭</div>
                                <h3 className="text-xl font-bold text-gray-300 mb-2">No items found</h3>
                                <p className="text-gray-500">Try adjusting your filters or checking back later.</p>
                            </motion.div>
                        ) : (
                            items.map((item) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={item.id} 
                                    className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all backdrop-blur-md shadow-lg"
                                >
                                    <div className="h-56 bg-black/60 relative overflow-hidden flex items-center justify-center">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <span className="text-5xl text-gray-600 transition-transform duration-500 group-hover:scale-125">📷</span>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                                        
                                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xl ${getStatusStyle(item.status)}`}>
                                            {item.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-extrabold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{item.title}</h3>
                                        </div>
                                        <span className="inline-block px-2.5 py-1 mb-3 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                                            {item.category}
                                        </span>
                                        <p className="text-sm text-gray-400 mb-5 line-clamp-2 h-10">{item.description}</p>

                                        <div className="grid grid-cols-2 gap-3 text-xs font-medium text-gray-400 mb-5 bg-black/40 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-1.5"><span className="text-indigo-400">📅</span> {new Date(item.dateLost).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-1.5"><span className="text-purple-400">📍</span> Floor {item.locationFloor}</div>
                                        </div>

                                        {viewMode === 'BROWSE' && item.status === 'REPORTED' && (
                                            <button
                                                onClick={() => handleClaim(item.id, false)}
                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 hover:from-indigo-600 hover:to-purple-600 hover:text-white transition-all font-bold shadow-lg"
                                            >
                                                Claim This Item
                                            </button>
                                        )}

                                        {viewMode === 'MY_CLAIMS' && (
                                            <div className="space-y-3 mt-auto">
                                                {item.status === 'HANDED_OVER' && (
                                                    <button
                                                        onClick={() => handleConfirmReceipt(item.id)}
                                                        className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all font-bold shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Confirm Receipt
                                                    </button>
                                                )}
                                                {item.status === 'CLAIMED' && (
                                                    <div className="text-center font-bold text-amber-400 text-sm py-3 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                                                        Visit Admin to Verify
                                                    </div>
                                                )}
                                                {item.status === 'RECEIVED' && (
                                                    <div className="text-center font-bold text-purple-400 text-sm py-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-inner">
                                                        Process Completed ✓
                                                    </div>
                                                )}
                                                {item.status === 'REPORTED' && item.finderId === JSON.parse(localStorage.getItem('user') || '{}').id && (
                                                    <div className="text-center font-bold text-gray-400 text-sm py-3 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                                                        Awaiting Claim...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            {/* Premium Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-xl bg-gray-900 rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="p-8 pb-6 flex justify-between items-center border-b border-white/5">
                                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Report Found Item</h2>
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
                                        <input type="file" accept="image/*" disabled={uploadLoading} onChange={handleFileUpload} className="text-sm font-medium text-gray-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-wide file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer disabled:opacity-50" />
                                        {uploadLoading && <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full animate-pulse">Uploading...</span>}
                                        {!uploadLoading && newItem.imageUrl && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">✓ Uploaded</span>}
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold tracking-wide transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold tracking-wide shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5">Publish Report</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
