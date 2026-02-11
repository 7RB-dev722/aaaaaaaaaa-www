// ... existing imports
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Plus, Edit, Trash2, X, LogOut, Package, RefreshCw, Tag, AlertCircle, CheckCircle, ImageIcon, Eye, EyeOff, Home, UploadCloud, LayoutDashboard, Image as LucideImage, Settings, Link as LinkIcon, Palette, PlayCircle, Move, QrCode, Users, CreditCard, Send, Mail, Printer, MessageSquare, ExternalLink, FileText, KeyRound, Clock, Search, Globe, ChevronRight, Menu, Bell, Check } from 'lucide-react';
import { productService, categoryService, winningPhotosService, settingsService, purchaseImagesService, purchaseIntentsService, testSupabaseConnection, Product, Category, WinningPhoto, SiteSetting, PurchaseImage, PurchaseIntent, supabase, invoiceTemplateService, InvoiceTemplateData, ProductKey, productKeysService } from '@/lib/supabase';
// ... rest of imports

// ... existing components (PhotoItem, ToggleSwitch, etc.)

// ... AdminDashboard component definition
const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // ... existing state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [winningPhotos, setWinningPhotos] = useState<WinningPhoto[]>([]);
  const [purchaseImages, setPurchaseImages] = useState<PurchaseImage[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplateData[]>([]);
  const [productKeys, setProductKeys] = useState<ProductKey[]>([]);
  const { settings: siteSettings, loading: settingsLoading } = useSettings();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetProduct, setMoveTargetProduct] = useState('');
  const [photoProductFilter, setPhotoProductFilter] = useState<string>('all');
  const [newPurchaseImage, setNewPurchaseImage] = useState<{ file: File | null; name: string }>({ file: null, name: '' });
  const [invoiceModalIntent, setInvoiceModalIntent] = useState<PurchaseIntent | null>(null);
  const [productKeyForInvoice, setProductKeyForInvoice] = useState<string | null>(null);
  const [isDrawingKey, setIsDrawingKey] = useState(false);
  const [selectedPurchaseIntents, setSelectedPurchaseIntents] = useState<string[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [purchaseIntentFilter, setPurchaseIntentFilter] = useState<'pending' | 'completed'>('pending');
  const [purchaseIntentSearchTerm, setPurchaseIntentSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at'>>({
    title: '', price: 0, features: [''], description: '', buy_link: '', buy_link_2: '', buy_link_3: '', buy_link_4: '', buy_link_5: '', image: '', video_link: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null
  });
  // ... rest of state and refs

  // ... existing useEffects and loadData

  // ... existing handlers

  const handleProductSubmit = async (isUpdate: boolean) => {
    if (!newProduct.title || !newProduct.price || (!newProduct.buy_link && !newProduct.purchase_image_id) || !newProduct.category_id) {
        setError('Please fill all required fields: Name, Price, Category, and either a Buy Link or a Purchase Image.');
        return;
    }

    try {
        setSaving(true);
        setError(null);
        
        let imageUrl = newProduct.image;
        if (imageUploadFile) {
            if (!supabase) throw new Error("Supabase client not available");
            const filePath = `public/${Date.now()}-${imageUploadFile.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageUploadFile);
            if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }

        const productPayload: Partial<Product> = { 
            ...newProduct, 
            image: imageUrl,
            features: newProduct.features.filter(f => f.trim() !== ''),
            buy_link: newProduct.purchase_image_id ? '' : newProduct.buy_link,
            buy_link_2: newProduct.purchase_image_id ? '' : newProduct.buy_link_2,
            buy_link_3: newProduct.purchase_image_id ? '' : newProduct.buy_link_3,
            buy_link_4: newProduct.purchase_image_id ? '' : newProduct.buy_link_4,
            buy_link_5: newProduct.purchase_image_id ? '' : newProduct.buy_link_5,
            purchase_image_id: newProduct.buy_link ? null : newProduct.purchase_image_id
        };
        
        if (isUpdate) {
            await productService.updateProduct(editingProduct!, productPayload);
        } else {
            await productService.addProduct(productPayload as any);
        }

        await loadData();
        resetProductForm();
        if (isUpdate) {
            setEditingProduct(null);
        } else {
            setIsAddingProduct(false);
        }
        setSuccess(`Product ${isUpdate ? 'updated' : 'added'} successfully.`);
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        console.error(`Error ${isUpdate ? 'updating' : 'adding'} product:`, err);
        setError(err.message || `Failed to ${isUpdate ? 'update' : 'add'} product.`);
    } finally {
        setSaving(false);
    }
  };

  // ... existing handlers

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    resetProductForm();
    setNewProduct({
      title: product.title, price: product.price, features: product.features, description: product.description,
      buy_link: product.buy_link, buy_link_2: product.buy_link_2 || '', buy_link_3: product.buy_link_3 || '', buy_link_4: product.buy_link_4 || '', buy_link_5: product.buy_link_5 || '', image: product.image || '', video_link: product.video_link || '', is_popular: product.is_popular || false,
      category: product.category, category_id: product.category_id || '', is_hidden: product.is_hidden || false,
      purchase_image_id: product.purchase_image_id || null
    });
  };

  const resetProductForm = () => {
    setNewProduct({
      title: '', price: 0, features: [''], description: '', buy_link: '', buy_link_2: '', buy_link_3: '', buy_link_4: '', buy_link_5: '', image: '', video_link: '',
      is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null
    });
    setImageUploadFile(null);
    setImagePreviewUrl(null);
    if (productImageInputRef.current) productImageInputRef.current.value = '';
  };

  // ... rest of component

  return (
    // ... existing JSX
    // Inside the product form, locate the External Link section
                                                {newProduct.purchase_image_id === null ? (
                                                    <div className="space-y-4 animate-fade-in-up">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                                                                Link Button 1 (Primary)
                                                            </label>
                                                            <input 
                                                                type="url" 
                                                                value={newProduct.buy_link} 
                                                                onChange={(e) => setNewProduct({...newProduct, buy_link: e.target.value})} 
                                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" 
                                                                placeholder="https://primary-link.com..." 
                                                            />
                                                        </div>
                                                        
                                                        {/* Link 2 */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                                                                Link Button 2 (Backup)
                                                            </label>
                                                            <input 
                                                                type="url" 
                                                                value={newProduct.buy_link_2 || ''} 
                                                                onChange={(e) => setNewProduct({...newProduct, buy_link_2: e.target.value})} 
                                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" 
                                                                placeholder="https://backup-link-1.com..." 
                                                            />
                                                        </div>

                                                        {/* Link 3 */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">3</span>
                                                                Link Button 3 (Backup)
                                                            </label>
                                                            <input 
                                                                type="url" 
                                                                value={newProduct.buy_link_3 || ''} 
                                                                onChange={(e) => setNewProduct({...newProduct, buy_link_3: e.target.value})} 
                                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" 
                                                                placeholder="https://backup-link-2.com..." 
                                                            />
                                                        </div>

                                                        {/* Link 4 */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">4</span>
                                                                Link Button 4 (Backup)
                                                            </label>
                                                            <input 
                                                                type="url" 
                                                                value={newProduct.buy_link_4 || ''} 
                                                                onChange={(e) => setNewProduct({...newProduct, buy_link_4: e.target.value})} 
                                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" 
                                                                placeholder="https://backup-link-3.com..." 
                                                            />
                                                        </div>

                                                        {/* Link 5 */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">5</span>
                                                                Link Button 5 (Backup)
                                                            </label>
                                                            <input 
                                                                type="url" 
                                                                value={newProduct.buy_link_5 || ''} 
                                                                onChange={(e) => setNewProduct({...newProduct, buy_link_5: e.target.value})} 
                                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" 
                                                                placeholder="https://backup-link-4.com..." 
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
    // ... rest of the file
