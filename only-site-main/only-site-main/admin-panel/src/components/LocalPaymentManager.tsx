import React, { useState, useEffect } from 'react';
import { localPaymentService, LocalPaymentMethod } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Globe } from 'lucide-react';

const SUPPORTED_COUNTRIES = ['Iraq', 'Turkey', 'Jordan'];

const LocalPaymentManager: React.FC = () => {
  const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<Partial<LocalPaymentMethod>>({
    country: 'Iraq',
    method_name: '',
    account_holder: '',
    account_number: '',
    iban: '',
    custom_price: '',
    is_active: true
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await localPaymentService.getAll();
      setMethods(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMethod.country || !currentMethod.method_name) {
      setError('Country and Method Name are required.');
      return;
    }

    try {
      if (currentMethod.id) {
        await localPaymentService.updateMethod(currentMethod.id, currentMethod);
        setSuccess('Method updated successfully.');
      } else {
        await localPaymentService.addMethod(currentMethod as Omit<LocalPaymentMethod, 'id' | 'created_at'>);
        setSuccess('Method added successfully.');
      }
      setIsEditing(false);
      resetForm();
      loadMethods();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await localPaymentService.deleteMethod(id);
      setSuccess('Method deleted successfully.');
      loadMethods();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (method: LocalPaymentMethod) => {
    setCurrentMethod(method);
    setIsEditing(true);
  };

  const resetForm = () => {
    setCurrentMethod({
      country: 'Iraq',
      method_name: '',
      account_holder: '',
      account_number: '',
      iban: '',
      custom_price: '',
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-cyan-400" />
          Local Payment Methods
        </h2>
        <button 
          onClick={() => { resetForm(); setIsEditing(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" /> Add Method
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2"><AlertCircle className="w-5 h-5"/>{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5"/>{success}</div>}

      {isEditing && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-fade-in-up">
          <h3 className="text-lg font-bold text-white mb-4">{currentMethod.id ? 'Edit Method' : 'Add New Method'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
              <select 
                value={currentMethod.country}
                onChange={(e) => setCurrentMethod({...currentMethod, country: e.target.value})}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                {SUPPORTED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Method Name</label>
              <input 
                type="text" 
                value={currentMethod.method_name}
                onChange={(e) => setCurrentMethod({...currentMethod, method_name: e.target.value})}
                placeholder="e.g. Super Key, Zain Cash"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Holder Name</label>
              <input 
                type="text" 
                value={currentMethod.account_holder || ''}
                onChange={(e) => setCurrentMethod({...currentMethod, account_holder: e.target.value})}
                placeholder="e.g. Abdulawatban"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Number / Card</label>
              <input 
                type="text" 
                value={currentMethod.account_number || ''}
                onChange={(e) => setCurrentMethod({...currentMethod, account_number: e.target.value})}
                placeholder="e.g. 3923864171"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IBAN (Optional)</label>
              <input 
                type="text" 
                value={currentMethod.iban || ''}
                onChange={(e) => setCurrentMethod({...currentMethod, iban: e.target.value})}
                placeholder="IBAN..."
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom Price / Instruction</label>
              <input 
                type="text" 
                value={currentMethod.custom_price || ''}
                onChange={(e) => setCurrentMethod({...currentMethod, custom_price: e.target.value})}
                placeholder="e.g. 50,000 IQD"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={currentMethod.is_active}
                onChange={(e) => setCurrentMethod({...currentMethod, is_active: e.target.checked})}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
              />
              <label className="text-gray-300">Active</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors"
              >
                Save Method
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-slate-700/50 text-gray-200 font-medium">
            <tr>
              <th className="p-4">Country</th>
              <th className="p-4">Method</th>
              <th className="p-4">Details</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {methods.map(method => (
              <tr key={method.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-4 text-white font-medium">{method.country}</td>
                <td className="p-4">{method.method_name}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    {method.account_holder && <span>Holder: {method.account_holder}</span>}
                    {method.account_number && <span>No: {method.account_number}</span>}
                  </div>
                </td>
                <td className="p-4 text-cyan-400">{method.custom_price || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${method.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {method.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(method)} className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(method.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {methods.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No payment methods found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocalPaymentManager;
