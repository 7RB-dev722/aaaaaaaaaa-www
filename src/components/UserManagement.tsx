import React, { useState, useEffect } from 'react';
import { userService, AuthUser } from '../lib/supabase';
import { Users, UserPlus, Key, RefreshCw, AlertCircle, CheckCircle, Search, Trash2, ShieldAlert, ShieldCheck, Mail } from 'lucide-react';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Create User State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    // Update Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword) {
            setError('Please fill in all fields.');
            return;
        }
        setActionLoading(true);
        setError(null);
        try {
            await userService.createUser(newUserEmail, newUserPassword);
            setSuccess('User created successfully!');
            setShowCreateModal(false);
            setNewUserEmail('');
            setNewUserPassword('');
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;
        
        setActionLoading(true);
        setError(null);
        try {
            await userService.updateUserPassword(selectedUser.id, newPassword);
            setSuccess(`Password updated for ${selectedUser.email}`);
            setShowPasswordModal(false);
            setNewPassword('');
            setSelectedUser(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleBan = async (user: AuthUser) => {
        const isBanned = !!user.banned_until && new Date(user.banned_until) > new Date();
        const action = isBanned ? 'unban' : 'ban';
        
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        setActionLoading(true);
        try {
            await userService.toggleUserBan(user.id, isBanned);
            setSuccess(`User ${action}ned successfully.`);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (user.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-400" />
                        <span>إدارة المستخدمين</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">إدارة حسابات المسؤولين والمستخدمين</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={fetchUsers} 
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                        title="تحديث القائمة"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setShowCreateModal(true)} 
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all flex-1 md:flex-none justify-center"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>مستخدم جديد</span>
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-fade-in-up">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto hover:text-white"><Trash2 className="w-4 h-4" /></button>
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
                    placeholder="بحث عن مستخدم (البريد الإلكتروني أو المعرف)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="p-5 text-right">المستخدم</th>
                                <th className="p-5 text-right">تاريخ التسجيل</th>
                                <th className="p-5 text-right">آخر ظهور</th>
                                <th className="p-5 text-center">الحالة</th>
                                <th className="p-5 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => {
                                const isBanned = !!user.banned_until && new Date(user.banned_until) > new Date();
                                return (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5 text-right">
                                            <div className="flex items-center gap-3 justify-end">
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-2 justify-end">
                                                        {user.email} <Mail className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{user.id}</div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {user.email?.[0].toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right text-sm text-gray-300">
                                            {new Date(user.created_at).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="p-5 text-right text-sm text-gray-300">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : 'Never'}
                                        </td>
                                        <td className="p-5 text-center">
                                            {isBanned ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
                                                    <ShieldAlert className="w-3 h-3" /> محظور
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold">
                                                    <ShieldCheck className="w-3 h-3" /> نشط
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                                                    className="p-2 bg-black hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors"
                                                    title="تغيير كلمة المرور"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleBan(user)}
                                                    className={`p-2 bg-black rounded-lg border border-white/10 transition-colors ${isBanned ? 'hover:bg-green-500/10 text-gray-400 hover:text-green-400 hover:border-green-500/30' : 'hover:bg-red-500/10 text-gray-400 hover:text-red-400 hover:border-red-500/30'}`}
                                                    title={isBanned ? "إلغاء الحظر" : "حظر المستخدم"}
                                                >
                                                    {isBanned ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        لا يوجد مستخدمين مطابقين للبحث.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-4">إضافة مستخدم جديد</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">البريد الإلكتروني</label>
                                <input 
                                    type="email" 
                                    value={newUserEmail} 
                                    onChange={e => setNewUserEmail(e.target.value)} 
                                    className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">كلمة المرور</label>
                                <input 
                                    type="password" 
                                    value={newUserPassword} 
                                    onChange={e => setNewUserPassword(e.target.value)} 
                                    className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                    required 
                                    minLength={6}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                                    {actionLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Update Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-2">تغيير كلمة المرور</h3>
                        <p className="text-gray-400 text-sm mb-4">للمستخدم: {selectedUser.email}</p>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">كلمة المرور الجديدة</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    required 
                                    minLength={6}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                                    {actionLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
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
