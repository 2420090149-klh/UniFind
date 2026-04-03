'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Admin = { id: string; name: string; email: string; permissions?: string };
type Item = {
    id: string; title: string; description: string; category: string;
    status: string; locationFloor: string; locationRoom: string;
    imageUrl?: string; dateLost: string; createdAt: string;
};
type UserInfo = { id: string; name: string; email: string } | null;
type ItemDetail = { item: Item; finder: UserInfo; owner: UserInfo } | null;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    REPORTED: { label: 'Reported', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', dot: 'bg-emerald-400' },
    CLAIMED: { label: 'Claimed', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', dot: 'bg-amber-400' },
    HANDED_OVER: { label: 'Handed Over', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40', dot: 'bg-blue-400' },
    RECEIVED: { label: 'Received', color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/40', dot: 'bg-violet-400' },
};

const PERMISSIONS_LIST = ['MANAGE_USERS', 'APPROVE_CLAIMS', 'DELETE_ITEMS', 'VIEW_ALL_DATA'];

export default function SuperAdminDashboard() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [activeTab, setActiveTab] = useState<'admins' | 'data'>('admins');
    const [newAdmin, setNewAdmin] = useState({ email: '', name: '', password: '', permissions: '' });
    const [selectedDetail, setSelectedDetail] = useState<ItemDetail>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [editAdminConfig, setEditAdminConfig] = useState<Admin | null>(null);
    const router = useRouter();

    const [newItem, setNewItem] = useState({
        title: '', description: '', category: 'Electronics', dateLost: '', locationFloor: '', locationRoom: '', imageUrl: ''
    });

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/super-admin/admins', { headers: { Authorization: `Bearer ${token}` } });
            if (res.status === 403) { alert('Access Denied'); router.push('/'); return; }
            const data = await res.json();
            if (data.admins) setAdmins(data.admins);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [router]);

    const fetchAllItems = useCallback(async () => {
        setLoadingItems(true);
        const token = localStorage.getItem('token');
        const subdomain = window.location.pathname.split('/')[1];
        try {
            const res = await fetch(`/api/items?subdomain=${subdomain}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (e) { console.error(e); }
        finally { setLoadingItems(false); }
    }, []);

    useEffect(() => { fetchAdmins(); fetchAllItems(); }, [fetchAdmins, fetchAllItems]);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/super-admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newAdmin)
            });
            const data = await res.json();
            if (res.ok) {
                setNewAdmin({ email: '', name: '', password: '', permissions: '' });
                setFormOpen(false);
                fetchAdmins();
            } else { alert(data.error); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm('Remove this admin?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/super-admin/admins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) fetchAdmins();
            else alert('Failed to delete admin');
        } catch (e) { console.error(e); }
    };

    const handleUpdateAdminPerms = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAdminConfig) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/super-admin/admins/${editAdminConfig.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ permissions: editAdminConfig.permissions })
            });
            if (res.ok) {
                setEditAdminConfig(null);
                fetchAdmins();
            } else alert('Failed to update permissions');
        } catch (e) { console.error(e); }
    };

    const openDetail = async (item: Item) => {
        setDetailLoading(true);
        setSelectedDetail({ item, finder: null, owner: null });
        try {
            const res = await fetch(`/api/items/${item.id}`);
            const data = await res.json();
            if (data.item) setSelectedDetail(data);
        } catch (e) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    const togglePerm = (perm: string) => {
        const current = newAdmin.permissions ? newAdmin.permissions.split(',').filter(Boolean) : [];
        const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
        setNewAdmin({ ...newAdmin, permissions: updated.join(',') });
    };

    const toggleEditPerm = (perm: string) => {
        if (!editAdminConfig) return;
        const current = editAdminConfig.permissions ? editAdminConfig.permissions.split(',').filter(Boolean) : [];
        const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
        setEditAdminConfig({ ...editAdminConfig, permissions: updated.join(',') });
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
            } else { alert('Upload failed'); }
        } catch (err) { console.error(err); }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const subdomain = window.location.pathname.split('/')[1];
        if (!token) return;

        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...newItem, subdomain }),
            });
            if (res.ok) {
                setShowReportModal(false);
                setNewItem({ title: '', description: '', category: 'Electronics', dateLost: '', locationFloor: '', locationRoom: '', imageUrl: '' });
                fetchAllItems();
            } else { alert('Failed to add item'); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('WARNING: As Super Admin, you are permanently purging this item record from the dataset. Proceed?')) return;
        const token = localStorage.getItem('token');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                setSelectedDetail(null);
                fetchAllItems();
            } else { alert('Failed to delete item'); }
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    const stats = [
        { label: 'Total Admins', value: admins.length, icon: '👑', grad: 'from-rose-600/20 to-orange-600/20', border: 'border-orange-500/30' },
        { label: 'Total Items', value: items.length, icon: '📦', grad: 'from-violet-600/20 to-purple-600/20', border: 'border-purple-500/30' },
        { label: 'Active Claims', value: items.filter(i => i.status === 'CLAIMED').length, icon: '⏳', grad: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30' },
        { label: 'Completed', value: items.filter(i => i.status === 'RECEIVED').length, icon: '✅', grad: 'from-emerald-600/20 to-teal-600/20', border: 'border-emerald-500/30' },
    ];

    return (
        <div className="min-h-screen text-white bg-[#0a0208] relative overflow-hidden">
            <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

            <Navbar />

            {/* Header */}
            <div className="border-b border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-rose-500/20" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>⚡</div>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-rose-400 to-orange-500">
                                Super Administrator
                            </h1>
                        </motion.div>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-gray-400 ml-14 font-medium">Global system visibility and user management</motion.p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {stats.map((s, i) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={s.label} className={`rounded-2xl p-6 border ${s.border} bg-gradient-to-br ${s.grad} backdrop-blur-md shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all`}>
                            <div className="text-3xl mb-3 drop-shadow-md">{s.icon}</div>
                            <div className="text-4xl font-black mb-1 drop-shadow-sm">{s.value}</div>
                            <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 p-1.5 rounded-2xl w-fit bg-black/40 border border-white/10 backdrop-blur-xl">
                    {[{ key: 'admins' as const, label: '👑 Manage Admins' }, { key: 'data' as const, label: '📊 Global Dataset' }].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${activeTab === tab.key ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #e11d48, #ea580c)' } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ====== ADMIN MANAGEMENT TAB ====== */}
                    {activeTab === 'admins' && (
                        <motion.div key="admins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            {/* Add Admin Card */}
                            <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
                                <button
                                    onClick={() => setFormOpen(!formOpen)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #e11d48, #ea580c)' }}>+</div>
                                        <span className="font-extrabold text-lg tracking-wide">Provision Floor Admin</span>
                                    </div>
                                    <span className="text-gray-400 font-bold text-xl transition-transform" style={{ transform: formOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                                </button>

                                <AnimatePresence>
                                    {formOpen && (
                                        <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleAddAdmin} className="px-8 pb-8 space-y-6 border-t border-white/10 pt-6 overflow-hidden">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                {[
                                                    { placeholder: 'Admin Full Name', type: 'text', field: 'name' as const },
                                                    { placeholder: 'Security Email Address', type: 'email', field: 'email' as const },
                                                    { placeholder: 'Secure Password', type: 'password', field: 'password' as const },
                                                ].map(({ placeholder, type, field }) => (
                                                    <input
                                                        key={field}
                                                        type={type}
                                                        placeholder={placeholder}
                                                        required
                                                        value={newAdmin[field]}
                                                        onChange={e => setNewAdmin({ ...newAdmin, [field]: e.target.value })}
                                                        className="w-full p-4 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-gray-600"
                                                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Grant System Permissions</p>
                                                <div className="flex flex-wrap gap-4">
                                                    {PERMISSIONS_LIST.map(perm => (
                                                        <label key={perm} className="flex items-center gap-2.5 cursor-pointer group">
                                                            <div
                                                                onClick={() => togglePerm(perm)}
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${newAdmin.permissions?.includes(perm) ? 'bg-gradient-to-br from-rose-500 to-orange-500 shadow-md shadow-rose-500/20' : 'bg-black/50 group-hover:bg-white/10'}`}
                                                                style={{ border: newAdmin.permissions?.includes(perm) ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
                                                            >
                                                                {newAdmin.permissions?.includes(perm) && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-xs font-bold">✓</motion.span>}
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-300">{perm.replace(/_/g, ' ')}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 pt-2">
                                                <button type="button" onClick={() => setFormOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
                                                <button type="submit" className="px-8 py-3 rounded-xl font-extrabold tracking-wide transition-all shadow-lg hover:shadow-rose-500/20 active:scale-95 text-white" style={{ background: 'linear-gradient(135deg, #e11d48, #ea580c)' }}>
                                                    Deploy Admin Account
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Existing Admins */}
                            <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
                                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                                    <h2 className="font-extrabold text-xl tracking-wide">Active Floor Administrators</h2>
                                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}>{admins.length} Deployed</span>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-rose-500/20" />
                                        </div>
                                    ) : admins.length === 0 ? (
                                        <div className="text-center font-medium py-10 text-gray-500">No organizational admins present.</div>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {admins.map(admin => (
                                                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={admin.id} className="flex flex-col p-5 rounded-2xl group relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-rose-500/20" style={{ background: 'linear-gradient(135deg, #e11d48, #ea580c)' }}>
                                                            {admin.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-10">
                                                            <div className="font-extrabold text-lg text-white truncate">{admin.name}</div>
                                                            <div className="text-sm font-medium text-gray-400 truncate mb-3">{admin.email}</div>
                                                            {admin.permissions && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {admin.permissions.split(',').filter(Boolean).map(p => (
                                                                        <span key={p} className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}>
                                                                            {p.replace(/_/g, ' ')}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAdmin(admin.id)}
                                                        className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20 outline-none"
                                                        style={{ border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}
                                                        title="Revoke Admin Access"
                                                    >
                                                        🗑️
                                                    </button>
                                                    <button
                                                        onClick={() => setEditAdminConfig(admin)}
                                                        className="absolute top-4 right-16 w-10 h-10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500/20 outline-none"
                                                        style={{ border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
                                                        title="Edit Permissions"
                                                    >
                                                        ✏️
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ====== ALL DATA TAB ====== */}
                    {activeTab === 'data' && (
                        <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            
                            {/* Toolbar */}
                            <div className="flex justify-between items-center bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                                <h2 className="font-extrabold text-xl tracking-wide px-2">Global Dataset</h2>
                                <button onClick={() => setShowReportModal(true)} className="px-5 py-2.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all shadow-lg hover:shadow-rose-500/20 active:scale-95 text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #e11d48, #ea580c)' }}>
                                    <span>+</span> Add Item
                                </button>
                            </div>

                            <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl p-6">
                                {loadingItems ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-rose-500/20" />
                                    </div>
                                ) : items.length === 0 ? (
                                    <div className="text-center font-medium py-16 text-gray-500">No items tracked system-wide.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        <AnimatePresence>
                                            {items.map(item => {
                                                const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['REPORTED'];
                                                return (
                                                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                        key={item.id}
                                                        className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
                                                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                                                        onClick={() => openDetail(item)}
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="h-44 relative overflow-hidden bg-black flex items-center justify-center">
                                                            {item.imageUrl ? (
                                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="text-5xl text-gray-600 transition-transform duration-500 group-hover:scale-125">📷</div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                                                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-xl ${sc.bg} ${sc.color}`}>
                                                                <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />
                                                                {sc.label}
                                                            </div>
                                                        </div>
                                                        <div className="p-5">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <h3 className="font-extrabold text-base text-white group-hover:text-rose-400 transition-colors line-clamp-1">{item.title}</h3>
                                                            </div>
                                                            <span className="inline-block px-2.5 py-1 mb-3 rounded-md bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-300 tracking-wider">
                                                                {item.category}
                                                            </span>
                                                            <div className="flex items-center justify-between text-xs font-bold text-gray-500 bg-black/40 p-2.5 rounded-lg border border-white/5 mt-auto">
                                                                <span><span className="text-purple-400">📍</span> Fl. {item.locationFloor}</span>
                                                                <span className="text-rose-400 group-hover:underline">Audit Data →</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ======= ADD ITEM MODAL ======= */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-xl bg-gray-900 rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(244,63,94,0.2)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500" />
                            <div className="p-8 pb-6 flex justify-between items-center border-b border-white/5">
                                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-500">Add Found Item</h2>
                                <button onClick={() => setShowReportModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
                            </div>
                            <form onSubmit={handleReportSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f43f5e transparent' }}>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Title</label>
                                    <input required type="text" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-medium placeholder:text-gray-600" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="e.g. MacBook Air" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                    <select className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-medium text-gray-200" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Books">Books</option>
                                        <option value="Bottle">Bottle</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <textarea required rows={3} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-medium placeholder:text-gray-600 resize-none" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Distinctive features..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date Found</label>
                                    <input required type="date" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-medium text-gray-200" value={newItem.dateLost} onChange={e => setNewItem({ ...newItem, dateLost: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Floor No.</label>
                                        <input type="text" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-medium placeholder:text-gray-600" value={newItem.locationFloor} onChange={e => setNewItem({ ...newItem, locationFloor: e.target.value })} placeholder="2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Room No.</label>
                                        <input type="text" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-medium placeholder:text-gray-600" value={newItem.locationRoom} onChange={e => setNewItem({ ...newItem, locationRoom: e.target.value })} placeholder="C204" />
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
                                    <button type="submit" className="flex-1 py-4 rounded-xl text-white font-extrabold tracking-wide shadow-lg shadow-rose-500/30 transition-all transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #e11d48, #ea580c)' }}>Deploy to System</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ====== ITEM DETAIL MODAL ====== */}
            <AnimatePresence>
                {selectedDetail && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(5,2,4,0.85)', backdropFilter: 'blur(16px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetail(null); }}
                    >
                        <motion.div initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_20px_100px_rgba(244,63,94,0.15)] max-h-[90vh] overflow-y-auto relative"
                            style={{ background: '#0a0208', border: '1px solid rgba(255,255,255,0.08)' }}>

                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 z-10" />

                            <div className="flex justify-between items-center p-6 border-b border-white/5 sticky top-0 bg-[#0a0208]/90 backdrop-blur-md z-10">
                                <h2 className="text-xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-500">
                                    System Content Audit
                                </h2>
                                <button onClick={() => setSelectedDetail(null)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
                            </div>

                            {detailLoading ? (
                                <div className="flex items-center justify-center py-24">
                                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-rose-500/20" />
                                </div>
                            ) : (
                                <div>
                                    {selectedDetail.item.imageUrl && (
                                        <div className="h-72 relative overflow-hidden bg-black flex items-center justify-center">
                                            <img src={selectedDetail.item.imageUrl} alt={selectedDetail.item.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0208] via-transparent to-transparent opacity-90" />
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
                                                { label: 'Database Addition', value: new Date(selectedDetail.item.createdAt).toLocaleDateString(), icon: '🕐' },
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
                                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-inner">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg bg-rose-500/20 border border-rose-500/30">🔍</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-1">Reporter / Finder</div>
                                                    {selectedDetail.finder
                                                        ? (<><div className="font-bold text-base text-gray-100">{selectedDetail.finder.name}</div><div className="text-sm text-gray-400 truncate font-medium">{selectedDetail.finder.email}</div></>)
                                                        : <div className="text-sm font-semibold text-gray-500 italic mt-1">System Add / No Data</div>
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

                                        <div className="pt-4 border-t border-white/5 mt-8">
                                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1 mb-4">Master Administration Data Actions</h4>
                                            
                                            {/* Delete — always available to super admin */}
                                            <button
                                                onClick={() => handleDeleteItem(selectedDetail.item.id)}
                                                disabled={actionLoading}
                                                className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                                style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                                            >
                                                <span>⚠️</span> Force Purge Record from System
                                            </button>
        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= EDIT ADMIN PERMISSIONS MODAL ======= */}
            <AnimatePresence>
                {editAdminConfig && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-gray-900 rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="p-8 pb-6 flex justify-between items-center border-b border-white/5">
                                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Edit Admin Permissions</h2>
                                <button onClick={() => setEditAdminConfig(null)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
                            </div>
                            <form onSubmit={handleUpdateAdminPerms} className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-white">{editAdminConfig.name}</h3>
                                    <p className="text-sm font-medium text-gray-400">{editAdminConfig.email}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Modify System Permissions</p>
                                    <div className="flex flex-col gap-4">
                                        {PERMISSIONS_LIST.map(perm => (
                                            <label key={perm} className="flex items-center gap-2.5 cursor-pointer group">
                                                <div
                                                    onClick={() => toggleEditPerm(perm)}
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${editAdminConfig.permissions?.includes(perm) ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-md shadow-blue-500/20' : 'bg-black/50 group-hover:bg-white/10'}`}
                                                    style={{ border: editAdminConfig.permissions?.includes(perm) ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
                                                >
                                                    {editAdminConfig.permissions?.includes(perm) && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-xs font-bold">✓</motion.span>}
                                                </div>
                                                <span className="text-sm font-bold text-gray-300">{perm.replace(/_/g, ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-4">
                                    <button type="button" onClick={() => setEditAdminConfig(null)} className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold tracking-wide transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 rounded-xl text-white font-extrabold tracking-wide shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>Update Access</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
