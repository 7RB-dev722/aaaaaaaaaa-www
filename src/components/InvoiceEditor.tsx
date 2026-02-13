import React, { useState, useEffect, useRef } from 'react';
import { supabase, invoiceTemplateService, InvoiceTemplateData } from '../lib/supabase';
import { Save, UploadCloud, Image as ImageIcon, X, Trash2, FileText, Eye } from 'lucide-react';
import InvoiceTemplate from './InvoiceTemplate';
import { useSettings } from '../contexts/SettingsContext';

const SectionWrapper: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
            <Icon className="w-6 h-6 text-cyan-400" />
            <span>{title}</span>
        </h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
        />
    </div>
);

const TextAreaField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number }> = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500"
        />
    </div>
);

const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

interface InvoiceEditorProps {
    onSaveSuccess?: () => void;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ onSaveSuccess }) => {
    const { settings: siteSettings } = useSettings();
    const [templates, setTemplates] = useState<InvoiceTemplateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showLogoLibrary, setShowLogoLibrary] = useState<string | null>(null); // brand_name
    const [autoContrast, setAutoContrast] = useState(true);
    const fileInputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement> }>({});

    const getContrastColor = (hex: string) => {
        if (!hex || hex === 'transparent') return '#ffffff';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#111827' : '#ffffff';
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await invoiceTemplateService.getAll();
            setTemplates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (id: string, field: keyof InvoiceTemplateData, value: string) => {
        setTemplates(prev =>
            prev.map(t => {
                if (t.id === id) {
                    const newTemplate = { ...t, [field]: value };
                    // If background color changed and auto-contrast is on, update text color
                    if (field === 'bg_color' && autoContrast) {
                        newTemplate.text_color = getContrastColor(value);
                    }
                    return newTemplate;
                }
                return t;
            })
        );
    };

    const handleSaveTemplate = async (template: InvoiceTemplateData) => {
        setSaving(true);
        setError(null);
        try {
            const { id, created_at, ...updates } = template;
            await invoiceTemplateService.update(id, updates);
            setSuccess(`Template for ${template.brand_name} saved successfully!`);
            if (onSaveSuccess) onSaveSuccess();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>, templateId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadLogo(file, templateId);
        }
    };

    const uploadLogo = async (file: File, templateId: string) => {
        if (!supabase) {
            setError('Supabase client is not configured.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const filePath = `invoice-logos/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);
            handleTemplateChange(templateId, 'logo_url', publicUrl);
            setSuccess('Logo uploaded. Remember to save the template to apply the change.');
        } catch (err: any) {
            setError(err.message || 'Failed to upload logo.');
        } finally {
            setSaving(false);
        }
    };
    
    const handleSelectLogoFromLibrary = (path: string, templateId: string) => {
        handleTemplateChange(templateId, 'logo_url', path);
        setShowLogoLibrary(null);
        setSuccess('Logo selected. Remember to save the template.');
    };

    if (loading) return (
        <div className="text-center p-8">
            <p className="text-white">Loading invoice templates...</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto px-4">
             {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-center">{error}</div>}
             {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center">{success}</div>}
            {templates.map(template => {
                if (!fileInputRefs.current[template.id]) {
                    fileInputRefs.current[template.id] = React.createRef<HTMLInputElement>();
                }
                return (
                    <div key={template.id} className="bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl mb-12">
                        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                            <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                                <FileText className="w-7 h-7 text-cyan-400" />
                                <span>{template.brand_name} Invoice Template</span>
                            </h3>
                            <button 
                                onClick={() => handleSaveTemplate(template)} 
                                disabled={saving} 
                                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                            >
                                <Save className="w-5 h-5" />
                                <span>Save Changes</span>
                            </button>
                        </div>

                        <div className="grid lg:grid-cols-[450px_1fr] gap-12">
                            {/* Left Side: Settings */}
                            <div className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <InputField
                                        label="Company Name"
                                        value={template.company_name || ''}
                                        onChange={(e) => handleTemplateChange(template.id, 'company_name', e.target.value)}
                                        placeholder="e.g., Cheatloop Team"
                                    />
                                    <InputField
                                        label="Support Contact"
                                        value={template.support_contact || ''}
                                        onChange={(e) => handleTemplateChange(template.id, 'support_contact', e.target.value)}
                                        placeholder="e.g., support@cheatloop.com"
                                    />
                                </div>
                                
                                <TextAreaField
                                    label="Footer Notes"
                                    value={template.footer_notes || ''}
                                    onChange={(e) => handleTemplateChange(template.id, 'footer_notes', e.target.value)}
                                    placeholder="e.g., Thank you for your purchase!"
                                    rows={4}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-4">Logo Selection</label>
                                    <div className="flex items-center space-x-6 bg-black/30 p-4 rounded-2xl border border-white/5">
                                        <div className="relative group">
                                            <img
                                                src={template.logo_url || 'https://placehold.co/100x100/1f2937/38bdf8?text=Logo'}
                                                alt={`${template.brand_name} Logo`}
                                                className="w-20 h-20 object-contain rounded-xl bg-black/50 p-2 border border-white/10"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                <ImageIcon className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => fileInputRefs.current[template.id].current?.click()} className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-xs border border-white/10">
                                                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                                                    <span>Upload New</span>
                                                </button>
                                                <input type="file" ref={fileInputRefs.current[template.id]} className="hidden" accept="image/*" onChange={(e) => handleLogoFileChange(e, template.id)} />
                                                <button type="button" onClick={() => setShowLogoLibrary(template.brand_name)} className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-xs border border-white/10">
                                                    <ImageIcon className="w-4 h-4 text-purple-400" />
                                                    <span>Library</span>
                                                </button>
                                                {template.logo_url && (
                                                    <button type="button" onClick={() => handleTemplateChange(template.id, 'logo_url', '')} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl transition-all border border-red-900/30">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 italic">Recommended: PNG with transparent background</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Theme & Colors</h4>
                                        <label className="flex items-center cursor-pointer space-x-2">
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only" 
                                                    checked={autoContrast}
                                                    onChange={() => setAutoContrast(!autoContrast)}
                                                />
                                                <div className={`block w-8 h-4 rounded-full transition-colors ${autoContrast ? 'bg-cyan-500' : 'bg-gray-600'}`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${autoContrast ? 'translate-x-4' : ''}`}></div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">Auto Contrast</span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <span className="text-xs font-medium text-gray-400">Background</span>
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={template.bg_color || '#f3f4f6'}
                                                        onChange={(e) => handleTemplateChange(template.id, 'bg_color', e.target.value)}
                                                        className="w-12 h-12 bg-transparent border-0 rounded-lg cursor-pointer"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={template.bg_color || '#f3f4f6'}
                                                    onChange={(e) => handleTemplateChange(template.id, 'bg_color', e.target.value)}
                                                    className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-white text-xs font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-xs font-medium text-gray-400">Text Color</span>
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={template.text_color || '#111827'}
                                                        onChange={(e) => handleTemplateChange(template.id, 'text_color', e.target.value)}
                                                        className="w-12 h-12 bg-transparent border-0 rounded-lg cursor-pointer"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={template.text_color || '#111827'}
                                                    onChange={(e) => handleTemplateChange(template.id, 'text_color', e.target.value)}
                                                    className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-white text-xs font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <span className="text-xs font-medium text-gray-400">Popular Presets</span>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { name: 'Light Mode', bg: '#f3f4f6', text: '#111827', class: 'bg-white text-black' },
                                                { name: 'Pitch Black', bg: '#000000', text: '#ffffff', class: 'bg-black text-white' },
                                                { name: 'Navy Dark', bg: '#0f172a', text: '#f8fafc', class: 'bg-slate-900 text-white' },
                                                { name: 'Cyberpunk', bg: '#0a0a0c', text: '#00f2ff', class: 'bg-zinc-950 text-cyan-400' },
                                                { name: 'Gold Luxury', bg: '#1a1a1a', text: '#d4af37', class: 'bg-neutral-900 text-yellow-500' },
                                                { name: 'Emerald', bg: '#064e3b', text: '#ecfdf5', class: 'bg-emerald-900 text-emerald-50' }
                                            ].map(preset => (
                                                <button 
                                                    key={preset.name}
                                                    onClick={() => {
                                                        handleTemplateChange(template.id, 'bg_color', preset.bg);
                                                        handleTemplateChange(template.id, 'text_color', preset.text);
                                                    }}
                                                    className={`px-3 py-1.5 border border-white/10 rounded-lg text-[10px] transition-all hover:scale-105 active:scale-95 ${preset.class}`}
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Preview */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                                        <Eye size={14} className="text-cyan-400" />
                                        <span>Live Preview</span>
                                    </h4>
                                    <span className="text-[10px] text-gray-500 italic">Auto-updates on change</span>
                                </div>
                                <div className="sticky top-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 min-h-[900px] flex flex-col backdrop-blur-sm">
                                    <div className="flex-1 overflow-auto bg-gray-200/30 p-8">
                                        <div className="origin-top scale-[1.0] md:scale-[1.1] lg:scale-[1.2] transition-all duration-500 ease-out hover:scale-[1.25]">
                                            <InvoiceTemplate
                                                templateData={template}
                                                intent={{
                                                    id: 'ORD-777-PREVIEW',
                                                    email: 'customer@example.com',
                                                    product_title: 'Ultimate Pro Package',
                                                    amount: 149.99,
                                                    created_at: new Date().toISOString(),
                                                    country: 'United States',
                                                    product_id: 'preview',
                                                    status: 'completed'
                                                } as any}
                                                productKey="CHEAT-LOOP-7777-XXXX-PRO"
                                                siteSettings={siteSettings}
                                                productPrice={149.99}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
             {showLogoLibrary && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-black rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Select a Logo</h3>
                            <button onClick={() => setShowLogoLibrary(null)} className="p-2 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {AVAILABLE_IMAGES.map((image) => {
                                const template = templates.find(t => t.brand_name === showLogoLibrary);
                                if (!template) return null;
                                return (
                                    <div 
                                        key={image.id} 
                                        className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors border-2 border-transparent hover:border-cyan-500" 
                                        onClick={() => handleSelectLogoFromLibrary(image.path, template.id)}
                                    >
                                        <img src={image.path} alt={image.name} className="w-full h-24 object-contain rounded-lg mb-3"/>
                                        <p className="text-white text-sm font-medium text-center">{image.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceEditor;
