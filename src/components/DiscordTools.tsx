import React, { useState } from 'react';
import { Send, FileText, User, MessageSquare, Check, AlertCircle, Eye } from 'lucide-react';
import { discordService } from '../lib/discordService';
import { useSettings } from '../contexts/SettingsContext';

interface DiscordToolsProps {
  webhookUrl?: string;
  avatarUrl?: string;
}

export const DiscordTools: React.FC<DiscordToolsProps> = ({ webhookUrl, avatarUrl }) => {
  const { settings: siteSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'message' | 'invoice' | 'dm'>('message');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    productName: '',
    price: '',
    orderId: '',
    status: 'Paid' as 'Paid' | 'Pending' | 'Refunded',
    customerName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Constants
  const effectiveWebhookUrl = webhookUrl || siteSettings.discord_webhook_url;
  const effectiveAvatarUrl = avatarUrl || siteSettings.discord_bot_avatar_url;
  const botToken = siteSettings.discord_bot_token;

  // Validation
  const validateUserId = (id: string) => /^\d{17,19}$/.test(id);

  const handleSendMessage = async () => {
    if (!effectiveWebhookUrl) {
      setError('Discord Webhook URL is not configured.');
      return;
    }
    if (!userId || !validateUserId(userId)) {
      setError('Please enter a valid Discord User ID (17-19 digits).');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await discordService.sendManualMessage(effectiveWebhookUrl, message, effectiveAvatarUrl, userId);
      setSuccess('Message sent successfully!');
      setMessage('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!botToken) {
      setError('Discord Bot Token is not configured in Settings.');
      return;
    }
    if (!userId || !validateUserId(userId)) {
      setError('Please enter a valid Discord User ID (17-19 digits).');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await discordService.sendDirectMessage(botToken, userId, message);
      setSuccess('Direct Message sent successfully!');
      setMessage('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send direct message. Ensure the bot shares a server with the user.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!effectiveWebhookUrl) {
      setError('Discord Webhook URL is not configured.');
      return;
    }
    if (!userId || !validateUserId(userId)) {
      setError('Please enter a valid Discord User ID (17-19 digits).');
      return;
    }
    if (!invoiceData.productName || !invoiceData.price) {
      setError('Please fill in at least Product Name and Price.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await discordService.sendInvoice(
        effectiveWebhookUrl,
        {
          ...invoiceData,
          date: new Date().toLocaleDateString(),
          orderId: invoiceData.orderId || `ORD-${Date.now()}` // Fallback if empty
        },
        effectiveAvatarUrl,
        userId
      );
      setSuccess('Invoice sent successfully!');
      setShowPreview(false);
      // Reset form optional
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          أدوات التواصل (Discord Tools)
        </h3>
        <div className="flex bg-black/40 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('message')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'message' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            إشعار في السيرفر
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'dm' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            رسالة خاصة (DM)
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'invoice' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            إرسال فاتورة
          </button>
        </div>
      </div>

      {/* Common User ID Input */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-300">معرف المستخدم (User ID)</label>
        <div className="relative">
          <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={`w-full bg-black/30 border rounded-xl pr-10 pl-4 py-3 text-white text-sm focus:outline-none transition-colors ${
              userId && !validateUserId(userId) ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-indigo-500'
            }`}
            placeholder="e.g. 944173427013603338"
          />
        </div>
        {userId && !validateUserId(userId) && (
          <p className="text-red-400 text-xs">User ID must be 17-19 digits long.</p>
        )}
      </div>

      {/* Message Tab */}
      {activeTab === 'message' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
             <p className="text-xs text-indigo-300">
               سيتم إرسال هذه الرسالة عبر <strong>Webhook</strong> إلى قناة السيرفر المحددة، مع الإشارة للمستخدم (@mention).
             </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">نص الرسالة</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-indigo-500 min-h-[120px]"
              placeholder="اكتب رسالتك هنا..."
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send className="w-5 h-5" />}
            إرسال للإشارة (Mention)
          </button>
        </div>
      )}

      {/* DM Tab */}
      {activeTab === 'dm' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
             <div className="text-xs text-purple-300 space-y-1">
               <p>سيتم إرسال هذه الرسالة كـ <strong>Direct Message (DM)</strong> من البوت مباشرة للمستخدم.</p>
               <p className="opacity-75">• يتطلب وجود توكن البوت في الإعدادات.</p>
               <p className="opacity-75">• يجب أن يشارك المستخدم سيرفراً مشتركاً مع البوت.</p>
             </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">نص الرسالة الخاصة</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-purple-500 min-h-[120px]"
              placeholder="اكتب رسالتك الخاصة هنا..."
            />
          </div>
          <button
            onClick={handleSendDirectMessage}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send className="w-5 h-5" />}
            إرسال رسالة خاصة (DM)
          </button>
        </div>
      )}

      {/* Invoice Tab */}
      {activeTab === 'invoice' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">المنتج</label>
              <input
                type="text"
                value={invoiceData.productName}
                onChange={(e) => setInvoiceData({ ...invoiceData, productName: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="اسم المنتج"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">السعر</label>
              <input
                type="text"
                value={invoiceData.price}
                onChange={(e) => setInvoiceData({ ...invoiceData, price: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="$0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">رقم الطلب (Order ID)</label>
              <input
                type="text"
                value={invoiceData.orderId}
                onChange={(e) => setInvoiceData({ ...invoiceData, orderId: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="تلقائي إذا ترك فارغاً"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">الحالة</label>
              <select
                value={invoiceData.status}
                onChange={(e) => setInvoiceData({ ...invoiceData, status: e.target.value as any })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="Paid">مدفوع (Paid)</option>
                <option value="Pending">قيد الانتظار (Pending)</option>
                <option value="Refunded">مسترجع (Refunded)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowPreview(true)}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10"
          >
            <Eye className="w-5 h-5" />
            معاينة الفاتورة
          </button>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreview && activeTab === 'invoice' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1e1f22] rounded-lg w-full max-w-md overflow-hidden border border-[#2b2d31]">
            <div className="p-4 border-b border-[#2b2d31] flex justify-between items-center bg-[#2b2d31]">
              <h4 className="text-white font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                معاينة الفاتورة (Discord Embed)
              </h4>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white">
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               {/* Simulation of Discord Message */}
               <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 shrink-0 overflow-hidden">
                     {effectiveAvatarUrl ? <img src={effectiveAvatarUrl} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                     <div className="flex items-baseline gap-2">
                        <span className="text-white font-medium">Cheatloop Billing</span>
                        <span className="text-xs text-gray-400 bg-[#5865F2] px-1 rounded-[3px] text-[10px] h-4 flex items-center">BOT</span>
                        <span className="text-xs text-gray-500">Today at {new Date().toLocaleTimeString()}</span>
                     </div>
                     <p className="text-gray-300 text-sm mt-1">
                        <span className="bg-[#5865f2]/30 text-[#dee0fc] rounded px-1">@{userId || 'user'}</span> Here is your invoice details:
                     </p>
                     
                     {/* Embed */}
                     <div className="mt-2 bg-[#2b2d31] border-l-4 border-green-500 rounded-r p-4 max-w-sm">
                        <div className="flex justify-between items-start mb-2">
                           <h5 className="text-white font-bold">🧾 Invoice Details</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                           <div>
                              <p className="text-gray-400 text-xs font-bold mb-0.5">Order ID</p>
                              <p className="text-gray-200">{invoiceData.orderId || 'ORD-PREVIEW'}</p>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs font-bold mb-0.5">Status</p>
                              <p className="text-gray-200">{invoiceData.status}</p>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs font-bold mb-0.5">Date</p>
                              <p className="text-gray-200">{new Date().toLocaleDateString()}</p>
                           </div>
                           <div className="col-span-2">
                              <p className="text-gray-400 text-xs font-bold mb-0.5">Product</p>
                              <p className="text-gray-200">{invoiceData.productName || 'Product Name'}</p>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs font-bold mb-0.5">Amount</p>
                              <p className="text-gray-200">{invoiceData.price || '$0.00'}</p>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs font-bold mb-0.5">Customer</p>
                              <p className="text-gray-200">{invoiceData.customerName || 'Valued Customer'}</p>
                           </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-600 flex items-center gap-2">
                           <p className="text-xs text-gray-400">Thank you for your business! • Today at {new Date().toLocaleTimeString()}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-4 bg-[#2b2d31] flex justify-end gap-3">
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-300 hover:text-white px-4 py-2 text-sm font-bold"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSendInvoice}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2"
              >
                {loading ? 'جاري الإرسال...' : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال الفاتورة الآن
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}
    </div>
  );
};
