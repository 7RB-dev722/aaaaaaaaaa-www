import React, { useState, useEffect, useRef } from 'react';
import { supabase, invoiceTemplateService, InvoiceTemplateData } from '../../lib/supabase';
import { Save, UploadCloud, Image as ImageIcon, X, Trash2, FileText } from 'lucide-react';

const SectionWrapper: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
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
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
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
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
        />
    </div>
);

const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

const InvoiceEditor: React.FC = () => {
    const [templates, setTemplates] = useState<InvoiceTemplateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showLogoLibrary, setShowLogoLibrary] = useState<string | null>(null); // brand_name
    const fileInputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement> }>({});

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
            prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
        );
    };

    const handleSaveTemplate = async (template: InvoiceTemplateData) => {
        setSaving(true);
        setError(null);
        try {
            const { id, created_at, ...updates } = template;
            await invoiceTemplateService.update(id, updates);
            setSuccess(`Template for ${template.brand_name} saved successfully!`);
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
        <div className="space-y-8 max-w-4xl mx-auto">
             {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-center">{error}</div>}
             {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center">{success}</div>}
            {templates.map(template => {
                if (!fileInputRefs.current[template.id]) {
                    fileInputRefs.current[template.id] = React.createRef<HTMLInputElement>();
                }
                return (
                    <SectionWrapper key={template.id} title={`${template.brand_name} Invoice Template`} icon={FileText}>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-6">
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
                                <TextAreaField
                                    label="Footer Notes"
                                    value={template.footer_notes || ''}
                                    onChange={(e) => handleTemplateChange(template.id, 'footer_notes', e.target.value)}
                                    placeholder="e.g., Thank you for your purchase!"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                                <div className="flex items-center space-x-6">
                                    <img
                                        src={template.logo_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/100x100/1f2937/38bdf8?text=Logo'}
                                        alt={`${template.brand_name} Logo`}
                                        className="w-20 h-20 object-contain rounded-lg bg-slate-700 p-2 border border-slate-600"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <button type="button" onClick={() => fileInputRefs.current[template.id].current?.click()} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                                <UploadCloud className="w-4 h-4" />
                                                <span>Upload</span>
                                            </button>
                                            <input type="file" ref={fileInputRefs.current[template.id]} className="hidden" accept="image/*" onChange={(e) => handleLogoFileChange(e, template.id)} />
                                            <button type="button" onClick={() => setShowLogoLibrary(template.brand_name)} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                                <ImageIcon className="w-4 h-4" />
                                                <span>Library</span>
                                            </button>
                                            {template.logo_url && (
                                                <button type="button" onClick={() => handleTemplateChange(template.id, 'logo_url', '')} className="flex items-center space-x-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 rounded-xl transition-colors text-sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => handleSaveTemplate(template)} disabled={saving} className="flex items-center space-x-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl disabled:opacity-50">
                                <Save className="w-5 h-5" />
                                <span>Save {template.brand_name} Template</span>
                            </button>
                        </div>
                    </SectionWrapper>
                );
            })}
             {showLogoLibrary && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
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
                                        className="bg-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-600 transition-colors border-2 border-transparent hover:border-cyan-500" 
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
