import React, { useState } from 'react';
import { X, Mail, Phone as PhoneIcon } from 'lucide-react';
import { Translations } from '../translations/en';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { email: string; phone: string; }) => void;
  translations: Translations;
}

const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({ isOpen, onClose, onSubmit, translations }) => {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) {
      setFormError(translations.formError);
      return;
    }
    setFormError('');

    onSubmit({
      email: customerEmail,
      phone: customerPhone,
    });

    // Reset form and close modal after submission
    setCustomerEmail('');
    setCustomerPhone('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{translations.modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{translations.emailLabel}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder={translations.emailPlaceholder} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{translations.phoneLabel}</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder={translations.phonePlaceholder} />
            </div>
          </div>
          
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
              {formError}
            </div>
          )}
          <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
            {translations.modalSubmitButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchaseDetailsModal;
