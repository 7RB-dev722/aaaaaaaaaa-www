import React, { useState } from 'react';
import { X, Mail, Phone as PhoneIcon, ShieldCheck, Lock, Copy, Check } from 'lucide-react';
import { Translations } from '../translations/en';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { email: string; phone: string; }) => Promise<void> | void;
  translations: Translations;
}

const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({ isOpen, onClose, onSubmit, translations }) => {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) {
      setFormError(translations.formError);
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
        await onSubmit({
            email: customerEmail,
            phone: customerPhone,
        });

        // Reset form and close modal after submission
        setCustomerEmail('');
        setCustomerPhone('');
        onClose();
    } catch (err: any) {
        setFormError(err.message || 'An error occurred');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="relative bg-[#0f0f13] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{translations.modalTitle}</h2>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              Secure Transaction
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1 block">{translations.emailLabel}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input 
                type="email" 
                value={customerEmail} 
                onChange={(e) => setCustomerEmail(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 bg-[#1a1625] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-[#201c2d] transition-all" 
                placeholder={translations.emailPlaceholder} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1 block">{translations.phoneLabel}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <PhoneIcon className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input 
                type="tel" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 bg-[#1a1625] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-[#201c2d] transition-all" 
                placeholder={translations.phonePlaceholder} 
              />
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-400 text-sm text-center">
            سوف يتم نقلك الى الوتساب يرجى ارسال لقطة شاشة للتحويل
          </div>
          
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center animate-shake">
              {formError}
            </div>
          )}

          <div className="flex gap-3">
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                <>
                    <span>{translations.modalSubmitButton}</span>
                    <Lock className="w-4 h-4 opacity-70" />
                </>
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseDetailsModal;
