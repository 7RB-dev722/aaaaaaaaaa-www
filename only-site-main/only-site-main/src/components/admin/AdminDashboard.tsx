import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, X, LogOut, Package, RefreshCw, Tag, AlertCircle, CheckCircle, ImageIcon, Eye, EyeOff, Home, UploadCloud, LayoutDashboard, Image as LucideImage, Settings, Link as LinkIcon, Palette, QrCode, Users, CreditCard, Send, Mail, Printer, FileText, KeyRound, Search, Globe, Database } from 'lucide-react';
import { productService, categoryService, winningPhotosService, settingsService, purchaseImagesService, purchaseIntentsService, testSupabaseConnection, Product, Category, WinningPhoto, PurchaseImage, PurchaseIntent, supabase, invoiceTemplateService, InvoiceTemplateData, ProductKey, productKeysService } from '@/lib/supabase';
import SiteContentEditor from './SiteContentEditor';
import InvoiceEditor from './InvoiceEditor';
import ProductKeysManager from './ProductKeysManager';
import UserManagement from './UserManagement';
import { useSettings } from '@/contexts/SettingsContext';
import LocalPaymentManager from './LocalPaymentManager';

// ... existing helper components and constants ...
const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

const WINNING_PHOTO_PRODUCTS = ['Cheatloop PUBG', 'Cheatloop CODM', 'Sinki'];

type AdminTab = 'dashboard' | 'products' | 'categories' | 'photos' | 'purchase-images' | 'purchase-intents' | 'content' | 'settings' | 'invoice-templates' | 'keys' | 'users' | 'local-payments';

interface AdminDashboardProps {
  onLogout: () => void;
}

const PhotoItem = ({ photo, onDelete, saving, isSelected, onSelectToggle }: { photo: WinningPhoto; onDelete: (photo: WinningPhoto) => void; saving: boolean; isSelected: boolean; onSelectToggle: (id: string) => void }) => (
  <div className={`relative group bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 border transition-all duration-200 ${isSelected ? 'border-cyan-500 ring-1 ring-cyan-500/20' : 'border-slate-800 hover:border-slate-600'}`}>
    <div className="absolute top-3 left-3 z-10">
        <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={() => onSelectToggle(photo.id)}
            className="w-5 h-5 text-cyan-600 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500 cursor-pointer"
        />
    </div>
    <img src={photo.image_url} alt={photo.product_name} className="w-full h-40 object-cover rounded-lg bg-slate-800" loading="lazy" />
    <div className="mt-3 px-1">
      <p className="text-white text-sm font-medium truncate">{photo.product_name}</p>
      {photo.description && <p className="text-slate-400 text-xs truncate mt-0.5">{photo.description}</p>}
    </div>
    <button onClick={() => onDelete(photo)} disabled={saving} className="absolute top-2 right-2 p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-600 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm" title="Delete photo">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // ... existing state ...
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
  const [selectedPurchaseIntents, setSelectedPurchaseIntents] = useState<string[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [purchaseIntentFilter, setPurchaseIntentFilter] = useState<'pending' | 'completed'>('pending');
  const [purchaseIntentSearchTerm, setPurchaseIntentSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at'>>({
    title: '', price: 0, features: [''], description: '', buy_link: '', buy_link_2: '', buy_link_3: '', buy_link_4: '', buy_link_5: '', image: '', video_link: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null
  });
  
  const [newWinningPhotos, setNewWinningPhotos] = useState<{ files: File[]; productName: string; description: string }>({
    files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: ''
  });
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const winningPhotoFileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const purchaseImageFileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ... rest of the component logic (useMemo, useEffect, handlers) ...
  const availableKeysCount = useMemo(() => {
    return products.reduce((acc, product) => {
        const count = productKeys.filter(key => key.product_id === product.id && !key.is_used).length;
        acc[product.id] = count;
        return acc;
    }, {} as Record<string, number>);
  }, [products, productKeys]);

  const { pendingIntents, completedIntents } = useMemo(() => {
    const keyMap = new Map<string, ProductKey>();
    productKeys.forEach(key => {
        if (key.purchase_intent_id) {
            keyMap.set(key.purchase_intent_id, key);
        }
    });

    const pending: PurchaseIntent[] = [];
    const completed: (PurchaseIntent & { productKey: ProductKey })[] = [];

    purchaseIntents.forEach(intent => {
        const associatedKey = keyMap.get(intent.id);
        if (associatedKey) {
            completed.push({ ...intent, productKey: associatedKey });
        } else {
            pending.push({ ...intent });
        }
    });

    return { pendingIntents: pending, completedIntents: completed };
  }, [purchaseIntents, productKeys]);

  const filteredPendingIntents = useMemo(() => {
    if (!purchaseIntentSearchTerm) {
        return pendingIntents;
    }
    return pendingIntents.filter(intent => 
        intent.email.toLowerCase().includes(purchaseIntentSearchTerm.toLowerCase())
    );
  }, [pendingIntents, purchaseIntentSearchTerm]);

  const intentsToDisplay = purchaseIntentFilter === 'pending' ? filteredPendingIntents : completedIntents;

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (!settingsLoading) {
      setSettings(siteSettings);
    }
  }, [siteSettings, settingsLoading]);

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (isConnected) {
        await loadData();
      } else {
        setError('Failed to connect to the database. Please check your Supabase settings.');
      }
    } catch (err) {
      console.error('Connection check failed:', err);
      setConnectionStatus('disconnected');
      setError('Failed to connect to the database.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, categoriesData, winningPhotosData, settingsData, purchaseImagesData, purchaseIntentsData, invoiceTemplatesData, productKeysData] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        winningPhotosService.getPhotos(),
        settingsService.getSettings(),
        purchaseImagesService.getAll(),
        purchaseIntentsService.getAll(),
        invoiceTemplateService.getAll(),
        productKeysService.getKeys(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setWinningPhotos(winningPhotosData);
      setSettings(settingsData);
      setPurchaseImages(purchaseImagesData);
      setPurchaseIntents(purchaseIntentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setInvoiceTemplates(invoiceTemplatesData);
      setProductKeys(productKeysData);
      setSuccess('Data loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data from the database.');
    } finally {
      setLoading(false);
    }
  };

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
            buy_link_2: newProduct.purchase_image_id ? '' : (newProduct.buy_link_2 || ''),
            buy_link_3: newProduct.purchase_image_id ? '' : (newProduct.buy_link_3 || ''),
            buy_link_4: newProduct.purchase_image_id ? '' : (newProduct.buy_link_4 || ''),
            buy_link_5: newProduct.purchase_image_id ? '' : (newProduct.buy_link_5 || ''),
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    resetProductForm();
    setNewProduct({
      title: product.title, 
      price: product.price, 
      features: product.features, 
      description: product.description,
      buy_link: product.buy_link, 
      buy_link_2: product.buy_link_2 || '', 
      buy_link_3: product.buy_link_3 || '', 
      buy_link_4: product.buy_link_4 || '', 
      buy_link_5: product.buy_link_5 || '', 
      image: product.image || '', 
      video_link: product.video_link || '', 
      is_popular: product.is_popular || false,
      category: product.category, 
      category_id: product.category_id || '', 
      is_hidden: product.is_hidden || false,
      purchase_image_id: product.purchase_image_id || null
    });
  };

  const resetProductForm = () => {
    setNewProduct({
      title: '', price: 0, features: [''], description: '', 
      buy_link: '', buy_link_2: '', buy_link_3: '', buy_link_4: '', buy_link_5: '', 
      image: '', video_link: '',
      is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null
    });
    setImageUploadFile(null);
    setImagePreviewUrl(null);
    if (productImageInputRef.current) productImageInputRef.current.value = '';
  };

  const handleAddProduct = () => handleProductSubmit(false);
  const handleUpdateProduct = () => handleProductSubmit(true);
  
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      setSaving(true);
      await productService.deleteProduct(id);
      await loadData();
      setSuccess('Product deleted successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] });
  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...newProduct.features];
    updatedFeatures[index] = value;
    setNewProduct({ ...newProduct, features: updatedFeatures });
  };
  const removeFeature = (index: number) => {
    const updatedFeatures = newProduct.features.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, features: updatedFeatures });
  };

  const handleWinningPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewWinningPhotos({ ...newWinningPhotos, files: Array.from(e.target.files) });
    }
  };

  const handleAddWinningPhotos = async () => {
    if (newWinningPhotos.files.length === 0) {
      setError('Please select at least one image.');
      return;
    }
    if (!supabase) {
      setError('Supabase client not configured.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const uploadedPhotos = await Promise.all(newWinningPhotos.files.map(async (file) => {
        const filePath = `winning-photos/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('winning-photos').upload(filePath, file);
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('winning-photos').getPublicUrl(filePath);
        return {
          image_url: publicUrl,
          product_name: newWinningPhotos.productName,
          description: newWinningPhotos.description
        };
      }));

      await winningPhotosService.addPhotos(uploadedPhotos);
      await loadData();
      setNewWinningPhotos({ files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: '' });
      if (winningPhotoFileInputRef.current) winningPhotoFileInputRef.current.value = '';
      setSuccess('Photos added successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWinningPhoto = async (photo: WinningPhoto) => {
    if (!confirm('Delete this photo?')) return;
    try {
      setSaving(true);
      await winningPhotosService.deletePhotos([photo]);
      await loadData();
      setSuccess('Photo deleted.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
        prev.includes(photoId) 
            ? prev.filter(id => id !== photoId) 
            : [...prev, photoId]
    );
  };

  const handleSelectAllForProduct = (productName: string, shouldSelect: boolean) => {
    const photosToToggle = winningPhotos.filter(p => p.product_name === productName).map(p => p.id);
    if (shouldSelect) {
        setSelectedPhotos(prev => [...new Set([...prev, ...photosToToggle])]);
    } else {
        setSelectedPhotos(prev => prev.filter(id => !photosToToggle.includes(id)));
    }
  };

  const handleMoveSelected = async () => {
    if (selectedPhotos.length === 0 || !moveTargetProduct) return;
    try {
        setSaving(true);
        await winningPhotosService.movePhotos(selectedPhotos, moveTargetProduct);
        await loadData();
        setSelectedPhotos([]);
        setShowMoveModal(false);
        setSuccess('Photos moved successfully.');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await settingsService.updateSettings(settingsArray);
      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductVisibility = async (productId: string, currentHiddenStatus: boolean) => {
    try {
        setSaving(true);
        await productService.updateProduct(productId, { is_hidden: !currentHiddenStatus });
        await loadData();
        setSuccess(`Product ${!currentHiddenStatus ? 'hidden' : 'visible'}.`);
        setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleSelectImage = (imagePath: string) => {
    setNewProduct({ ...newProduct, image: imagePath });
    setImagePreviewUrl(imagePath);
    setShowImageSelector(false);
  };

  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
        setSaving(true);
        await categoryService.addCategory(newCategoryName);
        setNewCategoryName('');
        await loadData();
        setSuccess('Category added.');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
        setSaving(true);
        await categoryService.deleteCategory(id);
        await loadData();
        setSuccess('Category deleted.');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setNewProduct({ 
        ...newProduct, 
        category_id: categoryId,
        category: category ? (category.slug.includes('codm') ? 'codm' : 'pubg') : 'pubg'
    });
  };

  const handlePurchaseImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewPurchaseImage({ ...newPurchaseImage, file });
    }
  };

  const handleAddPurchaseImage = async () => {
    if (!newPurchaseImage.file || !newPurchaseImage.name) {
        setError('Please provide a name and select an image.');
        return;
    }
    if (!supabase) {
        setError('Supabase client not configured.');
        return;
    }

    try {
        setSaving(true);
        const filePath = `purchase-images/${Date.now()}-${newPurchaseImage.file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('purchase-images').upload(filePath, newPurchaseImage.file);
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('purchase-images').getPublicUrl(filePath);
        await purchaseImagesService.addImage(newPurchaseImage.name, publicUrl);
        
        setNewPurchaseImage({ file: null, name: '' });
        if (purchaseImageFileInputRef.current) purchaseImageFileInputRef.current.value = '';
        await loadData();
        setSuccess('Payment QR added successfully.');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleDeletePurchaseImage = async (image: PurchaseImage) => {
    if (!confirm('Delete this payment QR code?')) return;
    try {
        setSaving(true);
        await purchaseImagesService.deleteImage(image);
        await loadData();
        setSuccess('Payment QR deleted.');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleTogglePurchaseIntentSelection = (intentId: string) => {
    setSelectedPurchaseIntents(prev => 
        prev.includes(intentId) 
            ? prev.filter(id => id !== intentId) 
            : [...prev, intentId]
    );
  };

  const handleSelectAllPurchaseIntents = (shouldSelect: boolean) => {
    if (shouldSelect) {
        setSelectedPurchaseIntents(intentsToDisplay.map(i => i.id));
    } else {
        setSelectedPurchaseIntents([]);
    }
  };

  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  const getFilteredImages = () => selectedImageCategory === 'all' ? AVAILABLE_IMAGES : AVAILABLE_IMAGES.filter(img => img.category === selectedImageCategory);

  const generateInvoiceHTML = (intent: PurchaseIntent | null, key: string) => {
    if (!intent) return '';
    return `
      <html>
        <body style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Invoice Preview</h2>
          <p><strong>Product:</strong> ${intent.product_title}</p>
          <p><strong>Key:</strong> ${key || '[Key will appear here]'}</p>
          <p><strong>Customer:</strong> ${intent.email}</p>
        </body>
      </html>
    `;
  };

  const handleInternalPrint = () => {
    if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.print();
    }
  };

  const handleExternalPrint = () => {
    if (!invoiceModalIntent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        if (iframeRef.current?.contentDocument) {
            printWindow.document.write(iframeRef.current.contentDocument.documentElement.outerHTML);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    }
  };

  const handleUseKey = async (key: ProductKey) => {
    if (!invoiceModalIntent) return;
    if (!confirm(`Assign key ${key.key_value} to ${invoiceModalIntent.email}?`)) return;
    
    try {
        setSaving(true);
        await productKeysService.assignSpecificKey(key.id, invoiceModalIntent.email, invoiceModalIntent.id);
        setProductKeyForInvoice(key.key_value);
        await loadData();
        setSuccess('Key assigned successfully.');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleSendPdfToGmail = async () => {
    if (!invoiceModalIntent || !productKeyForInvoice) return;
    
    const subject = encodeURIComponent(`Your Order: ${invoiceModalIntent.product_title}`);
    const body = encodeURIComponent(`Thank you for your purchase!\n\nProduct: ${invoiceModalIntent.product_title}\nKey: ${productKeyForInvoice}\n\nRegards,\nCheatloop Team`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${invoiceModalIntent.email}&su=${subject}&body=${body}`;
    
    window.open(gmailUrl, '_blank');
  };

  const NavButton = ({ tab, label, icon: Icon }: { tab: AdminTab; label: string; icon: React.ElementType }) => (
    <button
        onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
            activeTab === tab 
                ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        <Icon className={`w-5 h-5 ${activeTab === tab ? 'text-cyan-400' : 'text-slate-500'}`} />
        <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#030008] text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="flex h-screen pt-16 md:pt-0 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
            fixed md:relative z-40 w-72 h-full bg-[#05050a] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Sidebar Content ... */}
            <div className="p-6 border-b border-white/5 hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg tracking-tight">Admin Panel</h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs text-slate-500 font-medium">System Online</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
                <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main</p>
                    <NavButton tab="dashboard" label="Overview" icon={LayoutDashboard} />
                    <NavButton tab="purchase-intents" label="Orders" icon={CreditCard} />
                    <NavButton tab="keys" label="Product Keys" icon={KeyRound} />
                </div>

                <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Management</p>
                    <NavButton tab="products" label="Products" icon={Package} />
                    <NavButton tab="categories" label="Categories" icon={Tag} />
                    <NavButton tab="photos" label="Gallery" icon={LucideImage} />
                    <NavButton tab="purchase-images" label="Payment QR" icon={QrCode} />
                    <NavButton tab="local-payments" label="Local Methods" icon={Globe} />
                </div>

                <div>
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System</p>
                    <NavButton tab="users" label="Users" icon={Users} />
                    <NavButton tab="content" label="Site Content" icon={Palette} />
                    <NavButton tab="invoice-templates" label="Invoices" icon={FileText} />
                    <NavButton tab="settings" label="Settings" icon={Settings} />
                </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#080810]">
                <div className="flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                        <Home className="w-4 h-4" />
                        <span>View Site</span>
                    </a>
                    <button onClick={onLogout} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Logout">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#030008] relative custom-scrollbar">
            {/* Header ... */}
            <header className="sticky top-0 z-30 bg-[#030008]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 hidden md:flex items-center justify-between">
                <h2 className="text-xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
                <div className="flex items-center gap-4">
                    <button onClick={loadData} disabled={loading} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                            AD
                        </div>
                        <span className="text-sm font-medium text-slate-300">Admin</span>
                    </div>
                </div>
            </header>

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {/* Alerts ... */}
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-green-400 animate-fade-in-up">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}
                
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-400 animate-fade-in-up">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="hover:text-red-300"><X className="w-5 h-5" /></button>
                    </div>
                )}

                <div className="animate-fade-in-up">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Products', value: products.length, icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                                { label: 'Categories', value: categories.length, icon: Tag, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                                { label: 'Gallery Photos', value: winningPhotos.length, icon: ImageIcon, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                                { label: 'Total Orders', value: purchaseIntents.length, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                            ].map((stat, i) => (
                                <div key={i} className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-black/20 ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'local-payments' && <LocalPaymentManager />}
                    {activeTab === 'keys' && <ProductKeysManager products={products} keys={productKeys} onKeysUpdate={loadData} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} />}
                    {activeTab === 'content' && <SiteContentEditor settings={settings} onSettingsChange={setSettings} onSave={handleSaveSettings} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} />}
                    {activeTab === 'invoice-templates' && <InvoiceEditor />}
                    
                    {/* Purchase Intents Tab ... */}
                    {activeTab === 'purchase-intents' && (
                        // ... existing Purchase Intents UI ...
                        <div className="space-y-6">
                            {/* ... filters ... */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                <div className="flex bg-slate-800 p-1 rounded-xl w-full md:w-auto">
                                    <button
                                        onClick={() => { setPurchaseIntentFilter('pending'); setPurchaseIntentSearchTerm(''); }}
                                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${purchaseIntentFilter === 'pending' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Pending ({pendingIntents.length})
                                    </button>
                                    <button
                                        onClick={() => { setPurchaseIntentFilter('completed'); setPurchaseIntentSearchTerm(''); }}
                                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${purchaseIntentFilter === 'completed' ? 'bg-green-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Completed ({completedIntents.length})
                                    </button>
                                </div>

                                {purchaseIntentFilter === 'pending' && (
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Search by email..."
                                            value={purchaseIntentSearchTerm}
                                            onChange={(e) => setPurchaseIntentSearchTerm(e.target.value)}
                                            className="w-full bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
                                            <tr>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Product</th>
                                                <th className="p-4">User</th>
                                                {purchaseIntentFilter === 'completed' && <th className="p-4">Key Info</th>}
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {intentsToDisplay.map((intent: any) => (
                                                <tr key={intent.id} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(intent.created_at).toLocaleDateString()} <span className="text-xs opacity-50">{new Date(intent.created_at).toLocaleTimeString()}</span></td>
                                                    <td className="p-4">
                                                        <span className="font-medium text-white">{intent.product_title}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-white">{intent.email}</span>
                                                            <span className="text-xs text-slate-500">{intent.phone_number} • {intent.country}</span>
                                                        </div>
                                                    </td>
                                                    {purchaseIntentFilter === 'completed' && (
                                                        <td className="p-4">
                                                            <code className="bg-black/30 px-2 py-1 rounded text-xs text-green-400 font-mono">{intent.productKey.key_value}</code>
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => { setInvoiceModalIntent(intent); setProductKeyForInvoice('productKey' in intent ? intent.productKey.key_value : null); }} 
                                                            className="p-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-lg transition-all"
                                                            title="Process Order"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {intentsToDisplay.length === 0 && (
                                    <div className="p-12 text-center text-slate-500">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p>No orders found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Purchase Images Tab ... */}
                    {activeTab === 'purchase-images' && (
                        // ... existing Purchase Images UI ...
                        <div className="space-y-8">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5 text-cyan-400" /> Upload QR Code
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6 items-end">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Method Name</label>
                                        <input 
                                            type="text" 
                                            value={newPurchaseImage.name} 
                                            onChange={(e) => setNewPurchaseImage({ ...newPurchaseImage, name: e.target.value })} 
                                            className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent" 
                                            placeholder="e.g. ZainCash QR" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">QR Image</label>
                                        <input 
                                            type="file" 
                                            ref={purchaseImageFileInputRef} 
                                            onChange={handlePurchaseImageFileChange} 
                                            accept="image/*" 
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer" 
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAddPurchaseImage} 
                                        disabled={saving} 
                                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                                    >
                                        {saving ? 'Uploading...' : 'Add Payment Method'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {purchaseImages.map(image => (
                                    <div key={image.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all">
                                        <div className="aspect-square bg-black/20 p-4 flex items-center justify-center">
                                            <img src={image.image_url} alt={image.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="p-3 bg-slate-900 border-t border-slate-800">
                                            <p className="text-sm font-medium text-white truncate text-center">{image.name}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeletePurchaseImage(image)} 
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Photos Tab ... */}
                    {activeTab === 'photos' && (
                        // ... existing Photos UI ...
                        <div className="space-y-8">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-pink-400" /> Add to Gallery
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Select Images</label>
                                        <input 
                                            type="file" 
                                            multiple 
                                            ref={winningPhotoFileInputRef} 
                                            onChange={handleWinningPhotoFileChange} 
                                            accept="image/*" 
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 cursor-pointer" 
                                        />
                                        <p className="text-xs text-slate-500">Max 10 images at once.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Product Category</label>
                                        <select 
                                            value={newWinningPhotos.productName} 
                                            onChange={(e) => setNewWinningPhotos({...newWinningPhotos, productName: e.target.value})} 
                                            className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                                        >
                                            {WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Description (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={newWinningPhotos.description} 
                                            onChange={(e) => setNewWinningPhotos({...newWinningPhotos, description: e.target.value})} 
                                            className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500/50 focus:border-transparent" 
                                            placeholder="Short caption..." 
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={handleAddWinningPhotos} 
                                        disabled={saving} 
                                        className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-900/20 disabled:opacity-50"
                                    >
                                        {saving ? 'Uploading...' : 'Upload Photos'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button
                                    onClick={() => setPhotoProductFilter('all')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${photoProductFilter === 'all' ? 'bg-white text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                    All
                                </button>
                                {WINNING_PHOTO_PRODUCTS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPhotoProductFilter(p)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${photoProductFilter === p ? 'bg-white text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-12">
                                {Object.entries(
                                    winningPhotos.reduce((acc, photo) => {
                                        const key = photo.product_name;
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(photo);
                                        return acc;
                                    }, {} as Record<string, WinningPhoto[]>)
                                )
                                .filter(([productName]) => photoProductFilter === 'all' || productName === photoProductFilter)
                                .map(([productName, photos]) => {
                                    const allInGroupSelected = photos.length > 0 && photos.every(p => selectedPhotos.includes(p.id));
                                    return (
                                    <div key={productName} className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="w-2 h-6 bg-cyan-500 rounded-full"></span>
                                                {productName} 
                                                <span className="text-slate-500 text-sm font-normal">({photos.length})</span>
                                            </h4>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={allInGroupSelected}
                                                    onChange={(e) => handleSelectAllForProduct(productName, e.target.checked)}
                                                    className="rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                                                />
                                                Select All
                                            </label>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {photos.map(photo => (
                                                <PhotoItem 
                                                    key={photo.id} 
                                                    photo={photo} 
                                                    onDelete={handleDeleteWinningPhoto} 
                                                    saving={saving}
                                                    isSelected={selectedPhotos.includes(photo.id)}
                                                    onSelectToggle={handleTogglePhotoSelection}
                                                />
                                            ))}
                                        </div>
                                        {photos.length === 0 && <p className="text-slate-500 text-center py-12 italic">No photos in this category.</p>}
                                    </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Product Inventory</h3>
                                <button onClick={() => setIsAddingProduct(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-900/20">
                                    <Plus className="w-5 h-5" /> Add Product
                                </button>
                            </div>

                            {(isAddingProduct || editingProduct) && (
                                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl animate-fade-in-up relative z-10">
                                    <h2 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-slate-800">{editingProduct ? 'Edit Product' : 'Create New Product'}</h2>
                                    
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                                                <input type="text" value={newProduct.title} onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" placeholder="e.g. Cheatloop ESP" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase">Price ($)</label>
                                                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                                                    <select value={newProduct.category_id} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50">
                                                        <option value="">Select Category</option>
                                                        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Purchase Method</label>
                                                <div className="flex gap-4">
                                                    <label className={`flex-1 cursor-pointer border rounded-xl p-4 text-center transition-all ${newProduct.purchase_image_id === null ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                                        <input type="radio" name="pm" checked={newProduct.purchase_image_id === null} onChange={() => setNewProduct({...newProduct, purchase_image_id: null})} className="hidden" />
                                                        External Link
                                                    </label>
                                                    <label className={`flex-1 cursor-pointer border rounded-xl p-4 text-center transition-all ${newProduct.purchase_image_id !== null ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                                        <input type="radio" name="pm" checked={newProduct.purchase_image_id !== null} onChange={() => setNewProduct({...newProduct, buy_link: '', purchase_image_id: ''})} className="hidden" />
                                                        QR Code
                                                    </label>
                                                </div>
                                                
                                                {newProduct.purchase_image_id === null ? (
                                                    <div className="space-y-4 animate-fade-in-up">
                                                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                                                            <div className="flex items-center gap-2 mb-4 text-cyan-400">
                                                                <Database className="w-4 h-4" />
                                                                <span className="text-xs font-bold uppercase tracking-wider">Database Connected Links</span>
                                                            </div>
                                                            
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                        <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px]">1</span>
                                                                        Primary Link
                                                                    </label>
                                                                    <input 
                                                                        type="url" 
                                                                        value={newProduct.buy_link} 
                                                                        onChange={(e) => setNewProduct({...newProduct, buy_link: e.target.value})} 
                                                                        className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50" 
                                                                        placeholder="https://primary-link.com..." 
                                                                    />
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {/* Link 2 */}
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                                                                            Visa / Backup Link 1
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
                                                                            Visa / Backup Link 2
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
                                                                            Visa / Backup Link 3
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
                                                                            Visa / Backup Link 4
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
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <select value={newProduct.purchase_image_id || ''} onChange={(e) => setNewProduct({...newProduct, purchase_image_id: e.target.value})} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50">
                                                        <option value="">Select QR Image</option>
                                                        {purchaseImages.map((img) => (<option key={img.id} value={img.id}>{img.name}</option>))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Features</label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                    {newProduct.features.map((feature, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <input type="text" value={feature} onChange={(e) => updateFeature(index, e.target.value)} className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Feature..." />
                                                            {newProduct.features.length > 1 && <button onClick={() => removeFeature(index)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={addFeature} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wide">+ Add Feature</button>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Image</label>
                                                <div className="flex gap-4 items-start">
                                                    <div className="w-24 h-24 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
                                                        <img src={imagePreviewUrl || newProduct.image || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/100x100/1e293b/475569?text=IMG'} alt="Preview" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <button onClick={() => productImageInputRef.current?.click()} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg transition-colors border border-slate-700">Upload New</button>
                                                        <button onClick={() => setShowImageSelector(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg transition-colors border border-slate-700">Select Existing</button>
                                                        <input ref={productImageInputRef} type="file" className="hidden" accept="image/*" onChange={handleProductImageFileChange} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                                    <input type="checkbox" checked={newProduct.is_popular} onChange={(e) => setNewProduct({...newProduct, is_popular: e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-cyan-600 focus:ring-cyan-500" />
                                                    Mark as Popular
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                                    <input type="checkbox" checked={newProduct.is_hidden} onChange={(e) => setNewProduct({...newProduct, is_hidden: e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-red-600 focus:ring-red-500" />
                                                    Hide Product
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-slate-800">
                                        <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); resetProductForm(); }} className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                                        <button onClick={editingProduct ? handleUpdateProduct : handleAddProduct} disabled={saving} className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-cyan-900/20">
                                            {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-16 h-16 bg-slate-800 rounded-xl p-2 flex items-center justify-center">
                                                {product.image ? <img src={product.image} alt={product.title} className="max-w-full max-h-full object-contain" /> : <Package className="text-slate-600" />}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleToggleProductVisibility(product.id, product.is_hidden || false)} className={`p-2 rounded-lg transition-colors ${product.is_hidden ? 'text-slate-600 hover:text-white' : 'text-yellow-400 bg-yellow-400/10'}`}>
                                                    {product.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => handleEditProduct(product)} className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">{product.title}</h3>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">{getCategoryName(product.category_id)}</span>
                                            <span className="font-bold text-cyan-400 text-lg">${product.price}</span>
                                        </div>
                                        <div className="mt-4 flex gap-2 flex-wrap">
                                            {product.is_popular && <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs font-bold">POPULAR</span>}
                                            {product.purchase_image_id ? (
                                                <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1"><QrCode className="w-3 h-3" /> QR</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1"><LinkIcon className="w-3 h-3" /> LINK</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="space-y-8">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1 w-full">
                                    <h3 className="text-lg font-bold text-white mb-1">Add Category</h3>
                                    <p className="text-slate-400 text-sm">Create new product categories.</p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <input 
                                        type="text" 
                                        value={newCategoryName} 
                                        onChange={(e) => setNewCategoryName(e.target.value)} 
                                        className="flex-1 md:w-64 bg-slate-800 border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/50" 
                                        placeholder="Category Name" 
                                    />
                                    <button onClick={handleAddCategory} disabled={saving} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">Add</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categories.map((category) => (
                                    <div key={category.id} className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex justify-between items-center group hover:border-purple-500/30 transition-all">
                                        <div>
                                            <h4 className="font-bold text-white">{category.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono mt-1">{category.slug}</p>
                                        </div>
                                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>

        {/* ... existing modals (Image Selector, Move Modal, Invoice Modal, Print Options) ... */}
        {showImageSelector && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Select Image</h3>
                        <button onClick={() => setShowImageSelector(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><X /></button>
                    </div>
                    <div className="p-6 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {getFilteredImages().map((image) => (
                            <div key={image.id} onClick={() => handleSelectImage(image.path)} className="cursor-pointer group">
                                <div className="aspect-square bg-slate-800 rounded-xl p-2 border border-slate-700 group-hover:border-cyan-500 transition-colors">
                                    <img src={image.path} alt={image.name} className="w-full h-full object-contain" />
                                </div>
                                <p className="text-xs text-center mt-2 text-slate-400 group-hover:text-white truncate">{image.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {showMoveModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
                    <h3 className="text-xl font-bold text-white mb-4">Move Photos</h3>
                    <p className="text-slate-400 mb-6">Select the destination product for {selectedPhotos.length} photos.</p>
                    <select 
                        value={moveTargetProduct} 
                        onChange={(e) => setMoveTargetProduct(e.target.value)}
                        className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white mb-6"
                    >
                        <option value="">Select Destination</option>
                        {WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleMoveSelected} disabled={!moveTargetProduct || saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Move</button>
                    </div>
                </div>
            </div>
        )}

        {invoiceModalIntent && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                    <button onClick={() => setInvoiceModalIntent(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-full text-white z-10"><X /></button>
                    
                    <div className="grid md:grid-cols-2">
                        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-800">
                            <h3 className="text-2xl font-bold text-white mb-6">Order Details</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between py-3 border-b border-slate-800">
                                    <span className="text-slate-400">Product</span>
                                    <span className="text-white font-medium">{invoiceModalIntent.product_title}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-slate-800">
                                    <span className="text-slate-400">Email</span>
                                    <span className="text-white font-medium">{invoiceModalIntent.email}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-slate-800">
                                    <span className="text-slate-400">Phone</span>
                                    <span className="text-white font-medium">{invoiceModalIntent.phone_number}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-slate-800">
                                    <span className="text-slate-400">Country</span>
                                    <span className="text-white font-medium">{invoiceModalIntent.country}</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Assign Product Key</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={productKeyForInvoice || ''} 
                                        onChange={(e) => setProductKeyForInvoice(e.target.value)}
                                        className="flex-1 bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white font-mono"
                                        placeholder="Key..."
                                    />
                                </div>
                                
                                <div className="mt-4">
                                    <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Available Keys ({availableKeysCount[invoiceModalIntent.product_id] || 0})</p>
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
                                        {productKeys
                                            .filter(k => k.product_id === invoiceModalIntent?.product_id && !k.is_used)
                                            .map(key => (
                                                <div key={key.id} className="flex items-center justify-between p-3 border-b border-slate-800 last:border-0 hover:bg-slate-900 transition-colors">
                                                    <code className="text-xs text-green-400 font-mono">{key.key_value}</code>
                                                    <button 
                                                        onClick={() => handleUseKey(key)}
                                                        disabled={saving}
                                                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        Use
                                                    </button>
                                                </div>
                                            ))
                                        }
                                        {(!productKeys.some(k => k.product_id === invoiceModalIntent?.product_id && !k.is_used)) && (
                                            <p className="text-center text-xs text-slate-500 p-4">No keys available. Add more keys.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <button 
                                    onClick={() => { if(productKeyForInvoice) setShowPrintOptions(true); }}
                                    disabled={!productKeyForInvoice}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button 
                                    onClick={handleSendPdfToGmail}
                                    disabled={!productKeyForInvoice || saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-4 h-4" /> Email
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-950 p-8 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-400 mb-4">Preview</h3>
                            <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-inner relative">
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={generateInvoiceHTML(invoiceModalIntent, productKeyForInvoice || '')}
                                    className="w-full h-full absolute inset-0"
                                    title="Invoice Preview"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showPrintOptions && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm text-center">
                    <h3 className="text-xl font-bold text-white mb-6">Select Print Method</h3>
                    <div className="space-y-3">
                        <button onClick={handleInternalPrint} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium">Quick Print</button>
                        <button onClick={handleExternalPrint} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium">Open in New Window</button>
                        <button onClick={() => setShowPrintOptions(false)} className="w-full py-3 text-slate-500 hover:text-white">Cancel</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
