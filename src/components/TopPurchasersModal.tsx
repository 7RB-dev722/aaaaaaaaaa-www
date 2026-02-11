import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ProductKey } from '../lib/supabase';
import { X, Search, Trophy, Mail, ShoppingBag } from 'lucide-react';

interface TopPurchasersModalProps {
    keys: ProductKey[];
    onClose: () => void;
}

export const TopPurchasersModal: React.FC<TopPurchasersModalProps> = ({ keys, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const purchasers = useMemo(() => {
        const emailCounts = new Map<string, number>();
        
        // Count all keys assigned to an email
        keys.forEach(k => {
            if (k.used_by_email) {
                const email = k.used_by_email;
                emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
            }
        });

        // Convert to array and sort
        return Array.from(emailCounts.entries())
            .map(([email, count]) => ({ email, count }))
            .sort((a, b) => b.count - a.count);
    }, [keys]);

    const filteredPurchasers = useMemo(() => {
        if (!searchTerm) return purchasers;
        return purchasers.filter(p => p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [purchasers, searchTerm]);

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">أكثر العملاء شراءً</h2>
                            <p className="text-sm text-gray-400">قائمة العملاء مرتبة حسب عدد المفاتيح (النشطة والمنتهية)</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث بالبريد الإلكتروني..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-11 pl-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {filteredPurchasers.length > 0 ? (
                        <div className="space-y-2">
                            {filteredPurchasers.map((p, index) => (
                                <div 
                                    key={p.email} 
                                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono border
                                            ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                                              index === 1 ? 'bg-gray-400/20 text-gray-300 border-gray-400/30' : 
                                              index === 2 ? 'bg-orange-700/20 text-orange-400 border-orange-700/30' : 
                                              'bg-white/5 text-gray-500 border-white/10'}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-white font-medium">
                                                <Mail className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="font-mono text-sm">{p.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
                                        <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-cyan-400 font-bold font-mono">{p.count}</span>
                                        <span className="text-gray-500 text-xs">مفتاح</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <Search className="w-8 h-8 mb-2 opacity-20" />
                            <p>لا توجد نتائج مطابقة</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center text-xs text-gray-500">
                    <span>إجمالي العملاء: {filteredPurchasers.length}</span>
                </div>
            </div>
        </div>,
        document.body
    );
};
