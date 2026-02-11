import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, UploadCloud, Image as ImageIcon, Heading1, Heading2, Copyright, Shield, Target, Zap, RefreshCw, X, CreditCard, Trash2, BookText, Globe, Link } from 'lucide-react';

interface SiteContentEditorProps {
    settings: Record<string, string>;
    onSettingsChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    onSave: () => void;
    saving: boolean;
    setSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    setSuccess: (success: string | null) => void;
}

const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

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

const TextAreaField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number; dir?: 'ltr' | 'rtl' }> = ({ label, value, onChange, placeholder, rows = 3, dir }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            dir={dir}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
        />
    </div>
);

const ImageUploadField: React.FC<{
    label: string;
    imageUrl: string;
    onImageChange: (url: string) => void;
    saving: boolean;
    setSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    setSuccess: (success: string | null) => void;
}> = ({ label, imageUrl, onImageChange, saving, setSaving, setError, setSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        if (!supabase) {
            setError('Supabase client is not configured.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const filePath = `site-asset-instruction-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);
            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);
            onImageChange(publicUrl);
            setSuccess(`Image for "${label}" uploaded. Remember to save all changes to apply.`);
            setFile(null);
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message || 'Failed to upload image.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = () => {
        onImageChange('');
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setSuccess(`Image for "${label}" removed. Remember to save all changes to apply.`);
    };

    return (
         <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className="flex items-center space-x-4">
                <img
                    src={preview || imageUrl || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/150x100/1f2937/38bdf8?text=No+Image'}
                    alt={`${label} Preview`}
                    className="w-36 h-24 object-contain rounded-lg bg-slate-700 p-1 border border-slate-600"
                />
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                            <UploadCloud className="w-4 h-4" />
                            <span>Choose Image</span>
                        </button>
                        {(imageUrl || preview) && (
                            <button type="button" onClick={handleRemove} className="flex items-center space-x-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 rounded-xl transition-colors text-sm">
                                <Trash2 className="w-4 h-4" />
                                <span>Remove</span>
                            </button>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    {file && (
                        <div className="mt-2 flex items-center space-x-3">
                            <p className="text-sm text-gray-400 truncate w-40">{file.name}</p>
                            <button onClick={handleUpload} disabled={saving} className="flex items-center space-x-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm disabled:opacity-50">
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Upload</span>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SiteContentEditor: React.FC<SiteContentEditorProps> = ({ settings, onSettingsChange, onSave, saving, setSaving, setError, setSuccess }) => {
    // ... existing logo/favicon logic ...
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [showLogoLibrary, setShowLogoLibrary] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [showFaviconLibrary, setShowFaviconLibrary] = useState(false);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const handleSettingChange = (key: string, value: string) => {
        onSettingsChange(prev => ({ ...prev, [key]: value }));
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) {
            setError('Please select a logo file to upload.');
            return;
        }
        if (!supabase) {
            setError('Supabase client is not configured.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const filePath = `logo-${Date.now()}-${logoFile.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, logoFile);
            if (uploadError) {
                throw new Error(`Failed to upload logo: ${uploadError.message}`);
            }
            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);
            handleSettingChange('site_logo_url', publicUrl);
            setSuccess('Logo uploaded successfully! Remember to save all changes.');
            setLogoFile(null);
            setLogoPreview(null);
        } catch (err: any) {
            setError(err.message || 'Failed to upload logo.');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectLogoFromLibrary = (imagePath: string) => {
        handleSettingChange('site_logo_url', imagePath);
        setShowLogoLibrary(false);
    };

    const handleRemoveLogo = () => {
        handleSettingChange('site_logo_url', '');
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFaviconFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFaviconPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFaviconUpload = async () => {
        if (!faviconFile) {
            setError('Please select a favicon file to upload.');
            return;
        }
        if (!supabase) {
            setError('Supabase client is not configured.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const filePath = `favicon-${Date.now()}-${faviconFile.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, faviconFile);
            if (uploadError) {
                throw new Error(`Failed to upload favicon: ${uploadError.message}`);
            }
            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);
            handleSettingChange('site_favicon_url', publicUrl);
            setSuccess('Favicon uploaded successfully! Remember to save all changes.');
            setFaviconFile(null);
            setFaviconPreview(null);
        } catch (err: any) {
            setError(err.message || 'Failed to upload favicon.');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectFaviconFromLibrary = (imagePath: string) => {
        handleSettingChange('site_favicon_url', imagePath);
        setShowFaviconLibrary(false);
    };

    const handleRemoveFavicon = () => {
        handleSettingChange('site_favicon_url', '');
        setFaviconFile(null);
        setFaviconPreview(null);
    };

    const instructionImageKeys: `payment_instruction_image_${number}`[] = [1, 2, 3, 4, 5].map(i => `payment_instruction_image_${i}` as const);

    return (
        <div className="space-y-8">
            <SectionWrapper title="Site Identity" icon={Globe}>
                <InputField
                    label="Site Name"
                    value={settings.site_name || ''}
                    onChange={(e) => handleSettingChange('site_name', e.target.value)}
                    placeholder="e.g., Cheatloop"
                />
                
                {/* Logo Section */}
                <div className="border-t border-slate-700 pt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Site Logo</label>
                    <div className="flex items-center space-x-6">
                        <img
                            src={logoPreview || settings.site_logo_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/100x100/1f2937/38bdf8?text=No+Logo'}
                            alt="Site Logo Preview"
                            className="w-20 h-20 object-contain rounded-lg bg-slate-700 p-2 border border-slate-600"
                        />
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                    <UploadCloud className="w-4 h-4" />
                                    <span>Upload</span>
                                </button>
                                <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoFileChange} />
                                <button type="button" onClick={() => setShowLogoLibrary(true)} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Library</span>
                                </button>
                                {(settings.site_logo_url || logoPreview) && (
                                    <button type="button" onClick={handleRemoveLogo} className="flex items-center space-x-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 rounded-xl transition-colors text-sm">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {logoFile && (
                                <div className="mt-3 flex items-center space-x-3">
                                    <p className="text-sm text-gray-400 truncate w-40">{logoFile.name}</p>
                                    <button onClick={handleLogoUpload} disabled={saving} className="flex items-center space-x-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm disabled:opacity-50">
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Confirm Upload</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Favicon Section */}
                <div className="border-t border-slate-700 pt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Site Favicon (Browser Tab Icon)</label>
                    <div className="flex items-center space-x-6">
                        <img
                            src={faviconPreview || settings.site_favicon_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/64x64/1f2937/38bdf8?text=Favicon'}
                            alt="Site Favicon Preview"
                            className="w-16 h-16 object-contain rounded-lg bg-slate-700 p-2 border border-slate-600"
                        />
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <button type="button" onClick={() => faviconInputRef.current?.click()} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                    <UploadCloud className="w-4 h-4" />
                                    <span>Upload</span>
                                </button>
                                <input ref={faviconInputRef} type="file" className="hidden" accept="image/*" onChange={handleFaviconFileChange} />
                                <button type="button" onClick={() => setShowFaviconLibrary(true)} className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Library</span>
                                </button>
                                {(settings.site_favicon_url || faviconPreview) && (
                                    <button type="button" onClick={handleRemoveFavicon} className="flex items-center space-x-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 rounded-xl transition-colors text-sm">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {faviconFile && (
                                <div className="mt-3 flex items-center space-x-3">
                                    <p className="text-sm text-gray-400 truncate w-40">{faviconFile.name}</p>
                                    <button onClick={handleFaviconUpload} disabled={saving} className="flex items-center space-x-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm disabled:opacity-50">
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Confirm Upload</span>}
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Recommended size: 32x32 or 64x64 pixels. PNG or ICO format.</p>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper title="Hero Section" icon={Heading1}>
                <InputField
                    label="Hero Title"
                    value={settings.hero_title || ''}
                    onChange={(e) => handleSettingChange('hero_title', e.target.value)}
                    placeholder="Dominate the Game"
                />
                <TextAreaField
                    label="Hero Subtitle"
                    value={settings.hero_subtitle || ''}
                    onChange={(e) => handleSettingChange('hero_subtitle', e.target.value)}
                    placeholder="Professional gaming tools..."
                />
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <InputField label="Feature 1 Title" value={settings.feature_1_title || ''} onChange={(e) => handleSettingChange('feature_1_title', e.target.value)} placeholder="100% Safe" />
                        <InputField label="Feature 1 Desc" value={settings.feature_1_desc || ''} onChange={(e) => handleSettingChange('feature_1_desc', e.target.value)} placeholder="Protected from bans" />
                    </div>
                    <div>
                        <InputField label="Feature 2 Title" value={settings.feature_2_title || ''} onChange={(e) => handleSettingChange('feature_2_title', e.target.value)} placeholder="Precision Tools" />
                        <InputField label="Feature 2 Desc" value={settings.feature_2_desc || ''} onChange={(e) => handleSettingChange('feature_2_desc', e.target.value)} placeholder="Advanced aimbot & ESP" />
                    </div>
                    <div>
                        <InputField label="Feature 3 Title" value={settings.feature_3_title || ''} onChange={(e) => handleSettingChange('feature_3_title', e.target.value)} placeholder="Instant Access" />
                        <InputField label="Feature 3 Desc" value={settings.feature_3_desc || ''} onChange={(e) => handleSettingChange('feature_3_desc', e.target.value)} placeholder="Download immediately" />
                    </div>
                </div>
            </SectionWrapper>
            
            <SectionWrapper title="Payment Configuration" icon={CreditCard}>
                <div className="space-y-6">
                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                        <InputField 
                            label="I Have Paid Button Link (Direct Communication)" 
                            value={settings.i_have_paid_link || ''} 
                            onChange={(e) => handleSettingChange('i_have_paid_link', e.target.value)} 
                            placeholder="e.g., https://t.me/your_username" 
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            If set, the "I Have Paid" button will redirect directly to this link instead of opening the confirmation form.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-200">English Instructions</h4>
                        <TextAreaField label="Step 1" value={settings.payment_instruction_step_1_en || ''} onChange={(e) => handleSettingChange('payment_instruction_step_1_en', e.target.value)} />
                        <TextAreaField label="Step 2" value={settings.payment_instruction_step_2_en || ''} onChange={(e) => handleSettingChange('payment_instruction_step_2_en', e.target.value)} />
                        <TextAreaField label="Step 3" value={settings.payment_instruction_step_3_en || ''} onChange={(e) => handleSettingChange('payment_instruction_step_3_en', e.target.value)} />
                        <TextAreaField label="Step 4" value={settings.payment_instruction_step_4_en || ''} onChange={(e) => handleSettingChange('payment_instruction_step_4_en', e.target.value)} />
                        <TextAreaField label="Step 5" value={settings.payment_instruction_step_5_en || ''} onChange={(e) => handleSettingChange('payment_instruction_step_5_en', e.target.value)} />
                    </div>
                    {/* Arabic and Turkish sections remain the same... */}
                     <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-200">Arabic Instructions</h4>
                        <TextAreaField label="Step 1" value={settings.payment_instruction_step_1_ar || ''} onChange={(e) => handleSettingChange('payment_instruction_step_1_ar', e.target.value)} dir="rtl" />
                        <TextAreaField label="Step 2" value={settings.payment_instruction_step_2_ar || ''} onChange={(e) => handleSettingChange('payment_instruction_step_2_ar', e.target.value)} dir="rtl" />
                        <TextAreaField label="Step 3" value={settings.payment_instruction_step_3_ar || ''} onChange={(e) => handleSettingChange('payment_instruction_step_3_ar', e.target.value)} dir="rtl" />
                        <TextAreaField label="Step 4" value={settings.payment_instruction_step_4_ar || ''} onChange={(e) => handleSettingChange('payment_instruction_step_4_ar', e.target.value)} dir="rtl" />
                        <TextAreaField label="Step 5" value={settings.payment_instruction_step_5_ar || ''} onChange={(e) => handleSettingChange('payment_instruction_step_5_ar', e.target.value)} dir="rtl" />
                    </div>
                     <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-200">Turkish Instructions</h4>
                        <TextAreaField label="Step 1" value={settings.payment_instruction_step_1_tr || ''} onChange={(e) => handleSettingChange('payment_instruction_step_1_tr', e.target.value)} />
                        <TextAreaField label="Step 2" value={settings.payment_instruction_step_2_tr || ''} onChange={(e) => handleSettingChange('payment_instruction_step_2_tr', e.target.value)} />
                        <TextAreaField label="Step 3" value={settings.payment_instruction_step_3_tr || ''} onChange={(e) => handleSettingChange('payment_instruction_step_3_tr', e.target.value)} />
                        <TextAreaField label="Step 4" value={settings.payment_instruction_step_4_tr || ''} onChange={(e) => handleSettingChange('payment_instruction_step_4_tr', e.target.value)} />
                        <TextAreaField label="Step 5" value={settings.payment_instruction_step_5_tr || ''} onChange={(e) => handleSettingChange('payment_instruction_step_5_tr', e.target.value)} />
                    </div>
                </div>
            </SectionWrapper>
            
            <SectionWrapper title="Instruction Images" icon={BookText}>
                <div className="grid md:grid-cols-2 gap-8">
                    {instructionImageKeys.map((key, index) => (
                        <ImageUploadField
                            key={key}
                            label={`Image for Step ${index + 1}`}
                            imageUrl={settings[key] || ''}
                            onImageChange={(url) => handleSettingChange(key, url)}
                            saving={saving}
                            setSaving={setSaving}
                            setError={setError}
                            setSuccess={setSuccess}
                        />
                    ))}
                </div>
            </SectionWrapper>

            <SectionWrapper title="Footer" icon={Copyright}>
                <InputField
                    label="Footer Copyright Text"
                    value={settings.footer_copyright || ''}
                    onChange={(e) => handleSettingChange('footer_copyright', e.target.value)}
                    placeholder="© 2025 Cheatloop. All rights reserved."
                />
            </SectionWrapper>

            <div className="flex justify-end mt-8">
                <button onClick={onSave} disabled={saving} className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50">
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                </button>
            </div>

            {/* Modals for Logo/Favicon ... */}
            {showLogoLibrary && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Select a Logo</h3>
                            <button onClick={() => setShowLogoLibrary(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {AVAILABLE_IMAGES.filter(img => img.category === 'logos').map((image) => (
                                <div key={image.id} className="bg-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-600 transition-colors border-2 border-transparent hover:border-cyan-500" onClick={() => handleSelectLogoFromLibrary(image.path)}>
                                    <img src={image.path} alt={image.name} className="w-full h-24 object-contain rounded-lg mb-3"/>
                                    <p className="text-white text-sm font-medium text-center">{image.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showFaviconLibrary && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Select a Favicon</h3>
                            <button onClick={() => setShowFaviconLibrary(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {AVAILABLE_IMAGES.filter(img => img.category === 'logos').map((image) => (
                                <div key={image.id} className="bg-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-600 transition-colors border-2 border-transparent hover:border-cyan-500" onClick={() => handleSelectFaviconFromLibrary(image.path)}>
                                    <img src={image.path} alt={image.name} className="w-full h-24 object-contain rounded-lg mb-3"/>
                                    <p className="text-white text-sm font-medium text-center">{image.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteContentEditor;
