import React, { useState, useEffect } from 'react';
import { userService, AuthUser, verifiedUserService, VerifiedUser } from '@/lib/supabase';
import { RefreshCw, KeyRound, X, AlertCircle, CheckCircle, Search, UserCheck, Users, Trash2, Plus } from 'lucide-react';

const UserManagement: React.FC = () => {
    const [view, setView] = useState<'users' | 'verified'>('users');
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Verified User Form State
    const [showAddVerified, setShowAddVerified] = useState(false);
    const [newVerifiedUsername, setNewVerifiedUsername] = useState('');
    const [newVerifiedProductType, setNewVerifiedProductType] = useState('cheatloop');

    useEffect(() => {
        if (view === 'users') {
            fetchUsers();
        } else {
            fetchVerifiedUsers();
        }
    }, [view]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedUsers = await userService.getUsers();
            setUsers(fetchedUsers);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

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

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !newPassword) {
            setError('Please select a user and enter a new password.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await userService.updateUserPassword(editingUser.id, newPassword);
            setSuccess(`Password for ${editingUser.email} updated successfully.`);
            setEditingUser(null);
            setNewPassword('');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password.');
        } finally {
            setSaving(false);
        }
    };
    
    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredVerified = verifiedUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.product_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">إدارة المستخدمين</h3>
                    <div className="flex bg-slate-700 p-1 rounded-xl">
                        <button
                            onClick={() => setView('users')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                                view === 'users' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            مستخدمي النظام
                        </button>
                        <button
                            onClick={() => setView('verified')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                                view === 'verified' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <UserCheck className="w-4 h-4" />
                            الموثقين
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={view === 'users' ? "البحث بالبريد..." : "البحث بالاسم أو المنتج..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-slate-700 border border-slate-600 rounded-xl text-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    {view === 'verified' && (
                        <button 
                            onClick={() => setShowAddVerified(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm transition-colors shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            إضافة موثق
                        </button>
                    )}
                    <button onClick={view === 'users' ? fetchUsers : fetchVerifiedUsers} disabled={loading} className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-center flex items-center justify-center space-x-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
            {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center flex items-center justify-center space-x-2"><CheckCircle className="w-5 h-5" /><span>{success}</span></div>}

            <div className="overflow-x-auto">
                {view === 'users' ? (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-700/50 text-right">
                            <tr>
                                <th className="p-3 font-medium text-gray-300">البريد الإلكتروني</th>
                                <th className="p-3 font-medium text-gray-300">تاريخ الإنشاء</th>
                                <th className="p-3 font-medium text-gray-300">آخر دخول</th>
                                <th className="p-3 font-medium text-gray-300 text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-400">جاري تحميل المستخدمين...</td></tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                                        <td className="p-3 text-white font-medium text-right">{user.email}</td>
                                        <td className="p-3 text-gray-400 text-right">{new Date(user.created_at).toLocaleString()}</td>
                                        <td className="p-3 text-gray-400 text-right">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
                                        <td className="p-3 text-left">
                                            <button onClick={() => setEditingUser(user)} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors" title="تغيير كلمة المرور">
                                                <KeyRound className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-400">لم يتم العثور على مستخدمين.</td></tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-700/50 text-right">
                            <tr>
                                <th className="p-3 font-medium text-gray-300">اسم المستخدم</th>
                                <th className="p-3 font-medium text-gray-300">نوع المنتج</th>
                                <th className="p-3 font-medium text-gray-300">تاريخ الإضافة</th>
                                <th className="p-3 font-medium text-gray-300 text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-400">جاري تحميل الموثقين...</td></tr>
                            ) : filteredVerified.length > 0 ? (
                                filteredVerified.map(user => (
                                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                                        <td className="p-3 text-white font-medium text-right">{user.username}</td>
                                        <td className="p-3 text-right">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                                user.product_type === 'cheatloop' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {user.product_type}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-400 text-right">{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</td>
                                        <td className="p-3 text-left">
                                            <button 
                                                onClick={() => handleDeleteVerified(user.id)} 
                                                className="p-2 text-red-400 hover:text-red-300 transition-colors" 
                                                title="حذف التوثيق"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-400">لم يتم العثور على موثقين.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for Adding Verified User */}
            {showAddVerified && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">إضافة مستخدم موثق جديد</h3>
                            <button onClick={() => { setShowAddVerified(false); setNewVerifiedUsername(''); setError(null); }} className="p-2 text-gray-400 hover:text-white rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddVerified} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">اسم المستخدم</label>
                                <input
                                    type="text"
                                    value={newVerifiedUsername}
                                    onChange={(e) => setNewVerifiedUsername(e.target.value)}
                                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-right"
                                    placeholder="أدخل اسم المستخدم"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">نوع المنتج</label>
                                <select
                                    value={newVerifiedProductType}
                                    onChange={(e) => setNewVerifiedProductType(e.target.value)}
                                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="cheatloop">Cheatloop</option>
                                    <option value="sinki">Sinki</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => { setShowAddVerified(false); setNewVerifiedUsername(''); setError(null); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">إلغاء</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                                    {saving ? 'جاري الإضافة...' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Change Password</h3>
                            <button onClick={() => { setEditingUser(null); setNewPassword(''); setError(null); }} className="p-2 text-gray-400 hover:text-white rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-6">Set a new password for <strong className="text-white">{editingUser.email}</strong>.</p>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="Enter new password (min. 6 characters)"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => { setEditingUser(null); setNewPassword(''); setError(null); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                                    {saving ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
