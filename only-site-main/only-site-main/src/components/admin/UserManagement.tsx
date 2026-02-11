import React, { useState, useEffect } from 'react';
import { userService, AuthUser } from '@/lib/supabase';
import { RefreshCw, KeyRound, X, AlertCircle, CheckCircle, Search } from 'lucide-react';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

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

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">User Management ({filteredUsers.length})</h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-xl text-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <button onClick={fetchUsers} disabled={loading} className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-center flex items-center justify-center space-x-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
            {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center flex items-center justify-center space-x-2"><CheckCircle className="w-5 h-5" /><span>{success}</span></div>}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th className="p-3 text-left font-medium text-gray-300">Email</th>
                            <th className="p-3 text-left font-medium text-gray-300">Created At</th>
                            <th className="p-3 text-left font-medium text-gray-300">Last Sign In</th>
                            <th className="p-3 text-left font-medium text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-400">Loading users...</td></tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-3 text-white font-medium">{user.email}</td>
                                    <td className="p-3 text-gray-400">{new Date(user.created_at).toLocaleString()}</td>
                                    <td className="p-3 text-gray-400">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
                                    <td className="p-3">
                                        <button onClick={() => setEditingUser(user)} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors" title="Change Password">
                                            <KeyRound className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={4} className="text-center p-8 text-gray-400">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

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
