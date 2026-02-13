import React, { useRef } from 'react';
import { Save, UploadCloud, Globe, MessageCircle, Phone, Layout, Shield, Zap, Target, Image as ImageIcon, Type, ExternalLink, FileText, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteContentEditorProps {
  settings: Record<string, string>;
  onSettingsChange: (newSettings: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
  setSaving: (s: boolean) => void;
  setError: (e: string | null) => void;
  setSuccess: (s: string | null) => void;
}

const SectionWrapper: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg animate-fade-in-up">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
            <Icon className="w-6 h-6 text-cyan-400" />
            <span>{title}</span>
        </h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-white/5"
        />
    </div>
);

const TextAreaField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; rows?: number }> = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-white/5"
        />
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/10">
        <span className="text-gray-300 font-medium text-sm">{label}</span>
        <button 
            onClick={() => onChange(!enabled)} 
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black ${enabled ? 'bg-cyan-600' : 'bg-white/20'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const SiteContentEditor: React.FC<SiteContentEditorProps> = ({ settings, onSettingsChange, onSave, saving, setSaving, setError, setSuccess }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (key: string, value: string) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!supabase) {
            setError('Supabase client is not configured.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${key}-${Date.now()}.${fileExt}`;
            const filePath = `site-assets/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets') // Ensure this bucket exists in your Supabase project
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            handleChange(key, publicUrl);
            setSuccess(`${key === 'site_logo_url' ? 'Logo' : 'Favicon'} uploaded successfully!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file.');
        } finally {
            setSaving(false);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center sticky top-20 z-40 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">تخصيص الموقع</h2>
                    <p className="text-gray-400 text-sm">تعديل المحتوى، الروابط، والصور</p>
                </div>
                <button 
                    onClick={onSave} 
                    disabled={saving} 
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-bold shadow-lg shadow-cyan-600/20"
                >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Branding Section */}
                <SectionWrapper title="الهوية البصرية" icon={Globe}>
                    <InputField 
                        label="اسم الموقع" 
                        value={settings.site_name} 
                        onChange={(val) => handleChange('site_name', val)} 
                        placeholder="Cheatloop" 
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">الشعار (Logo)</label>
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-cyan-500/50 transition-colors bg-black/20">
                                {settings.site_logo_url ? (
                                    <img src={settings.site_logo_url} alt="Logo" className="h-16 object-contain mb-3" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-gray-600 mb-3" />
                                )}
                                <input 
                                    type="file" 
                                    ref={logoInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUpload(e, 'site_logo_url')} 
                                />
                                <button 
                                    onClick={() => logoInputRef.current?.click()} 
                                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <UploadCloud className="w-3 h-3" /> رفع صورة
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">أيقونة الموقع (Favicon)</label>
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-cyan-500/50 transition-colors bg-black/20">
                                {settings.site_favicon_url ? (
                                    <img src={settings.site_favicon_url} alt="Favicon" className="h-8 w-8 object-contain mb-3" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-600 mb-3" />
                                )}
                                <input 
                                    type="file" 
                                    ref={faviconInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUpload(e, 'site_favicon_url')} 
                                />
                                <button 
                                    onClick={() => faviconInputRef.current?.click()} 
                                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <UploadCloud className="w-3 h-3" /> رفع صورة
                                </button>
                            </div>
                        </div>
                    </div>
                </SectionWrapper>

                {/* Contact Links */}
                <SectionWrapper title="روابط التواصل والمتجر" icon={MessageCircle}>
                    <InputField 
                        label="رابط المتجر (Shop URL)" 
                        value={settings.shop_url} 
                        onChange={(val) => handleChange('shop_url', val)} 
                        placeholder="https://cheatloop.shop" 
                    />
                    <InputField 
                        label="رابط ديسكورد" 
                        value={settings.discord_url} 
                        onChange={(val) => handleChange('discord_url', val)} 
                        placeholder="https://discord.gg/..." 
                    />
                    <InputField 
                        label="رابط واتساب" 
                        value={settings.whatsapp_url} 
                        onChange={(val) => handleChange('whatsapp_url', val)} 
                        placeholder="https://wa.me/..." 
                    />
                    <InputField 
                        label="رابط تيليجرام (القناة/الدعم)" 
                        value={settings.telegram_url} 
                        onChange={(val) => handleChange('telegram_url', val)} 
                        placeholder="https://t.me/..." 
                    />
                    <InputField 
                        label="رابط تيليجرام (بوت الشراء)" 
                        value={settings.telegram_purchase_url} 
                        onChange={(val) => handleChange('telegram_purchase_url', val)} 
                        placeholder="https://t.me/BotName" 
                    />
                </SectionWrapper>

                {/* Hero Section */}
                <SectionWrapper title="الواجهة الرئيسية (Hero)" icon={Layout}>
                    <InputField 
                        label="العنوان الرئيسي" 
                        value={settings.hero_title} 
                        onChange={(val) => handleChange('hero_title', val)} 
                    />
                    <TextAreaField 
                        label="العنوان الفرعي" 
                        value={settings.hero_subtitle} 
                        onChange={(val) => handleChange('hero_subtitle', val)} 
                    />
                </SectionWrapper>

                {/* Features */}
                <SectionWrapper title="المميزات (Features)" icon={Type}>
                    <div className="space-y-4">
                        <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-sm"><Shield className="w-4 h-4" /> ميزة 1</div>
                            <InputField label="العنوان" value={settings.feature_1_title} onChange={(val) => handleChange('feature_1_title', val)} />
                            <div className="h-2"></div>
                            <InputField label="الوصف" value={settings.feature_1_desc} onChange={(val) => handleChange('feature_1_desc', val)} />
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-sm"><Target className="w-4 h-4" /> ميزة 2</div>
                            <InputField label="العنوان" value={settings.feature_2_title} onChange={(val) => handleChange('feature_2_title', val)} />
                            <div className="h-2"></div>
                            <InputField label="الوصف" value={settings.feature_2_desc} onChange={(val) => handleChange('feature_2_desc', val)} />
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-green-400 font-bold text-sm"><Zap className="w-4 h-4" /> ميزة 3</div>
                            <InputField label="العنوان" value={settings.feature_3_title} onChange={(val) => handleChange('feature_3_title', val)} />
                            <div className="h-2"></div>
                            <InputField label="الوصف" value={settings.feature_3_desc} onChange={(val) => handleChange('feature_3_desc', val)} />
                        </div>
                    </div>
                </SectionWrapper>

                {/* Toggles & Visibility */}
                <SectionWrapper title="التحكم بالعرض" icon={ExternalLink}>
                    <div className="space-y-3">
                        <ToggleSwitch 
                            label="إظهار زر واتساب في البطاقات" 
                            enabled={settings.show_whatsapp_button !== 'false'} 
                            onChange={(val) => handleChange('show_whatsapp_button', val.toString())} 
                        />
                        <ToggleSwitch 
                            label="إظهار زر تيليجرام في البطاقات" 
                            enabled={settings.show_telegram_button !== 'false'} 
                            onChange={(val) => handleChange('show_telegram_button', val.toString())} 
                        />
                        <ToggleSwitch 
                            label="إظهار جميع أزرار واتساب (الهيدر/الفوتر)" 
                            enabled={settings.show_all_whatsapp_buttons !== 'false'} 
                            onChange={(val) => handleChange('show_all_whatsapp_buttons', val.toString())} 
                        />
                        <ToggleSwitch 
                            label="إظهار ملاحظة بطاقة المنتج" 
                            enabled={settings.show_product_card_note !== 'false'} 
                            onChange={(val) => handleChange('show_product_card_note', val.toString())} 
                        />
                        <ToggleSwitch 
                            label="إظهار زر 'لقد دفعت'" 
                            enabled={settings.show_i_have_paid_button !== 'false'} 
                            onChange={(val) => handleChange('show_i_have_paid_button', val.toString())} 
                        />
                    </div>
                </SectionWrapper>

                {/* Footer & Notes */}
                <SectionWrapper title="تذييل الصفحة والملاحظات" icon={Type}>
                    <TextAreaField 
                        label="حقوق النشر (Footer Copyright)" 
                        value={settings.footer_copyright} 
                        onChange={(val) => handleChange('footer_copyright', val)} 
                    />
                    <TextAreaField 
                        label="ملاحظة بطاقة المنتج" 
                        value={settings.product_card_note} 
                        onChange={(val) => handleChange('product_card_note', val)} 
                    />
                </SectionWrapper>

                {/* Policies Section */}
                <SectionWrapper title="السياسات والخصوصية" icon={FileText}>
                    <TextAreaField 
                        label="سياسة الخصوصية (Privacy Policy)" 
                        value={settings.privacy_policy || ''} 
                        onChange={(val) => handleChange('privacy_policy', val)} 
                        rows={10}
                        placeholder="أدخل نص سياسة الخصوصية هنا..."
                    />
                    <TextAreaField 
                        label="شروط الخدمة (Terms of Service)" 
                        value={settings.terms_of_service || ''} 
                        onChange={(val) => handleChange('terms_of_service', val)} 
                        rows={10}
                        placeholder="أدخل نص شروط الخدمة هنا..."
                    />
                </SectionWrapper>

                {/* Brevo Integration */}
                <SectionWrapper title="إعدادات نظام بريفو (Brevo)" icon={Mail}>
                    <InputField 
                        label="Brevo API Key" 
                        value={settings.brevo_api_key || ''} 
                        onChange={(val) => handleChange('brevo_api_key', val)} 
                        placeholder="xsmtpsib-..."
                        type="password"
                    />
                    <InputField 
                        label="Sender Email" 
                        value={settings.brevo_sender_email || ''} 
                        onChange={(val) => handleChange('brevo_sender_email', val)} 
                        placeholder="support@yourdomain.com"
                    />
                    <InputField 
                        label="Sender Name" 
                        value={settings.brevo_sender_name || ''} 
                        onChange={(val) => handleChange('brevo_sender_name', val)} 
                        placeholder="Cheatloop Team"
                    />
                </SectionWrapper>
            </div>
        </div>
    );
};

export default SiteContentEditor;
