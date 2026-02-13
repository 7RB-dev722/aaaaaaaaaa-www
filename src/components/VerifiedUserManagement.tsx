import React, { useState, useEffect } from 'react';
import { verifiedUserService, VerifiedUser } from '../lib/supabase';
import { RefreshCw, X, AlertCircle, CheckCircle, Search, UserCheck, Trash2, Plus, ShieldCheck } from 'lucide-react';

const VerifiedUserManagement: React.FC = () => {
    const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Verified User Form State
    const [showAddVerified, setShowAddVerified] = useState(false);
    const [newVerifiedUsername, setNewVerifiedUsername] = useState('');
    const [newVerifiedProductType, setNewVerifiedProductType] = useState('cheatloop');

    const productTypes = [
        { id: 'cheatloop', name: 'Cheatloop' },
        { id: 'sinki', name: 'Sinki' },
        { id: 'sinki-silver', name: 'Sinki Silver' },
        { id: 'sinki-gold', name: 'Sinki Gold' },
        { id: 'sinki-tdm', name: 'Sinki TDM' }
    ];

    useEffect(() => {
        fetchVerifiedUsers();
    }, []);

    const fetchVerifiedUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetched = await verifiedUserService.getAll();
            setVerifiedUsers(fetched);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch verified users.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddVerified = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVerifiedUsername) return;

        setSaving(true);
        setError(null);
        try {
            await verifiedUserService.add(newVerifiedUsername, newVerifiedProductType);
            setSuccess(`تم إضافة ${newVerifiedUsername} بنجاح.`);
            setNewVerifiedUsername('');
            setShowAddVerified(false);
            fetchVerifiedUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'فشل في إضافة المستخدم الموثق.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteVerified = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التوثيق؟')) return;

        setLoading(true);
        setError(null);
        try {
            await verifiedUserService.delete(id);
            setSuccess('تم حذف التوثيق بنجاح.');
            fetchVerifiedUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'فشل في حذف التوثيق.');
            setLoading(false);
        }
    };

    const filteredVerified = verifiedUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.product_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-cyan-400" />
                        <span>الزبائن الموثقين</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">إدارة قائمة أسماء المستخدمين الموثقين لـ Cheatloop و Sinki</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={fetchVerifiedUsers} 
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                        title="تحديث القائمة"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setShowAddVerified(true)} 
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition-all flex-1 md:flex-none justify-center"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة موثق</span>
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-fade-in-up">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400 animate-fade-in-up">
                    <CheckCircle className="w-5 h-5" />
                    <span>{success}</span>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="بحث بالاسم أو نوع المنتج..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all text-right"
                />
            </div>

            {/* Verified Users Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="p-5">اسم المستخدم</th>
                                <th className="p-5 text-center">نوع المنتج</th>
                                <th className="p-5">تاريخ الإضافة</th>
                                <th className="p-5 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                                            <span>جاري تحميل الموثقين...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVerified.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-5 font-bold text-white">{user.username}</td>
                                    <td className="p-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            user.product_type.includes('cheatloop') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                            {productTypes.find(t => t.id === user.product_type)?.name || user.product_type}
                                        </span>
                                    </td>
                                    <td className="p-5 text-sm text-gray-400">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteVerified(user.id)}
                                                className="p-2 bg-black hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg border border-white/10 hover:border-red-500/30 transition-colors"
                                                title="حذف التوثيق"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredVerified.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500">
                                        لم يتم العثور على موثقين.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Verified Modal */}
            {showAddVerified && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">إضافة مستخدم موثق جديد</h3>
                            <button onClick={() => setShowAddVerified(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddVerified} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1 text-right">اسم المستخدم</label>
                                <input 
                                    type="text" 
                                    value={newVerifiedUsername} 
                                    onChange={e => setNewVerifiedUsername(e.target.value)} 
                                    className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none text-right"
                                    placeholder="أدخل اسم المستخدم (Cheatloop/Sinki)"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1 text-right">نوع المنتج</label>
                                <select 
                                    value={newVerifiedProductType} 
                                    onChange={e => setNewVerifiedProductType(e.target.value)} 
                                    className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    {productTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowAddVerified(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={saving} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                                    {saving ? 'جاري الإضافة...' : 'إضافة إلى التوثيق'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerifiedUserManagement;
