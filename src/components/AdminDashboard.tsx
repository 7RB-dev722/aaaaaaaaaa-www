import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DiscordSettings } from './DiscordSettings';
import ReactDOMServer from 'react-dom/server';
import { 
  Plus, Edit, Trash2, X, LogOut, Package, Tag, AlertCircle, CheckCircle, 
  ImageIcon, Eye, EyeOff, Home, UploadCloud, LayoutDashboard, Settings, 
  Link as LinkIcon, Palette, QrCode, Users, CreditCard, Send, Mail, Printer, 
  MessageSquare, ExternalLink, FileText, KeyRound, Clock, Search, Filter, 
  TimerOff, Copy, Calendar, Bell, BellRing, BarChart3, ChevronDown, 
  AlertTriangle, ShoppingCart, Menu, ChevronRight, ChevronLeft, ImagePlus, UserPlus,
  ArrowLeft, ArrowRightLeft, Laptop, Smartphone, Globe, LogIn, ShieldCheck, ShieldAlert, Check, Banknote,
  Repeat, MapPin, Download, History, User, XCircle, CheckCircle2, Crown, Sparkles, Activity, Trophy, MessageCircle, Ban, Video,
  DollarSign, Image, ListPlus
} from 'lucide-react';
import { 
  productService, categoryService, winningPhotosService, settingsService, 
  purchaseImagesService, purchaseIntentsService, testSupabaseConnection, 
  Product, Category, WinningPhoto, SiteSetting, PurchaseImage, PurchaseIntent, 
  supabase, invoiceTemplateService, InvoiceTemplateData, ProductKey, productKeysService, ProductLink,
  videoLibraryService, VideoLibraryItem
} from '../lib/supabase';
import { discordService } from '../lib/discordService';
import { trafficService, VisitorLog, BannedCountry, BannedIp, BannedCustomer, BlockedLog } from '../lib/trafficService';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import SiteContentEditor from './SiteContentEditor';
import InvoiceEditor from './InvoiceEditor';
import ProductKeysManager from './ProductKeysManager';
import ProductKeyStats from './ProductKeyStats';
import ProductMigrationTracker from './ProductMigrationTracker';
import UserManagement from './UserManagement';
import VerifiedUserManagement from './VerifiedUserManagement';
import LocalPaymentManager from './LocalPaymentManager';
import InvoiceTemplate, { InvoiceTheme } from './InvoiceTemplate';
import { TopPurchasersModal } from './TopPurchasersModal';
import html2canvas from 'html2canvas';
import { countries } from '../data/countries';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DiscordTools } from './DiscordTools';

import { moneyMotionService } from '../lib/moneyMotionService';
import { MoneyMotionManager } from './MoneyMotionManager';
import { brevoService } from '../lib/brevoService';

// --- Helper Functions ---
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.51, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.start(now);
    osc.stop(now + 1.2);
  } catch (e) {
    console.error("Audio context not supported or blocked", e);
  }
};

// --- Constants & Types ---
interface AdminDashboardProps {
  onLogout: () => void;
}

const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

const WINNING_PHOTO_PRODUCTS = ['Cheatloop PUBG', 'Cheatloop CODM', 'Sinki'];

type AdminTab = 'dashboard' | 'products' | 'categories' | 'photos' | 'purchase-images' | 'purchase-intents' | 'content' | 'settings' | 'invoice-templates' | 'keys' | 'key-stats' | 'migrations' | 'users' | 'verified-users' | 'expired-keys' | 'local-payments' | 'discord-tools' | 'bans' | 'videos' | 'security-logs' | 'moneymotion' | 'traffic';

// Grouped Menu Structure for Sidebar
const MENU_GROUPS = [
  {
    title: 'نظرة عامة',
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { id: 'traffic', label: 'الزيارات', icon: Activity },
      { id: 'key-stats', label: 'الإحصائيات', icon: BarChart3 },
      { id: 'migrations', label: 'تحركات المشتركين', icon: ArrowRightLeft },
    ]
  },
  {
    title: 'بوابة الدفع (MoneyMotion)',
    items: [
      { id: 'moneymotion', label: 'إدارة MoneyMotion', icon: CreditCard },
    ]
  },
  {
    title: 'إدارة المتجر',
    items: [
      { id: 'products', label: 'المنتجات', icon: Package },
      { id: 'categories', label: 'الأقسام', icon: Tag },
      { id: 'keys', label: 'المفاتيح', icon: KeyRound },
      { id: 'expired-keys', label: 'الاشتراكات', icon: TimerOff },
      { id: 'videos', label: 'مكتبة الفيديو', icon: Video },
    ]
  },
  {
    title: 'المبيعات والمالية',
    items: [
      { id: 'purchase-intents', label: 'الطلبات', icon: ShoppingCart },
      { id: 'purchase-images', label: 'صور الدفع', icon: QrCode },
      { id: 'local-payments', label: 'دفع محلي', icon: Banknote },
      { id: 'invoice-templates', label: 'الفواتير', icon: FileText },
    ]
  },
  {
    title: 'المحتوى والمظهر',
    items: [
      { id: 'photos', label: 'معرض الفوز', icon: ImageIcon },
      { id: 'content', label: 'تخصيص الموقع', icon: Palette },
    ]
  },
  {
    title: 'النظام',
    items: [
      { id: 'users', label: 'المستخدمين', icon: Users },
      { id: 'verified-users', label: 'الزبائن الموثقين', icon: ShieldCheck },
      { id: 'bans', label: 'نظام الحظر', icon: Ban },
      { id: 'security-logs', label: 'سجل الحظر', icon: ShieldCheck },
      { id: 'discord-tools', label: 'أدوات ديسكورد', icon: MessageSquare },
      { id: 'settings', label: 'الإعدادات', icon: Settings },
    ]
  }
];

const INVOICE_THEMES: Record<string, InvoiceTheme & { name: string }> = {
  navy: { name: 'أزرق داكن (افتراضي)', backgroundColor: '#0f1724', textColor: '#e6eef8', panelColor: '#1e293b', borderColor: '#334155', mutedColor: '#94a3b8' },
  midnight: { name: 'أسود ليلي', backgroundColor: '#000000', textColor: '#ffffff', panelColor: '#121212', borderColor: '#333333', mutedColor: '#888888' },
  white: { name: 'أبيض (قياسي)', backgroundColor: '#ffffff', textColor: '#0f1724', panelColor: '#f1f5f9', borderColor: '#e2e8f0', mutedColor: '#64748b' },
  royal: { name: 'أزرق ملكي', backgroundColor: '#172554', textColor: '#f0f9ff', panelColor: '#1e3a8a', borderColor: '#1d4ed8', mutedColor: '#93c5fd' },
};

// --- Components ---

const SortableCategoryItem = ({ category, onDelete, saving }: { category: Category, onDelete: (id: string) => void, saving: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1 };
    return (
        <div ref={setNodeRef} style={style} className="group flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl pl-4 pr-2 py-3 hover:border-purple-500/50 hover:shadow-lg transition-all duration-300 select-none backdrop-blur-sm">
            <div className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-white" {...attributes} {...listeners}><Menu className="w-4 h-4" /></div>
            <div className="flex-1"><h3 className="text-white font-bold text-sm">{category.name}</h3><p className="text-gray-500 text-xs font-mono">{category.slug}</p></div>
            <div className="h-8 w-px bg-white/10 mx-1"></div>
            <button onClick={() => onDelete(category.id)} disabled={saving} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
        </div>
    );
};

const SortableProductRow = ({ product, onEdit, onDelete, onToggleVisibility, getCategoryName }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1, position: 'relative' as 'relative' };
    
    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-white/5 transition-colors">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-2 text-gray-500 hover:text-white" {...attributes} {...listeners}>
                        <Menu className="w-4 h-4" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-600" />}
                    </div>
                    <span className="font-bold text-white">{product.title}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex flex-col">
                    <span className="font-mono text-cyan-400 font-bold">${product.price}</span>
                    {product.payment_gateway_tax > 0 && (
                        <span className="text-[10px] text-yellow-500 font-bold">+{product.payment_gateway_tax}% ضريبة</span>
                    )}
                </div>
            </td>
            <td className="p-4"><span className="bg-black px-2 py-1 rounded text-xs text-gray-400 border border-white/10">{getCategoryName(product.category_id)}</span></td>
            <td className="p-4 text-center">
                {product.is_hidden ? <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">مخفي</span> : <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">نشط</span>}
            </td>
            <td className="p-4">
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onToggleVisibility(product.id, product.is_hidden || false)} className="p-2 bg-black hover:bg-yellow-500/10 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors">{product.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                    <button onClick={() => onEdit(product)} className="p-2 bg-black hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(product.id)} className="p-2 bg-black hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
};

const ModernCheckbox = ({ checked, onChange, id }: { checked: boolean, onChange: () => void, id?: string }) => (
  <label htmlFor={id} className="relative flex items-center justify-center w-5 h-5 cursor-pointer group">
    <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
    <div className={`absolute inset-0 rounded border-2 transition-all duration-200 ${checked ? 'bg-cyan-600 border-cyan-600' : 'bg-transparent border-slate-600 group-hover:border-cyan-500'}`}></div>
    {checked && <Check className="w-3 h-3 text-white z-10" strokeWidth={3} />}
  </label>
);

const PhotoItem: React.FC<any> = ({ photo, isSelected, onSelectToggle, onDelete, saving }) => (
    <div className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-square ${isSelected ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-transparent'}`}>
        <img src={photo.image_url} alt={photo.description} className="w-full h-full object-cover bg-black" onClick={() => onSelectToggle(photo.id)} />
        <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={() => onSelectToggle(photo.id)}>
            {isSelected && <CheckCircle className="w-8 h-8 text-cyan-400" />}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(photo); }} disabled={saving} className="absolute top-2 right-2 p-2 bg-red-600/80 rounded-lg text-white hover:bg-red-500 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 z-10"><Trash2 className="w-4 h-4" /></button>
        {photo.description && <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-[10px] text-white truncate">{photo.description}</div>}
    </div>
);

const ModernDateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="relative group">
        <div className="absolute -top-2 right-3 bg-slate-900 px-1 text-[10px] text-cyan-400 font-bold z-10">{label}</div>
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden focus-within:border-cyan-500 transition-colors h-9 w-36">
            <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-full bg-transparent text-white px-2 text-xs focus:outline-none font-mono text-center uppercase tracking-wider" style={{ colorScheme: 'dark' }} />
        </div>
    </div>
);

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                    isExpired: false
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.isExpired) {
        return <span className="text-red-400 font-bold text-xs bg-red-500/10 px-2 py-1 rounded">منتهي الصلاحية</span>;
    }

    return (
        <div className="flex gap-1 items-center text-xs font-mono font-bold">
            <div className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 min-w-[24px] text-center">{timeLeft.days}d</div>
            <span className="text-gray-600">:</span>
            <div className="bg-slate-800 px-1.5 py-0.5 rounded text-white min-w-[24px] text-center">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <span className="text-gray-600">:</span>
            <div className="bg-slate-800 px-1.5 py-0.5 rounded text-white min-w-[24px] text-center">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <span className="text-gray-600">:</span>
            <div className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-400 min-w-[24px] text-center">{timeLeft.seconds.toString().padStart(2, '0')}</div>
        </div>
    );
};

// --- Main Component ---

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [winningPhotos, setWinningPhotos] = useState<WinningPhoto[]>([]);
  const [purchaseImages, setPurchaseImages] = useState<PurchaseImage[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplateData[]>([]);
  const [productKeys, setProductKeys] = useState<ProductKey[]>([]);
  const { settings: siteSettings, loading: settingsLoading, refreshSettings } = useSettings();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile/desktop toggle
  
  // Feature specific states
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>('all');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetProduct, setMoveTargetProduct] = useState('');
  const [photoProductFilter, setPhotoProductFilter] = useState<string>('all');
  const [newPurchaseImage, setNewPurchaseImage] = useState<{ file: File | null; name: string }>({ file: null, name: '' });
  const [invoiceModalIntent, setInvoiceModalIntent] = useState<PurchaseIntent | null>(null);
  const [productKeyForInvoice, setProductKeyForInvoice] = useState<string | null>(null);
  const [isUsingManualKey, setIsUsingManualKey] = useState(false);
  const [manualKeyError, setManualKeyError] = useState<string | null>(null);
  const [selectedPurchaseIntents, setSelectedPurchaseIntents] = useState<string[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [purchaseIntentFilter, setPurchaseIntentFilter] = useState<'pending' | 'completed'>('pending');
  const [purchaseIntentSearchTerm, setPurchaseIntentSearchTerm] = useState('');
  const [selectedInvoiceTheme, setSelectedInvoiceTheme] = useState<string>('navy');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  
  // Subscription States
  const [subscriptionFilter, setSubscriptionFilter] = useState<{ productId: string; targetDate: string; searchTerm: string; viewMode: 'list' | 'grouped' }>({ productId: 'all', targetDate: '', searchTerm: '', viewMode: 'list' });
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'multi_active'>('all');
  const [selectedUserHistory, setSelectedUserHistory] = useState<string | null>(null);
  const [selectedSubscriptionKeys, setSelectedSubscriptionKeys] = useState<string[]>([]);
  const [showTopPurchasersModal, setShowTopPurchasersModal] = useState(false);

  // Security Logs State
  const [blockedLogs, setBlockedLogs] = useState<BlockedLog[]>([]);
  const [blockedLogsTotal, setBlockedLogsTotal] = useState(0);
  const [blockedLogsPage, setBlockedLogsPage] = useState(1);
  const [selectedBlockedLogs, setSelectedBlockedLogs] = useState<string[]>([]);

  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [newIntentData, setNewIntentData] = useState({ productId: '', email: '', country: '' });
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at'>>({ title: '', price: 0, features: [''], description: '', buy_link: '', alternative_links: [], image: '', video_link: '', video_url: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null, masked_name: '', masked_domain: '', purchase_method: 'gateway' });
  const [newWinningPhotos, setNewWinningPhotos] = useState<{ files: File[]; productName: string; description: string }>({ files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: '' });
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoUploadFile, setVideoUploadFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [showInvoiceKeyInput, setShowInvoiceKeyInput] = useState(false);
  const [revealedSubscriptionKeys, setRevealedSubscriptionKeys] = useState<Set<string>>(new Set());
  const [revealedIntentKeys, setRevealedIntentKeys] = useState<Set<string>>(new Set());

  // Traffic State
  const [trafficPeriod, setTrafficPeriod] = useState<'today' | 'last2days' | 'last3days' | 'lastMonth' | 'custom' | 'all_time'>('all_time');
  const [trafficStartDate, setTrafficStartDate] = useState<Date | undefined>(undefined);
  const [trafficEndDate, setTrafficEndDate] = useState<Date | undefined>(undefined);
  const [trafficSearchTerm, setTrafficSearchTerm] = useState('');
  const [trafficCountryFilter, setTrafficCountryFilter] = useState('');
  const [trafficPage, setTrafficPage] = useState(1);
  const [trafficPageSize, setTrafficPageSize] = useState(50);
  const [trafficTotal, setTrafficTotal] = useState(0);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedVisitorLogs, setSelectedVisitorLogs] = useState<Set<string>>(new Set());

  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [bannedCountries, setBannedCountries] = useState<BannedCountry[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([]);
  const [bannedCustomers, setBannedCustomers] = useState<BannedCustomer[]>([]);
  const [newBanCountry, setNewBanCountry] = useState('');
  const [newBanIp, setNewBanIp] = useState('');
  const [newBanIdentifier, setNewBanIdentifier] = useState('');
  const [newBanType, setNewBanType] = useState<'email' | 'phone'>('email');
  const [loadingTraffic, setLoadingTraffic] = useState(false);
  
  // Discord Test State
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Refs
  const winningPhotoFileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const productVideoInputRef = useRef<HTMLInputElement>(null);
  const purchaseImageFileInputRef = useRef<HTMLInputElement>(null);
  const discordAvatarFileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Dnd Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Traffic Effects - Initial Load
  useEffect(() => {
    if (activeTab === 'traffic') {
      fetchTrafficData();
      fetchBannedCountries();
      fetchBannedIps();
      fetchBannedCustomers();
      fetchAvailableCountries();
    }
  }, [activeTab, trafficPeriod, trafficStartDate, trafficEndDate, trafficPage, trafficPageSize, trafficCountryFilter]);

  // Traffic Effects - Auto Refresh
  useEffect(() => {
    let interval: any;
    if (activeTab === 'traffic' && selectedVisitorLogs.size === 0) {
      // Auto refresh every 0.1 seconds (100ms) as requested
      // Only runs when no logs are selected to prevent UI issues during bulk actions
      interval = setInterval(() => {
        fetchTrafficData(true);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, selectedVisitorLogs.size, trafficPeriod, trafficStartDate, trafficEndDate, trafficPage, trafficPageSize, trafficCountryFilter]);

  // Security Logs Effects
  useEffect(() => {
    if (activeTab === 'security-logs') {
        fetchBlockedLogs();
    }
  }, [activeTab, blockedLogsPage]);

  // Note: trafficSearchTerm is excluded from dependency array to avoid too many requests while typing. 
  // We will trigger search on Enter or button click, or use debounce. For now, let's use Enter key or Search button.

  const fetchTrafficData = async (silent = false) => {
    if (!silent) setLoadingTraffic(true);
    try {
      const { data, total } = await trafficService.getVisits(
        trafficPeriod, 
        trafficStartDate, 
        trafficEndDate,
        trafficSearchTerm,
        trafficCountryFilter,
        trafficPage,
        trafficPageSize
      );
      setVisitorLogs(data);
      setTrafficTotal(total);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingTraffic(false);
    }
  };

  const fetchAvailableCountries = async () => {
      try {
          const countries = await trafficService.getUniqueCountries();
          setAvailableCountries(countries);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchBannedCountries = async () => {
    try {
      const data = await trafficService.getBannedCountries();
      setBannedCountries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBannedIps = async () => {
    try {
      const data = await trafficService.getBannedIps();
      setBannedIps(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBannedCustomers = async () => {
    try {
      const data = await trafficService.getBannedCustomers();
      setBannedCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [selectedProductsForVideo, setSelectedProductsForVideo] = useState<string[]>([]);
  const [videoToAssign, setVideoToAssign] = useState<VideoLibraryItem | null>(null);
  const [showAssignVideoModal, setShowAssignVideoModal] = useState(false);
  const [sendingBrevo, setSendingBrevo] = useState<string | null>(null);

  const handleSendBrevoEmail = async (intent: PurchaseIntent, customKey?: string) => {
    setSendingBrevo(intent.id);
    try {
      const product = products.find(p => p.id === intent.product_id);
      // Find associated key for this intent if no custom key provided
      const finalKey = customKey || productKeys.find(k => k.purchase_intent_id === intent.id)?.key_value || 'قيد الانتظار';
      
      const isSinki = intent.product_title.toLowerCase().includes('sinki');
      const brand = isSinki ? 'sinki' : 'cheatloop';
      const template = invoiceTemplates.find(t => t.brand_name === brand);
      
      const logoUrl = template?.logo_url || (isSinki 
        ? 'https://cheatloop.shop/sinki.jpg' 
        : 'https://cheatloop.shop/cheatloop.png');

      await brevoService.sendInvoiceEmail({
        customer_name: intent.email.split('@')[0],
        customer_email: intent.email,
        amount: typeof product?.price === 'number' ? product.price : 0,
        product_name: intent.product_title,
        order_id: intent.id.slice(0, 8),
        country: intent.country || 'Unknown',
        license_key: finalKey,
        discord_url: settings.discord_url,
        shop_url: settings.shop_url,
        logo_url: logoUrl,
        bg_color: template?.bg_color || '#f3f4f6',
        text_color: template?.text_color || '#111827',
        footer_notes: template?.footer_notes || 'Thank you for your business.'
      });
      setSuccess('تم إرسال الفاتورة عبر Brevo بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`فشل إرسال البريد عبر Brevo: ${err.message}`);
    } finally {
      setSendingBrevo(null);
    }
  };
  const [newVideo, setNewVideo] = useState<{ title: string; file: File | null; thumbnail: string }>({ title: '', file: null, thumbnail: '' });
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'videos') {
      fetchVideos();
    }
  }, [activeTab]);

  const fetchVideos = async () => {
    try {
      const data = await videoLibraryService.getAllVideos();
      setVideos(data);
    } catch (err) {
      console.error(err);
      setError('فشل تحميل مكتبة الفيديو');
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 734003200) { // 700MB
        setError('حجم الفيديو يتجاوز الحد المسموح (700 ميجابايت)');
        return;
      }
      setNewVideo({ ...newVideo, file });
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.file) {
      setError('يرجى إدخال عنوان واختيار ملف فيديو');
      return;
    }

    setSaving(true);
    try {
      const filePath = `public/${Date.now()}-${newVideo.file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase!.storage.from('product-videos').upload(filePath, newVideo.file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase!.storage.from('product-videos').getPublicUrl(filePath);
      
      await videoLibraryService.addVideo(newVideo.title, publicUrl, newVideo.thumbnail);
      
      setSuccess('تم رفع الفيديو بنجاح');
      setNewVideo({ title: '', file: null, thumbnail: '' });
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      fetchVideos();
    } catch (err: any) {
      console.error(err);
      setError(`فشل رفع الفيديو: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (video: VideoLibraryItem) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    
    setSaving(true);
    try {
      await videoLibraryService.deleteVideo(video.id, video.video_url);
      setSuccess('تم حذف الفيديو بنجاح');
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAssignVideoModal = async (video: VideoLibraryItem) => {
    setVideoToAssign(video);
    setLoading(true);
    try {
      // Find products that currently have this video assigned
      const { data } = await supabase!
        .from('products')
        .select('id')
        .or(`video_library_id.eq.${video.id},video_url.eq.${video.video_url}`);
      
      setSelectedProductsForVideo((data || []).map(p => p.id));
      setShowAssignVideoModal(true);
    } catch (err) {
      console.error(err);
      setError('فشل تحميل المنتجات المرتبطة');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVideo = async () => {
    if (!videoToAssign) return;
    
    setSaving(true);
    try {
      await videoLibraryService.assignVideoToProducts(videoToAssign, selectedProductsForVideo);
      setSuccess('تم تحديث ارتباطات الفيديو بنجاح');
      setShowAssignVideoModal(false);
      setVideoToAssign(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleProductForVideo = (productId: string) => {
    setSelectedProductsForVideo(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  const handleBanCountry = async () => {
    if (!newBanCountry) return;
    try {
      await trafficService.banCountry(newBanCountry);
      setNewBanCountry('');
      fetchBannedCountries();
      setSuccess(`Country ${newBanCountry} banned successfully`);
    } catch (err) {
      setError('Failed to ban country');
    }
  };

  const handleUnbanCountry = async (id: string) => {
    try {
      await trafficService.unbanCountry(id);
      fetchBannedCountries();
      setSuccess('Country unbanned successfully');
    } catch (err) {
      setError('Failed to unban country');
    }
  };

  const handleBanIp = async (ip: string) => {
    if (!ip) return;
    if (confirm(`Are you sure you want to ban IP: ${ip}?`)) {
        try {
            await trafficService.banIp(ip);
            setNewBanIp('');
            fetchBannedIps();
            setSuccess(`IP ${ip} banned successfully`);
        } catch (err) {
            setError('Failed to ban IP');
        }
    }
  };

  const handleUnbanIp = async (id: string) => {
    try {
      await trafficService.unbanIp(id);
      fetchBannedIps();
      setSuccess('IP unbanned successfully');
    } catch (err) {
      setError('Failed to unban IP');
    }
  };

  const handleBanCustomer = async () => {
    if (!newBanIdentifier) return;
    try {
      await trafficService.banCustomer(newBanIdentifier, newBanType);
      setNewBanIdentifier('');
      fetchBannedCustomers();
      setSuccess(`Customer banned successfully`);
    } catch (err) {
      setError('Failed to ban customer');
    }
  };

  const handleUnbanCustomer = async (id: string) => {
    try {
      await trafficService.unbanCustomer(id);
      fetchBannedCustomers();
      setSuccess('Customer unbanned successfully');
    } catch (err) {
      setError('Failed to unban customer');
    }
  };

  // Derived State
  const { pendingIntents, completedIntents } = useMemo(() => { const keyMap = new Map<string, ProductKey>(); productKeys.forEach(key => { if (key.purchase_intent_id) { keyMap.set(key.purchase_intent_id, key); } }); const pending: PurchaseIntent[] = []; const completed: (PurchaseIntent & { productKey: ProductKey })[] = []; purchaseIntents.forEach(intent => { const associatedKey = keyMap.get(intent.id); if (associatedKey) { completed.push({ ...intent, productKey: associatedKey }); } else { pending.push(intent); } }); return { pendingIntents: pending, completedIntents: completed }; }, [purchaseIntents, productKeys]);
  const filteredIntents = useMemo(() => { const searchTerm = purchaseIntentSearchTerm.toLowerCase(); if (!searchTerm) { return { pending: pendingIntents, completed: completedIntents }; } const filterPending = (intent: PurchaseIntent) => intent.email.toLowerCase().includes(searchTerm) || intent.product_title.toLowerCase().includes(searchTerm); const filterCompleted = (intent: PurchaseIntent & { productKey?: ProductKey }) => intent.email.toLowerCase().includes(searchTerm) || intent.product_title.toLowerCase().includes(searchTerm) || (intent.productKey?.key_value || '').toLowerCase().includes(searchTerm); return { pending: pendingIntents.filter(filterPending), completed: completedIntents.filter(filterCompleted) }; }, [pendingIntents, completedIntents, purchaseIntentSearchTerm]);
  const intentsToDisplay = purchaseIntentFilter === 'pending' ? filteredIntents.pending : filteredIntents.completed;
  
  // Enhanced Subscription Tracking List
  const subscriptionTrackingList = useMemo(() => { 
      const targetDate = subscriptionFilter.targetDate ? new Date(subscriptionFilter.targetDate) : null; 
      if (targetDate) { targetDate.setHours(0, 0, 0, 0); } 
      
      // Calculate purchase counts per email for loyalty check
      const emailCounts = new Map<string, number>();
      productKeys.forEach(k => {
          if (k.is_used && k.used_by_email) {
              emailCounts.set(k.used_by_email, (emailCounts.get(k.used_by_email) || 0) + 1);
          }
      });

      // Map intents for country info
      const intentMap = new Map(purchaseIntents.map(i => [i.id, i]));

      // Pre-calculate active keys per email
      const activeKeysPerEmail = new Map<string, number>();
      const now = new Date();
      productKeys.forEach(k => {
          if (!k.is_used || !k.used_by_email) return;
          let expiryDate: Date;
          if (k.expiration_date) {
              expiryDate = new Date(k.expiration_date);
          } else {
              expiryDate = new Date(k.used_at!);
              expiryDate.setDate(expiryDate.getDate() + 30);
          }
          if (expiryDate > now) {
              activeKeysPerEmail.set(k.used_by_email, (activeKeysPerEmail.get(k.used_by_email) || 0) + 1);
          }
      });

      return productKeys.filter(key => { 
          if (!key.is_used || !key.used_at) return false; 
          if (subscriptionFilter.productId !== 'all' && key.product_id !== subscriptionFilter.productId) { return false; } 
          if (subscriptionFilter.searchTerm) { 
              const searchLower = subscriptionFilter.searchTerm.toLowerCase(); 
              const emailMatch = key.used_by_email?.toLowerCase().includes(searchLower); 
              const keyMatch = key.key_value.toLowerCase().includes(searchLower); 
              if (!emailMatch && !keyMatch) return false; 
          } 
          
          const usedDate = new Date(key.used_at); 
          let expiryDate: Date;
          if (key.expiration_date) {
              expiryDate = new Date(key.expiration_date);
          } else {
              expiryDate = new Date(usedDate);
              expiryDate.setDate(expiryDate.getDate() + 30);
          }
          const expiryDateOnly = new Date(expiryDate); 
          expiryDateOnly.setHours(0, 0, 0, 0); 
          
          // Date Filter
          if (targetDate) { 
              if (expiryDateOnly.getTime() !== targetDate.getTime()) return false; 
          } 

          // Status Filter
          const now = new Date();
          const daysLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          if (subscriptionStatusFilter === 'active' && daysLeft <= 0) return false;
          if (subscriptionStatusFilter === 'expired' && daysLeft > 0) return false;
          if (subscriptionStatusFilter === 'expiring' && (daysLeft <= 0 || daysLeft > 3)) return false;
          
          if (subscriptionStatusFilter === 'multi_active') {
              // Must be active AND belong to an email with > 1 active keys
              if (daysLeft <= 0) return false;
              const count = activeKeysPerEmail.get(key.used_by_email || '') || 0;
              if (count <= 1) return false;
          }

          return true; 
      }).map(key => {
          const purchaseCount = emailCounts.get(key.used_by_email || '') || 1;
          const activeCount = activeKeysPerEmail.get(key.used_by_email || '') || 0;
          const intent = key.purchase_intent_id ? intentMap.get(key.purchase_intent_id) : null;
          return {
              ...key,
              purchaseCount,
              activeCount,
              country: intent?.country || 'Unknown'
          };
      }).sort((a, b) => { 
          const dateA = new Date(a.used_at!).getTime(); 
          const dateB = new Date(b.used_at!).getTime(); 
          return dateB - dateA; // Newest first
      }); 
  }, [productKeys, subscriptionFilter, purchaseIntents, subscriptionStatusFilter]);

  // Subscription Stats
  const subscriptionStats = useMemo(() => {
      const now = new Date();
      let active = 0;
      let expiring = 0;
      let expired = 0;
      let revenue = 0;

      productKeys.forEach(key => {
          if (!key.is_used || !key.used_at) return;
          const usedDate = new Date(key.used_at);
          const expiryDate = new Date(usedDate);
          expiryDate.setDate(expiryDate.getDate() + 30);
          const daysLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          if (daysLeft > 0) {
              active++;
              // Calculate rough revenue for active subs
              const product = products.find(p => p.id === key.product_id);
              if (product) revenue += product.price;
              
              if (daysLeft <= 3) expiring++;
          } else {
              expired++;
          }
      });

      return { active, expiring, expired, revenue };
  }, [productKeys, products]);

  // User History Data
  const userHistoryData = useMemo(() => {
      if (!selectedUserHistory) return null;
      
      const userKeys = productKeys.filter(k => k.used_by_email === selectedUserHistory);
      const userIntents = purchaseIntents.filter(i => i.email === selectedUserHistory);
      
      const totalSpent = userKeys.reduce((acc, key) => {
          const product = products.find(p => p.id === key.product_id);
          return acc + (product?.price || 0);
      }, 0);

      const firstPurchase = userKeys.length > 0 
          ? userKeys.reduce((earliest, key) => {
              const date = new Date(key.used_at || new Date());
              return date < earliest ? date : earliest;
          }, new Date())
          : null;

      const latestIntent = userIntents.length > 0 ? userIntents[0] : null;

      return {
          email: selectedUserHistory,
          totalKeys: userKeys.length,
          totalSpent,
          joinDate: firstPurchase,
          country: latestIntent?.country || 'Unknown',
          keys: userKeys.sort((a, b) => new Date(b.used_at || '').getTime() - new Date(a.used_at || '').getTime())
      };
  }, [selectedUserHistory, productKeys, purchaseIntents, products]);

  // Available Keys for Invoice Modal
  const availableKeysForProduct = useMemo(() => {
    if (!invoiceModalIntent) return [];
    return productKeys.filter(k => k.product_id === invoiceModalIntent.product_id && !k.is_used);
  }, [invoiceModalIntent, productKeys]);

  // Effects
  useEffect(() => { checkConnection(); if (typeof Notification !== 'undefined') { setNotificationPermission(Notification.permission); } }, []);
  useEffect(() => { if (!settingsLoading) { setSettings(siteSettings); } }, [siteSettings, settingsLoading]);
  useEffect(() => { if (!invoiceModalIntent) { setRevealedKeys(new Set()); setShowInvoiceKeyInput(false); } }, [invoiceModalIntent]);

  // Handlers
  const toggleKeyReveal = (id: string) => { setRevealedKeys(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSubscriptionKeyReveal = (id: string) => { setRevealedSubscriptionKeys(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };

  const handleToggleSubscriptionSelection = (keyId: string) => {
    if (selectedSubscriptionKeys.includes(keyId)) {
        setSelectedSubscriptionKeys(selectedSubscriptionKeys.filter(id => id !== keyId));
    } else {
        setSelectedSubscriptionKeys([...selectedSubscriptionKeys, keyId]);
    }
  };

  const handleSelectAllSubscriptions = (selectAll: boolean) => {
    if (selectAll) {
        setSelectedSubscriptionKeys(subscriptionTrackingList.map(k => k.id));
    } else {
        setSelectedSubscriptionKeys([]);
    }
  };

  const toggleIntentKeyReveal = (id: string) => { setRevealedIntentKeys(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };

  const handleIncomingIntents = useCallback((newIntents: PurchaseIntent[]) => { setPurchaseIntents(prev => { const existingIds = new Set(prev.map(i => i.id)); const trulyNew = newIntents.filter(i => !existingIds.has(i.id)); if (trulyNew.length === 0) return prev; const updatedList = [...trulyNew, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); const now = Date.now(); trulyNew.forEach(intent => { const created = new Date(intent.created_at).getTime(); if (now - created < 60000) { const notificationTitle = `لديك طلب شراء ${intent.product_title}`; setSuccess(notificationTitle); playNotificationSound(); if (typeof Notification !== 'undefined' && Notification.permission === 'granted') { if ('serviceWorker' in navigator) { navigator.serviceWorker.ready.then(registration => { registration.showNotification(notificationTitle, { body: `${intent.email} - ${intent.country}`, icon: '/cheatloop copy.png', tag: `intent-${intent.id}`, vibrate: [200, 100, 200], renotify: true, requireInteraction: true, data: { url: '/admin' } }); }); } else { try { new Notification(notificationTitle, { body: `${intent.email} - ${intent.country}`, icon: '/cheatloop copy.png', tag: `intent-${intent.id}`, requireInteraction: true }); } catch(e) { console.error(e); } } } setTimeout(() => setSuccess(null), 8000); } }); return updatedList; }); }, []);
  
  useEffect(() => { if (!supabase) return; const intentsChannel = supabase.channel('public:purchase_intents').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_intents', }, (payload) => { if (payload.eventType === 'INSERT') { handleIncomingIntents([payload.new as PurchaseIntent]); } else if (payload.eventType === 'UPDATE') { const updatedIntent = payload.new as PurchaseIntent; setPurchaseIntents((prev) => prev.map((intent) => (intent.id === updatedIntent.id ? updatedIntent : intent))); } else if (payload.eventType === 'DELETE') { const deletedId = payload.old.id; setPurchaseIntents((prev) => prev.filter((intent) => intent.id !== deletedId)); } }).subscribe(); const keysChannel = supabase.channel('public:product_keys').on('postgres_changes', { event: '*', schema: 'public', table: 'product_keys', }, async () => { const latestKeys = await productKeysService.getKeys(); setProductKeys(latestKeys); }).subscribe(); const poller = setInterval(async () => { if (!supabase) return; try { const { data, error } = await supabase.from('purchase_intents').select('*').order('created_at', { ascending: false }).limit(20); if (data && !error) { handleIncomingIntents(data); } } catch (e) { console.error("Polling error", e); } }, 100); return () => { supabase.removeChannel(intentsChannel); supabase.removeChannel(keysChannel); clearInterval(poller); }; }, [handleIncomingIntents]);

  const checkConnection = async () => { try { setConnectionStatus('checking'); const isConnected = await testSupabaseConnection(); setConnectionStatus(isConnected ? 'connected' : 'disconnected'); if (isConnected) { await loadData(); } else { setError('Failed to connect to the database. Please check your Supabase settings.'); } } catch (err) { console.error('Connection check failed:', err); setConnectionStatus('disconnected'); setError('Failed to connect to the database.'); } };
  const loadData = async () => { try { setLoading(true); setError(null); await refreshSettings(); const [productsData, categoriesData, winningPhotosData, purchaseImagesData, purchaseIntentsData, invoiceTemplatesData, productKeysData] = await Promise.all([ productService.getAllProducts(), categoryService.getAllCategories(), winningPhotosService.getPhotos(), purchaseImagesService.getAll(), purchaseIntentsService.getAll(), invoiceTemplateService.getAll(), productKeysService.getKeys(), ]); setProducts(productsData); setCategories(categoriesData); setWinningPhotos(winningPhotosData); setPurchaseImages(purchaseImagesData); setPurchaseIntents(purchaseIntentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); setInvoiceTemplates(invoiceTemplatesData); setProductKeys(productKeysData); setSuccess('Data loaded successfully'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error loading data:', err); setError(err.message || 'Failed to load data from the database.'); } finally { setLoading(false); } };

  const handleAddWinningPhotos = async () => { if (newWinningPhotos.files.length === 0) { setError('Please select at least one image file.'); return; } if (!supabase) { setError('Supabase client is not available.'); return; } setSaving(true); setError(null); try { const uploadPromises = newWinningPhotos.files.map(file => { const filePath = `public/${Date.now()}-${file.name.replace(/\s/g, '_')}`; return supabase.storage.from('winning-photos').upload(filePath, file); }); const uploadResults = await Promise.all(uploadPromises); const uploadErrors = uploadResults.filter(result => result.error); if (uploadErrors.length > 0) { throw new Error(`Failed to upload some photos: ${uploadErrors.map(e => e.error?.message).join(', ')}`); } const photosToInsert = uploadResults.map(result => { const { data: { publicUrl } } = supabase.storage.from('winning-photos').getPublicUrl(result.data!.path); return { image_url: publicUrl, product_name: newWinningPhotos.productName, description: newWinningPhotos.description, }; }); await winningPhotosService.addPhotos(photosToInsert); await loadData(); setNewWinningPhotos({ files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: '' }); if (winningPhotoFileInputRef.current) { winningPhotoFileInputRef.current.value = ''; } setSuccess(`Successfully added ${photosToInsert.length} photos!`); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to add winning photos.'); } finally { setSaving(false); } };
  const handleDeleteWinningPhoto = async (photo: WinningPhoto) => { if (!confirm('Are you sure you want to delete this photo?')) return; setSaving(true); setError(null); try { await winningPhotosService.deletePhotos([photo]); await loadData(); setSuccess('Winning photo deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete winning photo.'); } finally { setSaving(false); } };
  const handleDeleteSelected = async () => { if (!confirm(`Are you sure you want to delete ${selectedPhotos.length} selected photos? This action cannot be undone.`)) return; setSaving(true); setError(null); try { const photosToDelete = winningPhotos.filter(p => selectedPhotos.includes(p.id)); await winningPhotosService.deletePhotos(photosToDelete); await loadData(); setSuccess(`${selectedPhotos.length} photos deleted successfully.`); setSelectedPhotos([]); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete selected photos.'); } finally { setSaving(false); } };
  const handleMoveSelected = async () => { if (!moveTargetProduct) { setError('Please select a destination product.'); return; } setSaving(true); setError(null); try { await winningPhotosService.movePhotos(selectedPhotos, moveTargetProduct); await loadData(); setSuccess(`${selectedPhotos.length} photos moved successfully.`); setSelectedPhotos([]); setShowMoveModal(false); setMoveTargetProduct(''); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to move photos.'); } finally { setSaving(false); } };
  const handleTogglePhotoSelection = (photoId: string) => { setSelectedPhotos(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]); };
  const handleSelectAllForProduct = (productName: string, shouldSelect: boolean) => { const photoIdsForProduct = winningPhotos.filter(p => p.product_name === productName).map(p => p.id); if (shouldSelect) { setSelectedPhotos(prev => [...new Set([...prev, ...photoIdsForProduct])]); } else { setSelectedPhotos(prev => prev.filter(id => !photoIdsForProduct.includes(id))); } };
  const handleSaveSettings = async () => { try { setSaving(true); setError(null); const settingsToUpdate: SiteSetting[] = Object.entries(settings).map(([key, value]) => ({ key, value })); await settingsService.updateSettings(settingsToUpdate); setSuccess('Settings saved successfully!'); refreshSettings(); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to save settings.'); } finally { setSaving(false); } };
  const handleToggleProductVisibility = async (productId: string, currentHiddenStatus: boolean) => { try { setSaving(true); setError(null); await productService.updateProduct(productId, { is_hidden: !currentHiddenStatus }); await loadData(); setSuccess(`Product successfully ${!currentHiddenStatus ? 'hidden' : 'shown'}`); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error toggling product visibility:', err); setError(err.message || 'Failed to change product visibility.'); } finally { setSaving(false); } };
  const handleSelectImage = (imagePath: string) => { setNewProduct({ ...newProduct, image: imagePath }); setImageUploadFile(null); setImagePreviewUrl(null); if (productImageInputRef.current) { productImageInputRef.current.value = ''; } setShowImageSelector(false); setSuccess('Image selected successfully.'); setTimeout(() => setSuccess(null), 3000); };
  const handleRemoveImage = () => { setNewProduct({ ...newProduct, image: '' }); setImageUploadFile(null); setImagePreviewUrl(null); if (productImageInputRef.current) { productImageInputRef.current.value = ''; } };
  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setImageUploadFile(file); const reader = new FileReader(); reader.onloadend = () => { setImagePreviewUrl(reader.result as string); }; reader.readAsDataURL(file); setNewProduct({ ...newProduct, image: '' }); } };

  const handleDiscordAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!supabase) {
          setError('Supabase client not configured');
          return;
      }

      try {
          setSaving(true);
          const filePath = `discord-avatars/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
          // Use 'product-images' bucket since it's already configured and public
          const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
          
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          
          setSettings(prev => ({ ...prev, discord_bot_avatar_url: publicUrl }));
          setSuccess('Image uploaded successfully. Don\'t forget to save settings.');
          setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
          console.error('Upload error:', err);
          setError(err.message || 'Failed to upload image');
      } finally {
          setSaving(false);
          if (discordAvatarFileInputRef.current) {
              discordAvatarFileInputRef.current.value = '';
          }
      }
  };
  const handleTestWebhook = async () => {
    const webhookUrl = settings.discord_webhook_url || siteSettings.discord_webhook_url;
    if (!webhookUrl) {
      setError('Please enter a Discord Webhook URL first');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Use explicit settings or fallbacks
      let avatarUrl = settings.discord_bot_avatar_url || siteSettings.discord_bot_avatar_url;
      
      if (!avatarUrl && (settings.site_logo_url || siteSettings.site_logo_url)) {
          let logoUrl = settings.site_logo_url || siteSettings.site_logo_url;
          if (logoUrl) {
              if (!logoUrl.startsWith('http')) {
                  logoUrl = window.location.origin + (logoUrl.startsWith('/') ? '' : '/') + logoUrl;
              }
              avatarUrl = encodeURI(logoUrl);
          }
      }

      // Add cache buster
      if (avatarUrl && avatarUrl.includes('supabase.co')) {
           const separator = avatarUrl.includes('?') ? '&' : '?';
           avatarUrl = `${avatarUrl}${separator}t=${Date.now()}`;
      }

      // Add mention ID
      const mentionId = settings.discord_admin_id || siteSettings.discord_admin_id;

      await discordService.sendPurchaseNotification(
        webhookUrl,
        {
          productName: 'Test Product (تجربة)',
          price: '$99.99',
          paymentMethod: 'Test Payment',
          customerEmail: 'test@example.com',
          customerPhone: '+1234567890',
          orderId: `TEST-${Date.now()}`
        },
        avatarUrl,
        mentionId
      );

      setSuccess('Test notification sent successfully! Check your Discord channel.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Test webhook failed:', err);
      setError('Failed to send test notification: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => { if (!newCategoryName.trim()) { setError('Please enter a category name.'); return; } try { setSaving(true); setError(null); await categoryService.addCategory(newCategoryName); await loadData(); setNewCategoryName(''); setIsAddingCategory(false); setSuccess('Category added successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error adding category:', err); setError(err.message || 'Failed to add category.'); } finally { setSaving(false); } };
  const handleDeleteCategory = async (id: string) => { if (!confirm('Are you sure you want to delete this category? All associated products will also be deleted.')) return; try { setSaving(true); setError(null); await categoryService.deleteCategory(id); await loadData(); setSuccess('Category deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error deleting category:', err); setError(err.message || 'Failed to delete category.'); } finally { setSaving(false); } };
  const handleCategoryChange = (categoryId: string) => { const selectedCategory = categories.find(c => c.id === categoryId); setNewProduct({ ...newProduct, category_id: categoryId, category: selectedCategory?.slug as 'pubg' | 'codm' || 'pubg' }); };
  
  const handleProductVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // 700MB limit
          if (file.size > 700 * 1024 * 1024) {
              setError('حجم الفيديو يتجاوز الحد المسموح (700 ميجابايت).');
              return;
          }
          setVideoUploadFile(file);
          setVideoPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleProductSubmit = async (isUpdate: boolean) => {
    const { title, price, category_id, purchase_method, buy_link, purchase_image_id } = newProduct;
    
    if (!title || !price || !category_id) {
        setError('Please fill all required fields: Name, Price, and Category.');
        return;
    }

    if (purchase_method === 'external' && !buy_link) {
        setError('Please fill all required fields: Name, Price, Category, and a Buy Link.');
        return;
    }

    if (purchase_method === 'qr' && !purchase_image_id) {
        setError('Please fill all required fields: Name, Price, Category, and a Purchase Image.');
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

        let videoUrl = newProduct.video_url;
        if (videoUploadFile) {
             if (!supabase) throw new Error("Supabase client not available");
             const filePath = `public/${Date.now()}-${videoUploadFile.name.replace(/\s/g, '_')}`;
             // Note: Make sure 'product-videos' bucket exists and RLS allows upload
             const { error: uploadError } = await supabase.storage.from('product-videos').upload(filePath, videoUploadFile);
             if (uploadError) throw new Error(`Failed to upload video: ${uploadError.message}`);
             const { data: { publicUrl } } = supabase.storage.from('product-videos').getPublicUrl(filePath);
             videoUrl = publicUrl;
        }

        const productPayload: Partial<Product> = {
            ...newProduct,
            image: imageUrl,
            video_url: videoUrl,
            features: newProduct.features.filter(f => f.trim() !== ''),
            buy_link: purchase_method === 'external' ? buy_link : '',
            purchase_image_id: purchase_method === 'qr' ? purchase_image_id : null,
            alternative_links: purchase_method === 'external' ? (newProduct.alternative_links || []) : []
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
  const handleAddProduct = () => handleProductSubmit(false);
  const handleUpdateProduct = () => handleProductSubmit(true);
  const handleDeleteProduct = async (id: string) => { if (!confirm('Are you sure you want to delete this product?')) return; try { setSaving(true); setError(null); await productService.deleteProduct(id); await loadData(); setSuccess('Product deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { console.error('Error deleting product:', err); setError(err.message || 'Failed to delete product.'); } finally { setSaving(false); } };
  const handleEditProduct = (product: Product) => { setEditingProduct(product.id); resetProductForm(); setNewProduct({ title: product.title, price: product.price, features: product.features, description: product.description, buy_link: product.buy_link, alternative_links: product.alternative_links || [], image: product.image || '', video_link: product.video_link || '', video_url: product.video_url || '', is_popular: product.is_popular || false, category: product.category, category_id: product.category_id || '', is_hidden: product.is_hidden || false, purchase_image_id: product.purchase_image_id || null, masked_name: product.masked_name || '', masked_domain: product.masked_domain || '',
      payment_gateway_tax: product.payment_gateway_tax || 0,
      purchase_method: product.purchase_method || (product.purchase_image_id ? 'qr' : product.buy_link ? 'external' : 'gateway')
    });
  };
  const resetProductForm = () => { setNewProduct({ title: '', price: 0, features: [''], description: '', buy_link: '', alternative_links: [], image: '', video_link: '', video_url: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null, masked_name: '', masked_domain: '',
      payment_gateway_tax: 0,
      purchase_method: 'gateway'
    });
    setImageUploadFile(null); setImagePreviewUrl(null); setVideoUploadFile(null); setVideoPreviewUrl(null); if (productImageInputRef.current) productImageInputRef.current.value = ''; if (productVideoInputRef.current) productVideoInputRef.current.value = ''; };
  const addFeature = () => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] });
  const updateFeature = (index: number, value: string) => { const updatedFeatures = [...newProduct.features]; updatedFeatures[index] = value; setNewProduct({ ...newProduct, features: updatedFeatures }); };
  const removeFeature = (index: number) => { const updatedFeatures = newProduct.features.filter((_, i) => i !== index); setNewProduct({ ...newProduct, features: updatedFeatures }); };
  
  // Alternative Links Handlers
  const addAlternativeLink = () => {
    setNewProduct({
      ...newProduct,
      alternative_links: [...(newProduct.alternative_links || []), { id: Date.now().toString(), label: '', url: '' }]
    });
  };
  const updateAlternativeLink = (index: number, field: 'label' | 'url', value: string) => {
    const updatedLinks = [...(newProduct.alternative_links || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setNewProduct({ ...newProduct, alternative_links: updatedLinks });
  };
  const removeAlternativeLink = (index: number) => {
    const updatedLinks = [...(newProduct.alternative_links || [])];
    updatedLinks.splice(index, 1);
    setNewProduct({ ...newProduct, alternative_links: updatedLinks });
  };

  const handlePurchaseImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setNewPurchaseImage({ ...newPurchaseImage, file: e.target.files[0] }); } };
  const handleAddPurchaseImage = async () => { if (!newPurchaseImage.file || !newPurchaseImage.name) { setError('Please provide a name and select an image file.'); return; } if (!supabase) { setError('Supabase client is not available.'); return; } setSaving(true); setError(null); try { const filePath = `public/${Date.now()}-${newPurchaseImage.file.name.replace(/\s/g, '_')}`; const { error: uploadError } = await supabase.storage.from('purchase-images').upload(filePath, newPurchaseImage.file); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('purchase-images').getPublicUrl(filePath); await purchaseImagesService.addImage(newPurchaseImage.name, publicUrl); await loadData(); setNewPurchaseImage({ file: null, name: '' }); if (purchaseImageFileInputRef.current) { purchaseImageFileInputRef.current.value = ''; } setSuccess('Purchase image added successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to add purchase image.'); } finally { setSaving(false); } };
  const handleDeletePurchaseImage = async (image: PurchaseImage) => { if (!confirm(`Are you sure you want to delete the image "${image.name}"?`)) return; setSaving(true); setError(null); try { await purchaseImagesService.deleteImage(image); await loadData(); setSuccess('Purchase image deleted successfully.'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete purchase image.'); } finally { setSaving(false); } };
  const handleTogglePurchaseIntentSelection = (intentId: string) => { setSelectedPurchaseIntents(prev => prev.includes(intentId) ? prev.filter(id => id !== intentId) : [...prev, intentId]); };
  const handleSelectAllPurchaseIntents = (shouldSelect: boolean) => { const intentsToSelect = (purchaseIntentFilter === 'pending' ? filteredIntents.pending : filteredIntents.completed).map(i => i.id); if (shouldSelect) { setSelectedPurchaseIntents(prev => [...new Set([...prev, ...intentsToSelect])]); } else { setSelectedPurchaseIntents(prev => prev.filter(id => !intentsToSelect.includes(id))); } };
  const handleDeleteSelectedPurchaseIntents = async () => { if (selectedPurchaseIntents.length === 0) return; if (!confirm(`هل أنت متأكد من حذف ${selectedPurchaseIntents.length} طلبات محددة؟ لا يمكن التراجع عن هذا الإجراء.`)) return; setSaving(true); setError(null); try { await purchaseIntentsService.deleteIntents(selectedPurchaseIntents); await loadData(); setSuccess(`${selectedPurchaseIntents.length} طلبات تم حذفها بنجاح.`); setSelectedPurchaseIntents([]); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'فشل حذف الطلبات المحددة.'); } finally { setSaving(false); } };
  const handleDeletePurchaseIntent = async (id: string) => { if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return; setSaving(true); setError(null); try { await purchaseIntentsService.deleteIntents([id]); await loadData(); setSuccess('تم حذف الطلب بنجاح'); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message || 'Failed to delete intent'); } finally { setSaving(false); } };
  const handleCreateManualIntent = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!newIntentData.productId || !newIntentData.email || !newIntentData.country) { 
          setError("الرجاء ملء جميع الحقول المطلوبة."); 
          return; 
      } 
      const selectedProduct = products.find(p => p.id === newIntentData.productId); 
      if (!selectedProduct) { 
          setError("المنتج المحدد غير صالح."); 
          return; 
      } 
      setSaving(true); 
      setError(null); 
      try { 
          await purchaseIntentsService.addIntent({ 
              product_id: selectedProduct.id, 
              product_title: selectedProduct.title, 
              country: newIntentData.country, 
              email: newIntentData.email, 
              phone_number: '', 
          }); 
          setSuccess('تم إنشاء طلب الشراء بنجاح!'); 
          setIsCreatingIntent(false); 
          setNewIntentData({ productId: '', email: '', country: '' }); 
          await loadData(); 
          setTimeout(() => setSuccess(null), 3000); 
      } catch (err: any) { 
          setError(err.message || 'فشل إنشاء طلب الشراء.'); 
      } finally { 
          setSaving(false); 
      } 
  };
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  const getFilteredImages = () => selectedImageCategory === 'all' ? AVAILABLE_IMAGES : AVAILABLE_IMAGES.filter(img => img.category === selectedImageCategory);
  const groupedWinningPhotos = WINNING_PHOTO_PRODUCTS.reduce((acc, productName) => { acc[productName] = winningPhotos.filter(p => p.product_name === productName); return acc; }, {} as Record<string, WinningPhoto[]>);
  const getProductForIntent = (intent: PurchaseIntent | null) => { if (!intent) return undefined; return products.find(p => p.id === intent.product_id); };
  const generateInvoiceHTML = (intent: PurchaseIntent, key: string) => { 
    if (!intent) return ''; 
    const productForIntent = getProductForIntent(intent); 
    const isSinki = intent.product_title.toLowerCase().includes('sinki');
    const brand = isSinki ? 'sinki' : 'cheatloop'; 
    const template = invoiceTemplates.find(t => t.brand_name === brand); 
    
    // Use current origin for preview to ensure images load
    const currentOrigin = window.location.origin;
    const defaultLogo = isSinki ? `${currentOrigin}/sinki.jpg` : `${currentOrigin}/cheatloop.png`;

    // Ensure template has the correct logo if missing
    const enrichedTemplate = template ? {
      ...template,
      logo_url: template.logo_url || defaultLogo
    } : {
      brand_name: brand,
      logo_url: defaultLogo,
      company_name: isSinki ? 'Sinki' : 'Cheatloop',
      footer_notes: 'Thank you for your business.',
      bg_color: '#f3f4f6',
      text_color: '#111827'
    } as any;

    const html = ReactDOMServer.renderToStaticMarkup( 
      <InvoiceTemplate 
        intent={intent} 
        productKey={key} 
        siteSettings={siteSettings} 
        productPrice={productForIntent ? productForIntent.price : 'N/A'} 
        templateData={enrichedTemplate} 
      /> 
    ); 
    return `<!DOCTYPE html>${html}`; 
  };
  const handleInternalPrint = () => { if (iframeRef.current?.contentWindow) { iframeRef.current.contentWindow.print(); } else { setError("Could not access the invoice content for printing."); } setShowPrintOptions(false); };
  const handleExternalPrint = () => { if (!invoiceModalIntent || !productKeyForInvoice) { setError("Please enter or draw a product key first."); return; } const invoiceHTML = generateInvoiceHTML(invoiceModalIntent, productKeyForInvoice); const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.write(invoiceHTML); printWindow.document.close(); printWindow.focus(); } else { setError("Could not open new window. Please check your browser's popup blocker settings."); } setShowPrintOptions(false); };
  const handleUseManualKey = async () => { if (!invoiceModalIntent || !productKeyForInvoice) { setError("Please enter a product key first."); return; } setIsUsingManualKey(true); setError(null); setManualKeyError(null); try { await productKeysService.useManualKey( invoiceModalIntent.product_id, productKeyForInvoice, invoiceModalIntent.email, invoiceModalIntent.id ); setSuccess('Key has been successfully processed!'); await loadData(); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { if (err.message.includes('This key has already been used')) { setManualKeyError('هذا المفتاح مستخدم بالفعل.'); } else { setError(err.message); } } finally { setIsUsingManualKey(false); } };
  
  const handleCopyText = async (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setSuccess('تم النسخ!');
        setTimeout(() => setSuccess(null), 2000);
        return;
      }
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback...', err);
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (!successful) throw new Error('Fallback copy failed');
      setSuccess('تم النسخ!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setError('فشل النسخ. يرجى النسخ يدوياً.');
    }
  };

  const generateInvoiceText = (intent: PurchaseIntent, key: string) => { const productForIntent = getProductForIntent(intent); const price = productForIntent ? `$${productForIntent.price}` : 'N/A'; const date = new Date().toLocaleDateString('en-GB'); const siteName = siteSettings.site_name || 'Cheatloop'; const separatorLine = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; return `\n${siteName.toUpperCase()}\nGaming Tools Store\n${separatorLine}\nINVOICE DETAILS\nProduct: ${intent.product_title}\nPrice: ${price}\nDate: ${date}\n${separatorLine}\nCUSTOMER\n${intent.email}\n${intent.phone_number || ""}\n${intent.country}\n${separatorLine}\nLICENSE KEY\n${key}\n${separatorLine}\nThank you for your purchase!\nIf you have any questions, contact us on Discord:\nhttps://discord.gg/pcgamers\n`; };
  
  const generateWhatsappInvoiceText = (intent: PurchaseIntent, key: string) => { 
      const productForIntent = getProductForIntent(intent); 
      const price = productForIntent ? `$${productForIntent.price}` : 'N/A'; 
      const date = new Date().toLocaleDateString('en-GB'); 
      
      return `*INVOICE DETAILS*

*Product:* ${intent.product_title}
*Price:* ${price}
*Date:* ${date}

*Customer Info:*
${intent.email}
${intent.phone_number ? `${intent.phone_number}\n` : ''}${intent.country}

*License Key:*
\`\`\`${key}\`\`\`

*Thank you for your purchase!*`; 
  };

  const handleSendGmail = () => { if (!invoiceModalIntent || !productKeyForInvoice) { setError("يرجى التأكد من وجود بيانات الفاتورة ومفتاح المنتج."); return; } const body = generateInvoiceText(invoiceModalIntent, productKeyForInvoice); const subject = `Invoice for ${invoiceModalIntent.product_title} - Order #${invoiceModalIntent.id.substring(0, 8)}`; const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${invoiceModalIntent.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; window.open(gmailUrl, '_blank'); };
  const handleSendWhatsapp = () => { if (!invoiceModalIntent || !productKeyForInvoice) { setError("يرجى التأكد من وجود بيانات الفاتورة ومفتاح المنتج."); return; } const text = generateWhatsappInvoiceText(invoiceModalIntent, productKeyForInvoice); const url = `https://wa.me/${invoiceModalIntent.phone_number?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`; window.open(url, '_blank'); };
  const handleCopyInvoiceText = async () => { if (!invoiceModalIntent || !productKeyForInvoice) return; const text = generateInvoiceText(invoiceModalIntent, productKeyForInvoice); await handleCopyText(text); };
  const handleCopyWhatsappInvoice = async () => { if (!invoiceModalIntent || !productKeyForInvoice) return; const text = generateWhatsappInvoiceText(invoiceModalIntent, productKeyForInvoice); await handleCopyText(text); };
  const handleDownloadInvoiceImage = async () => { if (!iframeRef.current?.contentDocument?.body) { setError("تعذر الوصول إلى محتوى الفاتورة."); return; } setSaving(true); try { const element = iframeRef.current.contentDocument.body; const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: null }); const image = canvas.toDataURL("image/png"); const link = document.createElement('a'); link.href = image; link.download = `Invoice-${invoiceModalIntent?.id.substring(0, 8)}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); setSuccess("تم تحميل صورة الفاتورة بنجاح!"); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError("فشل إنشاء الصورة. يرجى المحاولة مرة أخرى."); } finally { setSaving(false); } };
  const handleCategoryDragEnd = async (event: DragEndEvent) => { const { active, over } = event; if (over && active.id !== over.id) { const oldIndex = categories.findIndex((c) => c.id === active.id); const newIndex = categories.findIndex((c) => c.id === over.id); const newCategories = arrayMove(categories, oldIndex, newIndex); setCategories(newCategories); try { await categoryService.updatePositions(newCategories); } catch (err: any) { setError("فشل تحديث ترتيب الأقسام."); const originalCategories = await categoryService.getAllCategories(); setCategories(originalCategories); } } };
  const handleProductDragEnd = async (event: DragEndEvent) => { const { active, over } = event; if (over && active.id !== over.id) { const oldIndex = products.findIndex((p) => p.id === active.id); const newIndex = products.findIndex((p) => p.id === over.id); const newProducts = arrayMove(products, oldIndex, newIndex); setProducts(newProducts); try { await productService.updateProductPositions(newProducts); } catch (err: any) { setError("فشل تحديث ترتيب المنتجات."); const originalProducts = await productService.getAllProducts(); setProducts(originalProducts); } } };
  const requestNotificationPermission = async () => { if (typeof Notification === 'undefined') { alert('This browser does not support desktop notifications'); return; } try { const permission = await Notification.requestPermission(); setNotificationPermission(permission); if (permission === 'granted') { setSuccess('تم تفعيل الإشعارات بنجاح!'); playNotificationSound(); setTimeout(() => setSuccess(null), 3000); } } catch (e) { console.error("Permission request failed", e); } };

  // Helper to copy customer details
  const fetchBlockedLogs = async () => {
    setLoading(true);
    try {
        const { data, total } = await trafficService.getBlockedLogs(blockedLogsPage);
        setBlockedLogs(data);
        setBlockedLogsTotal(total);
    } catch (err) {
        console.error('Failed to fetch blocked logs', err);
    } finally {
        setLoading(false);
    }
  };

  const handleClearBlockedLogs = async () => {
    if (!window.confirm('هل أنت متأكد من مسح جميع السجلات المختارة؟')) return;
    try {
        await trafficService.deleteBlockedLogs(selectedBlockedLogs);
        setSelectedBlockedLogs([]);
        fetchBlockedLogs();
        setSuccess('تم مسح السجلات بنجاح');
    } catch (err) {
        setError('فشل مسح السجلات');
    }
  };

  const handleCopyCustomerDetails = () => {
    if (!invoiceModalIntent) return;
    const text = `Product: ${invoiceModalIntent.product_title}\nEmail: ${invoiceModalIntent.email}\nPhone: ${invoiceModalIntent.phone_number || 'N/A'}\nCountry: ${invoiceModalIntent.country}`;
    handleCopyText(text);
  };

  const handleExportSubscriptions = () => {
    const headers = ['Product', 'Email', 'Country', 'Key', 'Activation Date', 'Expiry Date', 'Status'];
    const rows = subscriptionTrackingList.map(item => {
        const usedDate = new Date(item.used_at!);
        const expiryDate = new Date(usedDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        const product = products.find(p => p.id === item.product_id);
        const status = new Date() > expiryDate ? 'Expired' : 'Active';
        
        return [
            product?.title || 'Unknown',
            item.used_by_email || 'Unknown',
            (item as any).country || 'Unknown',
            item.key_value,
            usedDate.toLocaleDateString(),
            expiryDate.toLocaleDateString(),
            status
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSelectedSubscriptions = async () => {
    if (selectedSubscriptionKeys.length === 0) return;
    
    if (!confirm(`هل أنت متأكد من حذف ${selectedSubscriptionKeys.length} مفتاح؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    
    setSaving(true);
    try {
        await productKeysService.deleteKeys(selectedSubscriptionKeys);
        await loadData();
        setSelectedSubscriptionKeys([]);
        setSuccess('تم حذف المفاتيح المحددة بنجاح');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message || 'Failed to delete keys');
    } finally {
        setSaving(false);
    }
  };

  // --- Render ---

  if (connectionStatus === 'checking' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connection Failed</h2>
          <button onClick={checkConnection} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#0a0a0a] border-l border-white/5 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">Admin Panel</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
            {MENU_GROUPS.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.title}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as AdminTab); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive 
                            ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 mr-auto text-cyan-500/50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">Online</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Top Header */}
        <header className="bg-black/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white hidden sm:block">
                {MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'لوحة التحكم'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="عرض الموقع">
                <Globe className="w-5 h-5" />
              </Link>
              <div className="h-6 w-px bg-white/10 mx-1"></div>
              <button onClick={loadData} disabled={loading} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="تحديث البيانات">
                <div className={`${loading ? 'animate-spin' : ''}`}><Clock className="w-5 h-5" /></div>
              </button>
              {notificationPermission !== 'granted' && (
                <button onClick={requestNotificationPermission} className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="تفعيل الإشعارات">
                  <BellRing className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10">
          <div className={`${activeTab === 'invoice-templates' ? 'max-w-full px-4' : 'max-w-7xl'} mx-auto space-y-6`}>
            
            {/* Alerts */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400 animate-fade-in-up shadow-lg shadow-green-900/20">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-fade-in-up shadow-lg shadow-red-900/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
                <button onClick={() => setError(null)} className="mr-auto hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Dashboard Stats */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Package className="w-24 h-24" /></div>
                  <div className="relative z-10">
                    <p className="text-cyan-400 text-sm font-bold mb-1">المنتجات النشطة</p>
                    <h3 className="text-4xl font-bold text-white">{products.length}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Tag className="w-24 h-24" /></div>
                  <div className="relative z-10">
                    <p className="text-purple-400 text-sm font-bold mb-1">الأقسام</p>
                    <h3 className="text-4xl font-bold text-white">{categories.length}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-yellow-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ImageIcon className="w-24 h-24" /></div>
                  <div className="relative z-10">
                    <p className="text-yellow-400 text-sm font-bold mb-1">صور الفوز</p>
                    <h3 className="text-4xl font-bold text-white">{winningPhotos.length}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-green-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CreditCard className="w-24 h-24" /></div>
                  <div className="relative z-10">
                    <p className="text-green-400 text-sm font-bold mb-1">طلبات الشراء</p>
                    <h3 className="text-4xl font-bold text-white">{purchaseIntents.length}</h3>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'traffic' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Traffic Controls */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col gap-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <Activity className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">سجل الزيارات</h2>
                          <p className="text-sm text-gray-400">مراقبة حركة المرور والزوار</p>
                        </div>
                      </div>
                      
                      {/* Search and Filters */}
                      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                          <div className="relative">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                  type="text" 
                                  placeholder="بحث (IP, الدولة, المدينة...)" 
                                  value={trafficSearchTerm}
                                  onChange={(e) => setTrafficSearchTerm(e.target.value)}
                                  className="w-full md:w-64 bg-black/30 border border-white/10 rounded-lg pr-10 pl-4 py-2 text-sm text-white focus:border-blue-500 transition-colors"
                              />
                          </div>
                          
                          <div className="relative">
                              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select 
                                  value={trafficCountryFilter}
                                  onChange={(e) => setTrafficCountryFilter(e.target.value)}
                                  onClick={fetchAvailableCountries}
                                  className="w-full md:w-48 bg-black/30 border border-white/10 rounded-lg pr-10 pl-4 py-2 text-sm text-white focus:border-blue-500 transition-colors appearance-none"
                              >
                                  <option value="">كل الدول</option>
                                  {availableCountries.map(country => (
                                      <option key={country} value={country}>{country}</option>
                                  ))}
                              </select>
                          </div>

                          <button onClick={() => { setTrafficPage(1); fetchTrafficData(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                              بحث
                          </button>
                          
                          {selectedVisitorLogs.size > 0 && (
                              <button 
                                  onClick={async () => {
                                      if (!confirm('هل أنت متأكد من حذف السجلات المحددة؟')) return;
                                      try {
                                          const count = await trafficService.deleteVisitorLogs(Array.from(selectedVisitorLogs));
                                          setSelectedVisitorLogs(new Set());
                                          fetchTrafficData();
                                          if (count > 0) {
                                              setSuccess(`تم حذف ${count} سجل بنجاح`);
                                              setTimeout(() => setSuccess(null), 3000);
                                          } else {
                                              setError('لم يتم حذف أي سجل. قد لا تملك الصلاحيات الكافية.');
                                              setTimeout(() => setError(null), 3000);
                                          }
                                      } catch (err) {
                                          console.error(err);
                                          setError('فشل حذف السجلات');
                                      }
                                  }}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                              >
                                  <Trash2 className="w-4 h-4" />
                                  حذف المحدد ({selectedVisitorLogs.size})
                              </button>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center justify-between border-t border-white/5 pt-4">
                       <div className="flex flex-wrap gap-2">
                           <button onClick={() => setTrafficPeriod('today')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${trafficPeriod === 'today' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>اليوم</button>
                           <button onClick={() => setTrafficPeriod('last2days')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${trafficPeriod === 'last2days' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>آخر يومين</button>
                           <button onClick={() => setTrafficPeriod('last3days')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${trafficPeriod === 'last3days' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>آخر 3 أيام</button>
                           <button onClick={() => setTrafficPeriod('lastMonth')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${trafficPeriod === 'lastMonth' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>آخر شهر</button>
                           <button onClick={() => setTrafficPeriod('all_time')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${trafficPeriod === 'all_time' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>الكل</button>
                           <button onClick={() => setTrafficPeriod('custom')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${trafficPeriod === 'custom' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>مخصص</button>
                       </div>
                       
                       <div className="text-gray-400 text-sm">
                           إجمالي الزيارات: <span className="text-white font-bold">{trafficTotal}</span>
                       </div>
                    </div>
                  </div>

                  {trafficPeriod === 'custom' && (
                    <div className="flex gap-4 mb-6 bg-black/20 p-4 rounded-xl">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">من تاريخ</label>
                            <input type="date" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" onChange={(e) => setTrafficStartDate(e.target.valueAsDate || undefined)} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">إلى تاريخ</label>
                            <input type="date" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" onChange={(e) => setTrafficEndDate(e.target.valueAsDate || undefined)} />
                        </div>
                        <div className="flex items-end">
                            <button onClick={fetchTrafficData} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg h-[42px]">تطبيق</button>
                        </div>
                    </div>
                  )}

                  {loadingTraffic ? (
                    <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
                  ) : (
                    <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-sm">
                            <th className="pb-3 pr-4 w-10">
                                <ModernCheckbox 
                                    checked={visitorLogs.length > 0 && visitorLogs.every(l => selectedVisitorLogs.has(l.id))}
                                    onChange={() => {
                                        if (visitorLogs.length > 0 && visitorLogs.every(l => selectedVisitorLogs.has(l.id))) {
                                            setSelectedVisitorLogs(new Set());
                                        } else {
                                            setSelectedVisitorLogs(new Set(visitorLogs.map(l => l.id)));
                                        }
                                    }}
                                    id="select-all-visitors"
                                />
                            </th>
                            <th className="pb-3 pr-4">IP Address</th>
                            <th className="pb-3">الدولة</th>
                            <th className="pb-3">المدينة</th>
                            <th className="pb-3">الوقت</th>
                            <th className="pb-3 pl-4">الصفحة</th>
                            <th className="pb-3">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {visitorLogs.length > 0 ? visitorLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                              <td className="py-3 pr-4">
                                  <ModernCheckbox 
                                      checked={selectedVisitorLogs.has(log.id)}
                                      onChange={() => {
                                          const newSelected = new Set(selectedVisitorLogs);
                                          if (newSelected.has(log.id)) {
                                              newSelected.delete(log.id);
                                          } else {
                                              newSelected.add(log.id);
                                          }
                                          setSelectedVisitorLogs(newSelected);
                                      }}
                                      id={`select-visitor-${log.id}`}
                                  />
                              </td>
                              <td className="py-3 pr-4 font-mono text-blue-400 ltr">{log.ip_address}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-gray-500" />
                                    <span>{log.country || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="py-3 text-gray-400">{log.city || '-'}</td>
                              <td className="py-3 text-gray-400 font-mono text-xs">{new Date(log.visited_at).toLocaleString('en-US')}</td>
                              <td className="py-3 pl-4 text-xs text-gray-500 truncate max-w-[200px]" title={log.page_url}>{log.page_url?.replace(window.location.origin, '')}</td>
                              <td className="py-3">
                                  <button onClick={() => handleBanIp(log.ip_address)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="حظر IP">
                                      <Ban className="w-4 h-4" />
                                  </button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-500">لا توجد سجلات زيارات في هذه الفترة</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">عرض</span>
                            <select 
                                value={trafficPageSize}
                                onChange={(e) => {
                                    setTrafficPageSize(Number(e.target.value));
                                    setTrafficPage(1);
                                }}
                                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-blue-500 transition-colors"
                            >
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span className="text-sm text-gray-400">من {trafficTotal} سجل</span>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setTrafficPage(p => Math.max(1, p - 1))}
                                disabled={trafficPage === 1}
                                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <span className="flex items-center px-4 text-sm text-white font-mono bg-white/5 rounded-lg">
                                {trafficPage}
                            </span>
                            <button 
                                onClick={() => setTrafficPage(p => p + 1)}
                                disabled={trafficPage * trafficPageSize >= trafficTotal}
                                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    </>
                  )}
                </div>


              </div>
            )}

            {activeTab === 'bans' && (
              <div className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-red-500/10 rounded-xl">
                          <ShieldCheck className="w-8 h-8 text-red-500" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-white">نظام الحظر والحماية</h2>
                          <p className="text-gray-400">إدارة القوائم المحظورة ورسائل الحظر</p>
                      </div>
                  </div>

                  {/* VPN Protection Section */}
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-cyan-400" />
                          حماية VPN والبروكسي
                      </h3>
                      
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                              <div>
                                  <h4 className="font-bold text-white text-sm">حظر الـ VPN</h4>
                                  <p className="text-xs text-gray-500 mt-1">منع المستخدمين من الوصول للموقع باستخدام VPN أو Proxy</p>
                              </div>
                              <ModernCheckbox 
                                  checked={siteSettings.block_vpn === 'true'} 
                                  onChange={async () => {
                                      try {
                                          const newValue = siteSettings.block_vpn === 'true' ? 'false' : 'true';
                                          await settingsService.updateSettings([{ key: 'block_vpn', value: newValue }]);
                                          await refreshSettings();
                                          setSuccess('تم تحديث إعدادات VPN بنجاح');
                                          setTimeout(() => setSuccess(null), 3000);
                                      } catch (err) {
                                          console.error(err);
                                          setError('فشل تحديث الإعدادات');
                                      }
                                  }} 
                                  id="block-vpn-toggle"
                              />
                          </div>

                          {/* Timezone Mismatch Protection */}
                          <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                              <div>
                                  <h4 className="font-bold text-white text-sm">حظر Timezone Mismatch</h4>
                                  <p className="text-xs text-gray-500 mt-1">حظر الزوار عند اختلاف توقيت المتصفح عن توقيت عنوان IP</p>
                              </div>
                              <ModernCheckbox 
                                  checked={siteSettings.block_timezone_mismatch === 'true'} 
                                  onChange={async () => {
                                      try {
                                          const newValue = siteSettings.block_timezone_mismatch === 'true' ? 'false' : 'true';
                                          await settingsService.updateSettings([{ key: 'block_timezone_mismatch', value: newValue }]);
                                          await refreshSettings();
                                          setSuccess('تم تحديث إعدادات Timezone بنجاح');
                                          setTimeout(() => setSuccess(null), 3000);
                                      } catch (err) {
                                          console.error(err);
                                          setError('فشل تحديث الإعدادات');
                                      }
                                  }} 
                                  id="block-timezone-toggle"
                              />
                          </div>

                          {/* Strict VPN Protection (Military Grade) */}
                          <div className="flex flex-col gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                              <div className="flex items-center justify-between">
                                  <div>
                                      <h4 className="font-bold text-white text-sm">حظر VPN و البروكسي (الوضع الصارم)</h4>
                                      <p className="text-xs text-gray-500 mt-1">حماية عسكرية تمنع حتى الـ VPN المدفوع عبر تحليل ISP و ASN و MTU</p>
                                  </div>
                                  <ModernCheckbox 
                                      checked={siteSettings.block_strict_vpn === 'true'} 
                                      onChange={async () => {
                                          try {
                                              const newValue = siteSettings.block_strict_vpn === 'true' ? 'false' : 'true';
                                              await settingsService.updateSettings([{ key: 'block_strict_vpn', value: newValue }]);
                                              await refreshSettings();
                                              setSuccess('تم تحديث وضع الحظر الصارم بنجاح');
                                              setTimeout(() => setSuccess(null), 3000);
                                          } catch (err) {
                                              console.error(err);
                                              setError('فشل تحديث الإعدادات');
                                          }
                                      }} 
                                      id="block-strict-vpn-toggle"
                                  />
                              </div>

                              {siteSettings.block_strict_vpn === 'true' && (
                                  <div className="space-y-4 pt-4 border-t border-white/5">
                                      <div>
                                          <label className="block text-sm font-bold text-red-400 mb-2">رسالة حظر الـ VPN الصارم</label>
                                          <textarea
                                              value={settings.strict_vpn_message !== undefined ? settings.strict_vpn_message : (siteSettings.strict_vpn_message || '')}
                                              onChange={(e) => {
                                                  setSettings({ ...settings, strict_vpn_message: e.target.value });
                                              }}
                                              className="w-full bg-black/50 border border-red-500/10 rounded-xl p-3 text-white text-sm focus:border-red-500 transition-colors min-h-[80px]"
                                              placeholder="أدخل رسالة الحظر التي ستظهر لمستخدمي الـ VPN في الوضع الصارم..."
                                          />
                                          <div className="mt-2 flex justify-end">
                                              <button 
                                                  onClick={async () => {
                                                      try {
                                                          await settingsService.updateSettings([{ key: 'strict_vpn_message', value: settings.strict_vpn_message || siteSettings.strict_vpn_message }]);
                                                          await refreshSettings();
                                                          setSuccess('تم حفظ رسالة الحظر الصارم');
                                                          setTimeout(() => setSuccess(null), 3000);
                                                      } catch (err) {
                                                          setError('فشل حفظ الرسالة');
                                                      }
                                                  }}
                                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                              >
                                                  حفظ الرسالة
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* Advanced Protection System */}
                          <div className="flex flex-col gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                              <div className="flex items-center justify-between">
                                  <div>
                                      <h4 className="font-bold text-white text-sm">نظام الحماية المتقدم (Heuristic)</h4>
                                      <p className="text-xs text-gray-500 mt-1">حظر بناءً على النقاط المخاطرة: WebRTC, Headers, DNS, Timing</p>
                                  </div>
                                  <ModernCheckbox 
                                      checked={siteSettings.block_advanced_protection === 'true'} 
                                      onChange={async () => {
                                          try {
                                              const newValue = siteSettings.block_advanced_protection === 'true' ? 'false' : 'true';
                                              await settingsService.updateSettings([{ key: 'block_advanced_protection', value: newValue }]);
                                              await refreshSettings();
                                              setSuccess('تم تحديث نظام الحماية المتقدم بنجاح');
                                              setTimeout(() => setSuccess(null), 3000);
                                          } catch (err) {
                                              console.error(err);
                                              setError('فشل تحديث الإعدادات');
                                          }
                                      }} 
                                      id="block-advanced-toggle"
                                  />
                              </div>

                              {siteSettings.block_advanced_protection === 'true' && (
                                  <div className="space-y-4 pt-4 border-t border-white/5">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-400 mb-2">حد النقاط للحظر (Threshold: 0-100)</label>
                                          <div className="flex gap-2">
                                              <input 
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  value={settings.block_advanced_threshold !== undefined ? settings.block_advanced_threshold : (siteSettings.block_advanced_threshold || '50')}
                                                  onChange={(e) => {
                                                      setSettings({ ...settings, block_advanced_threshold: e.target.value });
                                                  }}
                                                  className="w-24 bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-cyan-500 outline-none"
                                              />
                                              <button 
                                                  onClick={async () => {
                                                      try {
                                                          await settingsService.updateSettings([{ key: 'block_advanced_threshold', value: settings.block_advanced_threshold || siteSettings.block_advanced_threshold || '50' }]);
                                                          await refreshSettings();
                                                          setSuccess('تم حفظ حد النقاط بنجاح');
                                                          setTimeout(() => setSuccess(null), 3000);
                                                      } catch (err) {
                                                          setError('فشل حفظ الإعدادات');
                                                      }
                                                  }}
                                                  className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-3 py-1 rounded-lg text-xs font-bold transition-colors border border-cyan-500/20"
                                              >
                                                  حفظ
                                              </button>
                                          </div>
                                          <p className="text-[10px] text-gray-500 mt-1">القيمة الافتراضية هي 50. كلما انخفض الرقم، زادت صرامة الحظر.</p>
                                      </div>

                                      <div>
                                          <label className="block text-sm font-bold text-white mb-2">رسالة الحظر المتقدم (Advanced Protection)</label>
                                          <textarea
                                              value={settings.advanced_ban_message !== undefined ? settings.advanced_ban_message : (siteSettings.advanced_ban_message || '')}
                                              onChange={(e) => {
                                                  setSettings({ ...settings, advanced_ban_message: e.target.value });
                                              }}
                                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-cyan-500 transition-colors min-h-[80px]"
                                              placeholder="أدخل رسالة الحظر التي ستظهر للمستخدمين المكتشفين بنظام الحماية المتقدم..."
                                          />
                                          <div className="mt-2 flex justify-end">
                                              <button 
                                                  onClick={async () => {
                                                      try {
                                                          await settingsService.updateSettings([{ key: 'advanced_ban_message', value: settings.advanced_ban_message || siteSettings.advanced_ban_message }]);
                                                          await refreshSettings();
                                                          setSuccess('تم حفظ رسالة الحظر المتقدم');
                                                          setTimeout(() => setSuccess(null), 3000);
                                                      } catch (err) {
                                                          setError('فشل حفظ الرسالة');
                                                      }
                                                  }}
                                                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                              >
                                                  حفظ الرسالة
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {siteSettings.block_vpn === 'true' && (
                              <div className="bg-black/30 rounded-xl border border-white/5 p-4 mt-4">
                                  <label className="block text-sm font-bold text-white mb-2">رسالة الحظر (VPN/Proxy)</label>
                                  <div className="flex gap-2">
                                      <textarea
                                          value={settings.vpn_ban_message !== undefined ? settings.vpn_ban_message : (siteSettings.vpn_ban_message || '')}
                                          onChange={(e) => {
                                              setSettings({ ...settings, vpn_ban_message: e.target.value });
                                          }}
                                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-cyan-500 transition-colors min-h-[80px]"
                                          placeholder="أدخل رسالة الحظر التي ستظهر للمستخدم..."
                                      />
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                      <button 
                                          onClick={async () => {
                                              try {
                                                  await settingsService.updateSettings([{ key: 'vpn_ban_message', value: settings.vpn_ban_message || siteSettings.vpn_ban_message }]);
                                                  await refreshSettings();
                                                  setSuccess('تم حفظ رسالة الحظر');
                                                  setTimeout(() => setSuccess(null), 3000);
                                              } catch (err) {
                                                  setError('فشل حفظ الرسالة');
                                              }
                                          }}
                                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                      >
                                          حفظ الرسالة
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Country Ban Section */}
                      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                              <Globe className="w-5 h-5 text-cyan-400" />
                              حظر الدول
                          </h3>

                          {/* Country Ban Message */}
                          <div className="bg-black/30 rounded-xl border border-white/5 p-4 mb-6">
                              <label className="block text-sm font-bold text-white mb-2">رسالة حظر الدول (Geo-Restriction)</label>
                              <div className="flex gap-2">
                                  <textarea
                                      value={settings.geo_ban_message !== undefined ? settings.geo_ban_message : (siteSettings.geo_ban_message || '')}
                                      onChange={(e) => {
                                          setSettings({ ...settings, geo_ban_message: e.target.value });
                                      }}
                                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-cyan-500 transition-colors min-h-[80px]"
                                      placeholder="أدخل رسالة الحظر التي ستظهر للزوار من الدول المحظورة..."
                                  />
                              </div>
                              <div className="mt-3 flex justify-end">
                                  <button 
                                      onClick={async () => {
                                          try {
                                              await settingsService.updateSettings([{ key: 'geo_ban_message', value: settings.geo_ban_message || siteSettings.geo_ban_message }]);
                                              await refreshSettings();
                                              setSuccess('تم حفظ رسالة حظر الدول');
                                              setTimeout(() => setSuccess(null), 3000);
                                          } catch (err) {
                                              setError('فشل حفظ الرسالة');
                                          }
                                      }}
                                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                  >
                                      حفظ الرسالة
                                  </button>
                              </div>
                          </div>

                          {/* Add Ban UI */}
                          <div className="flex gap-2 mb-6">
                              <div className="relative flex-1">
                                  <button 
                                      onClick={() => setShowCountrySelector(!showCountrySelector)}
                                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-right flex items-center justify-between hover:border-red-500/50 transition-colors"
                                  >
                                      <span className={newBanCountry ? 'text-white' : 'text-gray-500'}>
                                          {newBanCountry || "اختر دولة من القائمة..."}
                                      </span>
                                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} />
                                  </button>

                                  {showCountrySelector && (
                                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                                          <div className="p-2 border-b border-white/10 bg-black/20">
                                              <div className="relative">
                                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                  <input 
                                                      type="text" 
                                                      value={countrySearchTerm}
                                                      onChange={(e) => setCountrySearchTerm(e.target.value)}
                                                      placeholder="بحث عن دولة..."
                                                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-cyan-500 outline-none"
                                                      autoFocus
                                                  />
                                              </div>
                                          </div>
                                          <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                                              {countries
                                                  .filter(c => c.name.toLowerCase().includes(countrySearchTerm.toLowerCase()))
                                                  .map((country) => (
                                                      <button
                                                          key={country.iso}
                                                          onClick={() => {
                                                              setNewBanCountry(country.name);
                                                              setShowCountrySelector(false);
                                                          }}
                                                          className="w-full text-right px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center justify-between group"
                                                      >
                                                          <span className="font-mono text-[10px] text-gray-600 group-hover:text-gray-400">{country.iso}</span>
                                                          <span>{country.name}</span>
                                                      </button>
                                                  ))
                                              }
                                              {countries.filter(c => c.name.toLowerCase().includes(countrySearchTerm.toLowerCase())).length === 0 && (
                                                  <div className="p-4 text-center text-gray-500 text-xs italic">لا توجد نتائج</div>
                                              )}
                                          </div>
                                      </div>
                                  )}
                              </div>
                              <button 
                                  onClick={handleBanCountry}
                                  disabled={!newBanCountry}
                                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-colors"
                              >
                                  حظر
                              </button>
                          </div>

                          {/* Ban List */}
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {bannedCountries.map((ban) => (
                                  <div key={ban.id} className="bg-black/40 border border-red-500/10 rounded-xl p-3 flex justify-between items-center group hover:border-red-500/30 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <Globe className="w-4 h-4 text-red-400" />
                                          <span className="font-bold text-gray-200">{ban.country_name}</span>
                                      </div>
                                      <button 
                                          onClick={() => handleUnbanCountry(ban.id)}
                                          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          title="إلغاء الحظر"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                              {bannedCountries.length === 0 && (
                                  <p className="text-center text-gray-500 py-4">لا توجد دول محظورة حالياً</p>
                              )}
                          </div>
                      </div>

                      {/* IP Ban Section */}
                      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                              <Ban className="w-5 h-5 text-cyan-400" />
                              حظر عناوين IP
                          </h3>

                          {/* IP Ban Message */}
                          <div className="bg-black/30 rounded-xl border border-white/5 p-4 mb-6">
                              <label className="block text-sm font-bold text-white mb-2">رسالة حظر IPs</label>
                              <div className="flex gap-2">
                                  <textarea
                                      value={settings.ip_ban_message !== undefined ? settings.ip_ban_message : (siteSettings.ip_ban_message || '')}
                                      onChange={(e) => {
                                          setSettings({ ...settings, ip_ban_message: e.target.value });
                                      }}
                                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-cyan-500 transition-colors min-h-[80px]"
                                      placeholder="أدخل رسالة الحظر التي ستظهر للمستخدمين المحظورين عبر IP..."
                                  />
                              </div>
                              <div className="mt-3 flex justify-end">
                                  <button 
                                      onClick={async () => {
                                          try {
                                              await settingsService.updateSettings([{ key: 'ip_ban_message', value: settings.ip_ban_message || siteSettings.ip_ban_message }]);
                                              await refreshSettings();
                                              setSuccess('تم حفظ رسالة حظر IP');
                                              setTimeout(() => setSuccess(null), 3000);
                                          } catch (err) {
                                              setError('فشل حفظ الرسالة');
                                          }
                                      }}
                                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                  >
                                      حفظ الرسالة
                                  </button>
                              </div>
                          </div>

                          {/* Add Ban UI */}
                          <div className="flex gap-2 mb-6">
                              <input 
                                  type="text" 
                                  value={newBanIp}
                                  onChange={(e) => setNewBanIp(e.target.value)}
                                  placeholder="أدخل عنوان IP..."
                                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500/50 transition-colors font-mono"
                              />
                              <button 
                                  onClick={() => handleBanIp(newBanIp)}
                                  disabled={!newBanIp}
                                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-colors"
                              >
                                  حظر
                              </button>
                          </div>

                          {/* Ban List */}
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {bannedIps.map((ban) => (
                                  <div key={ban.id} className="bg-black/40 border border-red-500/10 rounded-xl p-3 flex justify-between items-center group hover:border-red-500/30 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <Ban className="w-4 h-4 text-red-400" />
                                          <span className="font-bold text-gray-200 font-mono">{ban.ip_address}</span>
                                      </div>
                                      <button 
                                          onClick={() => handleUnbanIp(ban.id)}
                                          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          title="إلغاء الحظر"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                              {bannedIps.length === 0 && (
                                  <p className="text-center text-gray-500 py-4">لا توجد IPs محظورة حالياً</p>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Customer Ban Section */}
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                          <Users className="w-5 h-5 text-cyan-400" />
                          حظر العملاء
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Customer Ban Message */}
                          <div className="bg-black/30 rounded-xl border border-white/5 p-4 h-fit">
                              <label className="block text-sm font-bold text-white mb-2">رسالة حظر العملاء (Email/Phone)</label>
                              <div className="flex gap-2">
                                  <textarea
                                      value={settings.customer_ban_message !== undefined ? settings.customer_ban_message : (siteSettings.customer_ban_message || '')}
                                      onChange={(e) => {
                                          setSettings({ ...settings, customer_ban_message: e.target.value });
                                      }}
                                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-cyan-500 transition-colors min-h-[80px]"
                                      placeholder="أدخل رسالة الحظر التي ستظهر للعملاء المحظورين..."
                                  />
                              </div>
                              <div className="mt-3 flex justify-end">
                                  <button 
                                      onClick={async () => {
                                          try {
                                              await settingsService.updateSettings([{ key: 'customer_ban_message', value: settings.customer_ban_message || siteSettings.customer_ban_message }]);
                                              await refreshSettings();
                                              setSuccess('تم حفظ رسالة حظر العملاء');
                                              setTimeout(() => setSuccess(null), 3000);
                                          } catch (err) {
                                              setError('فشل حفظ الرسالة');
                                          }
                                      }}
                                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                  >
                                      حفظ الرسالة
                                  </button>
                              </div>
                          </div>

                          <div className="space-y-6">
                              {/* Add Ban UI */}
                              <div className="flex flex-col md:flex-row gap-2">
                                  <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden shrink-0">
                                      <button 
                                          className={`px-4 py-3 text-sm font-medium transition-colors ${newBanType === 'email' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                                          onClick={() => setNewBanType('email')}
                                      >
                                          Email
                                      </button>
                                      <button 
                                          className={`px-4 py-3 text-sm font-medium transition-colors ${newBanType === 'phone' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                                          onClick={() => setNewBanType('phone')}
                                      >
                                          Phone
                                      </button>
                                  </div>
                                  <input 
                                      type="text" 
                                      value={newBanIdentifier}
                                      onChange={(e) => setNewBanIdentifier(e.target.value)}
                                      placeholder={newBanType === 'email' ? "example@email.com" : "+123456789"}
                                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500/50 transition-colors"
                                  />
                                  <button 
                                      onClick={handleBanCustomer}
                                      disabled={!newBanIdentifier}
                                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-colors"
                                  >
                                      حظر
                                  </button>
                              </div>

                              {/* Ban List */}
                              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {bannedCustomers.map((ban) => (
                                      <div key={ban.id} className="bg-black/40 border border-red-500/10 rounded-xl p-3 flex justify-between items-center group hover:border-red-500/30 transition-colors">
                                          <div className="flex items-center gap-3 overflow-hidden">
                                              {ban.type === 'email' ? <Mail className="w-4 h-4 text-red-400 shrink-0" /> : <Phone className="w-4 h-4 text-red-400 shrink-0" />}
                                              <span className="font-bold text-gray-200 truncate" title={ban.identifier}>{ban.identifier}</span>
                                          </div>
                                          <button 
                                              onClick={() => handleUnbanCustomer(ban.id)}
                                              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                                              title="إلغاء الحظر"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                  ))}
                                  {bannedCustomers.length === 0 && (
                                      <p className="col-span-full text-center text-gray-500 py-4">لا يوجد عملاء محظورين حالياً</p>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            )}

            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'verified-users' && <VerifiedUserManagement />}
            {activeTab === 'discord-tools' && <DiscordTools />}
            {activeTab === 'moneymotion' && <MoneyMotionManager />}
            {activeTab === 'keys' && <ProductKeysManager products={products} keys={productKeys} onKeysUpdate={loadData} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} />}
            {activeTab === 'key-stats' && <ProductKeyStats products={products} keys={productKeys} purchaseIntents={purchaseIntents} />}
            {activeTab === 'migrations' && <ProductMigrationTracker keys={productKeys} products={products} />}
            {activeTab === 'local-payments' && <LocalPaymentManager />}
            
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-cyan-400" />
                          إعدادات النظام
                      </h3>
                      
                      <div className="space-y-4">


                        {/* Discord Webhook Configuration */}
                        <DiscordSettings 
                            settings={{...siteSettings, ...settings}} 
                            onSettingsChange={setSettings} 
                        />
                        
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={handleTestWebhook}
                                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-white/10 flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                اختبار الإشعار
                            </button>
                            <button 
                                onClick={async () => {
                                    try {
                                        await settingsService.updateSettings([
                                            { key: 'discord_webhook_url', value: settings.discord_webhook_url !== undefined ? settings.discord_webhook_url : siteSettings.discord_webhook_url },
                                            { key: 'discord_bot_avatar_url', value: settings.discord_bot_avatar_url !== undefined ? settings.discord_bot_avatar_url : siteSettings.discord_bot_avatar_url },
                                            { key: 'discord_bot_token', value: settings.discord_bot_token !== undefined ? settings.discord_bot_token : siteSettings.discord_bot_token },
                                            { key: 'discord_admin_id', value: settings.discord_admin_id !== undefined ? settings.discord_admin_id : siteSettings.discord_admin_id },
                                            { key: 'special_discord_webhook_url_1', value: settings.special_discord_webhook_url_1 !== undefined ? settings.special_discord_webhook_url_1 : siteSettings.special_discord_webhook_url_1 },
                                            { key: 'special_discord_user_id_1', value: settings.special_discord_user_id_1 !== undefined ? settings.special_discord_user_id_1 : siteSettings.special_discord_user_id_1 },
                                            { key: 'special_discord_webhook_url_2', value: settings.special_discord_webhook_url_2 !== undefined ? settings.special_discord_webhook_url_2 : siteSettings.special_discord_webhook_url_2 },
                                            { key: 'special_discord_user_id_2', value: settings.special_discord_user_id_2 !== undefined ? settings.special_discord_user_id_2 : siteSettings.special_discord_user_id_2 }
                                        ]);
                                        await refreshSettings();
                                        setSuccess('تم حفظ إعدادات ديسكورد');
                                        setTimeout(() => setSuccess(null), 3000);
                                    } catch (err) {
                                        setError('فشل حفظ الإعدادات');
                                    }
                                }}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                            >
                                حفظ الإعدادات
                            </button>
                        </div>
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'expired-keys' && (
              <div className="space-y-6 animate-fade-in-up">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase">اشتراكات نشطة</p>
                              <h3 className="text-2xl font-bold text-white mt-1">{subscriptionStats.active}</h3>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-xl text-green-400"><CheckCircle2 className="w-6 h-6" /></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase">تنتهي قريباً (3 أيام)</p>
                              <h3 className="text-2xl font-bold text-yellow-400 mt-1">{subscriptionStats.expiring}</h3>
                          </div>
                          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400"><Clock className="w-6 h-6" /></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase">منتهية الصلاحية</p>
                              <h3 className="text-2xl font-bold text-red-400 mt-1">{subscriptionStats.expired}</h3>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><XCircle className="w-6 h-6" /></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase">إيرادات الاشتراكات</p>
                              <h3 className="text-2xl font-bold text-cyan-400 mt-1">${subscriptionStats.revenue.toFixed(0)}</h3>
                          </div>
                          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Banknote className="w-6 h-6" /></div>
                      </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 sticky top-20 z-20 backdrop-blur-md">
                      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                          <button 
                              onClick={() => setSubscriptionStatusFilter('all')} 
                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${subscriptionStatusFilter === 'all' ? 'bg-white text-black' : 'bg-black text-gray-400 border border-white/10'}`}
                          >
                              الكل
                          </button>
                          <button 
                              onClick={() => setSubscriptionStatusFilter('active')} 
                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${subscriptionStatusFilter === 'active' ? 'bg-green-500 text-white' : 'bg-black text-gray-400 border border-white/10'}`}
                          >
                              نشط فقط
                          </button>
                          <button 
                              onClick={() => setSubscriptionStatusFilter('expiring')} 
                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${subscriptionStatusFilter === 'expiring' ? 'bg-yellow-500 text-black' : 'bg-black text-gray-400 border border-white/10'}`}
                          >
                              ينتهي قريباً
                          </button>
                          <button 
                              onClick={() => setSubscriptionStatusFilter('expired')} 
                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${subscriptionStatusFilter === 'expired' ? 'bg-red-500 text-white' : 'bg-black text-gray-400 border border-white/10'}`}
                          >
                              منتهي
                          </button>
                          <button 
                              onClick={() => setSubscriptionStatusFilter('multi_active')} 
                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${subscriptionStatusFilter === 'multi_active' ? 'bg-purple-500 text-white' : 'bg-black text-gray-400 border border-white/10'}`}
                          >
                              أكثر من اشتراك نشط
                          </button>
                      </div>

                      <div className="relative">
                          <Package className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <select
                              value={subscriptionFilter.productId}
                              onChange={(e) => setSubscriptionFilter({...subscriptionFilter, productId: e.target.value})}
                              className="appearance-none pr-10 pl-4 py-2 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 min-w-[160px]"
                          >
                              <option value="all">كل المنتجات</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                          </select>
                          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                          <div className="relative flex-1 md:w-64">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                  type="text" 
                                  placeholder="بحث بالبريد أو المفتاح..." 
                                  value={subscriptionFilter.searchTerm}
                                  onChange={(e) => setSubscriptionFilter({...subscriptionFilter, searchTerm: e.target.value})}
                                  className="w-full pr-10 pl-4 py-2 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                              />
                          </div>
                          {selectedSubscriptionKeys.length > 0 && (
                              <button 
                                  onClick={handleDeleteSelectedSubscriptions}
                                  className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                              >
                                  <Trash2 className="w-4 h-4" />
                                  حذف ({selectedSubscriptionKeys.length})
                              </button>
                          )}
                          <button 
                            onClick={handleExportSubscriptions}
                            className="p-2 bg-black hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                            title="تصدير CSV"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setShowTopPurchasersModal(true)}
                            className="p-2 bg-black hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/30 rounded-xl text-gray-400 hover:text-yellow-400 transition-colors"
                            title="أكثر العملاء شراءً"
                        >
                            <Trophy className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                      <table className="w-full text-right">
                          <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                              <tr>
                                  <th className="p-4 w-24">
                                      <div className="flex items-center gap-2">
                                          <ModernCheckbox 
                                              checked={subscriptionTrackingList.length > 0 && selectedSubscriptionKeys.length === subscriptionTrackingList.length}
                                              onChange={() => handleSelectAllSubscriptions(selectedSubscriptionKeys.length !== subscriptionTrackingList.length)}
                                          />
                                          {selectedSubscriptionKeys.length > 0 && (
                                              <span className="text-cyan-400 text-xs font-bold whitespace-nowrap">
                                                  ({selectedSubscriptionKeys.length})
                                              </span>
                                          )}
                                      </div>
                                  </th>
                                  <th className="p-4">المنتج</th>
                                  <th className="p-4">العميل</th>
                                  <th className="p-4">المفتاح</th>
                                  <th className="p-4">تاريخ التفعيل</th>
                                  <th className="p-4 text-center">تاريخ الانتهاء</th>
                                  <th className="p-4 text-center">الوقت المتبقي</th>
                                  <th className="p-4 text-center">الحالة</th>
                                  <th className="p-4 text-center">إجراءات</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {subscriptionTrackingList.map(key => {
                                  const usedDate = new Date(key.used_at!);
                                  let expiryDate: Date;
                                  if (key.expiration_date) {
                                      expiryDate = new Date(key.expiration_date);
                                  } else {
                                      expiryDate = new Date(usedDate);
                                      expiryDate.setDate(expiryDate.getDate() + 30);
                                  }
                                  const product = products.find(p => p.id === key.product_id);
                                  const isRevealed = revealedSubscriptionKeys.has(key.id);
                                  const isLoyal = (key as any).purchaseCount > 1;
                                  const now = new Date();
                                  const totalDuration = 30 * 24 * 60 * 60 * 1000;
                                  const timeLeft = expiryDate.getTime() - now.getTime();
                                  const progress = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
                                  
                                  let progressColor = 'bg-green-500';
                                  if (progress < 20) progressColor = 'bg-red-500';
                                  else if (progress < 50) progressColor = 'bg-yellow-500';

                                  return (
                                      <tr key={key.id} className="hover:bg-white/5 transition-colors group">
                                          <td className="p-4">
                                              <ModernCheckbox 
                                                  checked={selectedSubscriptionKeys.includes(key.id)}
                                                  onChange={() => handleToggleSubscriptionSelection(key.id)}
                                              />
                                          </td>
                                          <td className="p-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                      {product?.image ? (
                                                          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                                      ) : (
                                                          <Package className="w-5 h-5 text-slate-500" />
                                                      )}
                                                  </div>
                                                  <span className="font-bold text-white text-sm">{product?.title}</span>
                                              </div>
                                          </td>
                                          <td className="p-4">
                                              <div className="flex flex-col gap-1">
                                                  <div className="flex items-center gap-2 text-white font-medium">
                                                      <Mail className="w-3 h-3 text-gray-500" />
                                                      <span className="text-sm truncate max-w-[180px]" title={key.used_by_email || ''}>{key.used_by_email || 'Unknown'}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      {(key as any).country && (key as any).country !== 'Unknown' && (
                                                          <span className="text-[10px] bg-black px-1.5 py-0.5 rounded text-gray-400 border border-white/10 flex items-center gap-1">
                                                              <Globe className="w-3 h-3" /> {(key as any).country}
                                                          </span>
                                                      )}
                                                      {(key as any).activeCount > 1 && (
                                                          <span className="text-[10px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded border border-pink-500/20 flex items-center gap-1 font-bold">
                                                              <Activity className="w-3 h-3" /> {(key as any).activeCount} Active
                                                          </span>
                                                      )}
                                                      {isLoyal && (
                                                          <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1 font-bold">
                                                              <Crown className="w-3 h-3" /> VIP
                                                          </span>
                                                      )}
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-4">
                                              <div className="flex items-center gap-2">
                                                  <code className="bg-black/50 px-2 py-1 rounded text-cyan-400 font-mono text-xs border border-white/10 tracking-wider">
                                                      {isRevealed ? key.key_value : '••••••••••••••••'}
                                                  </code>
                                                  <button onClick={() => toggleSubscriptionKeyReveal(key.id)} className="text-gray-500 hover:text-white transition-colors">
                                                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                  </button>
                                                  <button onClick={() => handleCopyText(key.key_value)} className="text-gray-500 hover:text-white transition-colors">
                                                      <Copy className="w-3 h-3" />
                                                  </button>
                                              </div>
                                          </td>
                                          <td className="p-4 text-sm text-gray-400 font-mono">
                                              {usedDate.toLocaleDateString('en-GB')}
                                          </td>
                                          <td className="p-4 text-center text-sm text-gray-400 font-mono">
                                              {expiryDate.toLocaleDateString('en-GB')}
                                          </td>
                                          <td className="p-4">
                                              <div className="flex flex-col items-center gap-2">
                                                  <CountdownTimer targetDate={expiryDate} />
                                                  {timeLeft > 0 && (
                                                      <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                          <div className={`h-full ${progressColor} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                                                      </div>
                                                  )}
                                              </div>
                                          </td>
                                          <td className="p-4 text-center">
                                              {timeLeft <= 0 ? (
                                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                      <XCircle className="w-3 h-3" /> منتهي
                                                  </span>
                                              ) : (
                                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${timeLeft < 3 * 24 * 60 * 60 * 1000 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                      <CheckCircle2 className="w-3 h-3" /> {timeLeft < 3 * 24 * 60 * 60 * 1000 ? 'ينتهي قريباً' : 'نشط'}
                                                  </span>
                                              )}
                                          </td>
                                          <td className="p-4 text-center">
                                              <button 
                                                  onClick={() => setSelectedUserHistory(key.used_by_email || null)}
                                                  className="p-2 bg-black hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 rounded-lg transition-colors border border-white/10 hover:border-purple-500/30"
                                                  title="سجل العميل"
                                              >
                                                  <History className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {subscriptionTrackingList.length === 0 && (
                                  <tr>
                                      <td colSpan={8} className="p-12 text-center text-gray-500 flex flex-col items-center justify-center w-full">
                                          <TimerOff className="w-12 h-12 mb-4 opacity-20" />
                                          <p>لا توجد اشتراكات تطابق الفلتر المحدد.</p>
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                  {showTopPurchasersModal && (
                      <TopPurchasersModal 
                          keys={productKeys} 
                          onClose={() => setShowTopPurchasersModal(false)} 
                      />
                  )}
              </div>
            )}

            {activeTab === 'content' && <SiteContentEditor settings={settings} onSettingsChange={setSettings} onSave={handleSaveSettings} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} />}
            {activeTab === 'invoice-templates' && <InvoiceEditor onSaveSuccess={loadData} />}
            
            {/* Purchase Intents Tab */}
            {activeTab === 'purchase-intents' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="بحث بالبريد، المنتج، أو المفتاح..." 
                        value={purchaseIntentSearchTerm}
                        onChange={(e) => setPurchaseIntentSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex bg-black p-1 rounded-xl border border-white/10">
                        <button 
                            onClick={() => setPurchaseIntentFilter('pending')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${purchaseIntentFilter === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            قيد الانتظار ({filteredIntents.pending.length})
                        </button>
                        <button 
                            onClick={() => setPurchaseIntentFilter('completed')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${purchaseIntentFilter === 'completed' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            مكتمل ({filteredIntents.completed.length})
                        </button>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {selectedPurchaseIntents.length > 0 && (
                        <button 
                            onClick={handleDeleteSelectedPurchaseIntents}
                            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            حذف ({selectedPurchaseIntents.length})
                        </button>
                    )}
                    <button 
                        onClick={() => setIsCreatingIntent(true)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        طلب يدوي
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2">
                    <ModernCheckbox 
                        checked={intentsToDisplay.length > 0 && selectedPurchaseIntents.length === intentsToDisplay.length}
                        onChange={() => handleSelectAllPurchaseIntents(selectedPurchaseIntents.length !== intentsToDisplay.length)}
                    />
                    <span className="text-xs text-gray-400">تحديد الكل</span>
                </div>

                <div className="grid gap-4">
                    {intentsToDisplay.map((intent) => {
                        const isCompleted = purchaseIntentFilter === 'completed';
                        const productKey = isCompleted ? (intent as any).productKey : null;
                        const isRevealed = revealedIntentKeys.has(intent.id);
                        const product = products.find(p => p.id === intent.product_id);

                        return (
                            <div key={intent.id} className={`bg-white/5 border ${selectedPurchaseIntents.includes(intent.id) ? 'border-cyan-500' : 'border-white/10'} rounded-2xl p-4 hover:bg-white/10 transition-all group relative overflow-hidden`}>
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="mt-1">
                                            <ModernCheckbox 
                                                checked={selectedPurchaseIntents.includes(intent.id)}
                                                onChange={() => handleTogglePurchaseIntentSelection(intent.id)}
                                            />
                                        </div>
                                        
                                        <div className="w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {product?.image ? (
                                                <img src={product.image} alt={intent.product_title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-600" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-bold truncate">{intent.product_title}</h4>
                                                <span className="text-[10px] bg-black px-2 py-0.5 rounded text-gray-400 border border-white/10">{intent.country}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate max-w-[200px]" title={intent.email}>{intent.email}</span>
                                                    <button onClick={() => handleCopyText(intent.email)} className="hover:text-white"><Copy className="w-3 h-3" /></button>
                                                </div>
                                                {intent.phone_number && (
                                                    <div className="flex items-center gap-1">
                                                        <Smartphone className="w-3 h-3" />
                                                        <span>{intent.phone_number}</span>
                                                        <button onClick={() => handleCopyText(intent.phone_number)} className="hover:text-white"><Copy className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(intent.created_at).toLocaleString('en-GB')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                                        {isCompleted && productKey ? (
                                            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-green-400 font-bold">تم التسليم</span>
                                                    <div className="flex items-center gap-1">
                                                        <code className="text-xs font-mono text-white">
                                                            {isRevealed ? productKey.key_value : '••••••••••••'}
                                                        </code>
                                                        <button onClick={() => toggleIntentKeyReveal(intent.id)} className="text-gray-400 hover:text-white">
                                                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        </button>
                                                        <button onClick={() => handleCopyText(productKey.key_value)} className="text-gray-400 hover:text-white">
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const text = generateWhatsappInvoiceText(intent, productKey.key_value);
                                                                const url = `https://wa.me/${intent.phone_number?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                            className="text-gray-400 hover:text-green-400 transition-colors"
                                                            title="إرسال الفاتورة عبر واتساب"
                                                        >
                                                            <MessageCircle className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSendBrevoEmail(intent)}
                                                            disabled={sendingBrevo === intent.id}
                                                            className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                                                            title="إرسال الفاتورة عبر Brevo"
                                                        >
                                                            {sendingBrevo === intent.id ? (
                                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <Mail className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                            <button 
                                                onClick={() => {
                                                    const text = `مرحباً، بخصوص طلبك لمنتج ${intent.product_title}...\nيرجى استكمال الدفع لإرسال المفتاح.`;
                                                    const url = `https://wa.me/${intent.phone_number?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors"
                                                title="تواصل عبر واتساب"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => { setInvoiceModalIntent(intent); setProductKeyForInvoice(null); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
                                            >
                                                <Send className="w-4 h-4" />
                                                إرسال الفاتورة
                                            </button>
                                            <button 
                                                onClick={() => handleSendBrevoEmail(intent)}
                                                disabled={sendingBrevo === intent.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                                                title="إرسال الفاتورة عبر Brevo"
                                            >
                                                {sendingBrevo === intent.id ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Mail className="w-4 h-4" />
                                                )}
                                                إرسال Brevo
                                            </button>
                                            </>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleDeletePurchaseIntent(intent.id)}
                                            className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl transition-colors"
                                            title="حذف الطلب"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {intentsToDisplay.length === 0 && (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                <ShoppingCart className="w-8 h-8" />
                            </div>
                            <p className="text-gray-400">لا توجد طلبات شراء في هذه القائمة.</p>
                        </div>
                    )}
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Video className="w-5 h-5 text-purple-400" /> مكتبة الفيديو</h3>
                  
                  {/* Upload Section */}
                  <div className="bg-black/30 p-6 rounded-xl border border-white/10 mb-8">
                    <h4 className="text-sm font-bold text-white mb-4">رفع فيديو جديد</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2">عنوان الفيديو</label>
                          <input 
                            type="text" 
                            value={newVideo.title} 
                            onChange={e => setNewVideo({...newVideo, title: e.target.value})} 
                            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none" 
                            placeholder="مثال: فيديو شرح المنتج" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2">ملف الفيديو (Max 700MB)</label>
                          <input 
                            type="file" 
                            ref={videoFileInputRef} 
                            onChange={handleVideoFileChange} 
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20" 
                            accept="video/*" 
                          />
                        </div>
                        <button 
                          onClick={handleAddVideo} 
                          disabled={saving} 
                          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                          {saving ? 'جاري الرفع...' : 'رفع الفيديو'}
                        </button>
                      </div>
                      <div className="bg-black/50 rounded-xl border border-white/10 flex items-center justify-center p-4">
                        {newVideo.file ? (
                          <video 
                            src={URL.createObjectURL(newVideo.file)} 
                            className="max-h-48 rounded-lg w-full h-full object-contain" 
                            controls 
                          />
                        ) : (
                          <div className="text-center opacity-50">
                            <Video className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">معاينة الفيديو</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Videos List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map(video => (
                      <div key={video.id} className="bg-black border border-white/10 rounded-xl overflow-hidden group">
                        <div className="relative aspect-video bg-black/50">
                          <video 
                            src={video.video_url} 
                            className="w-full h-full object-cover" 
                            controls
                          />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                              onClick={() => handleDeleteVideo(video)} 
                              className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                              title="حذف الفيديو"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-white mb-1">{video.title}</h4>
                          <p className="text-xs text-gray-500 mb-4">{new Date(video.created_at).toLocaleDateString()}</p>
                          
                          <button 
                            onClick={() => openAssignVideoModal(video)} 
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            <LinkIcon className="w-4 h-4" />
                            تحديد المنتجات
                          </button>
                        </div>
                      </div>
                    ))}
                    {videos.length === 0 && (
                      <div className="col-span-full py-12 text-center text-gray-500">
                        لا توجد فيديوهات في المكتبة
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Logs Tab */}
            {activeTab === 'security-logs' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-red-400" /> 
                                سجل محاولات الدخول المحظورة
                            </h3>
                            <div className="flex gap-2">
                                {selectedBlockedLogs.length > 0 && (
                                    <button 
                                        onClick={handleClearBlockedLogs}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        مسح المحدد ({selectedBlockedLogs.length})
                                    </button>
                                )}
                                <button 
                                    onClick={fetchBlockedLogs}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                                    title="تحديث"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-xs uppercase">
                                            <th className="p-4 w-10">
                                                <ModernCheckbox 
                                                    checked={blockedLogs.length > 0 && selectedBlockedLogs.length === blockedLogs.length}
                                                    onChange={() => {
                                                        if (selectedBlockedLogs.length === blockedLogs.length) {
                                                            setSelectedBlockedLogs([]);
                                                        } else {
                                                            setSelectedBlockedLogs(blockedLogs.map(l => l.id));
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-4 font-bold">العنوان (IP)</th>
                                            <th className="p-4 font-bold">الموقع الجغرافي</th>
                                            <th className="p-4 font-bold">سبب الحظر</th>
                                            <th className="p-4 font-bold">الرابط المستهدف</th>
                                            <th className="p-4 font-bold">الوقت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {blockedLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4">
                                                    <ModernCheckbox 
                                                        checked={selectedBlockedLogs.includes(log.id)}
                                                        onChange={() => {
                                                            if (selectedBlockedLogs.includes(log.id)) {
                                                                setSelectedBlockedLogs(selectedBlockedLogs.filter(id => id !== log.id));
                                                            } else {
                                                                setSelectedBlockedLogs([...selectedBlockedLogs, log.id]);
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-cyan-400">{log.ip_address}</span>
                                                        <button 
                                                            onClick={() => handleCopyText(log.ip_address)} 
                                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-white">
                                                        <Globe className="w-4 h-4 text-gray-500" />
                                                        <span>{log.country || '-'}</span>
                                                        {log.city && <span className="text-gray-500 text-xs">({log.city})</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
                                                        log.reason.includes('VPN') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        log.reason.includes('Country') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        <Ban className="w-3 h-3" />
                                                        {log.reason}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="max-w-[200px] truncate text-gray-400 text-xs" title={log.attempted_url}>
                                                        {log.attempted_url}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                                                    {new Date(log.blocked_at).toLocaleString('en-GB')}
                                                </td>
                                            </tr>
                                        ))}
                                        {blockedLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>لا توجد سجلات حظر مسجلة حالياً</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {blockedLogsTotal > 20 && (
                                <div className="p-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        عرض {blockedLogs.length} من أصل {blockedLogsTotal}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={blockedLogsPage === 1}
                                            onClick={() => setBlockedLogsPage(p => Math.max(1, p - 1))}
                                            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button 
                                            disabled={blockedLogs.length < 20}
                                            onClick={() => setBlockedLogsPage(p => p + 1)}
                                            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Images Tab */}
            {activeTab === 'purchase-images' && (
               <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><QrCode className="w-5 h-5 text-purple-400" /> إدارة صور الدفع</h3>
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                          <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                              <label className="block text-xs font-bold text-gray-400 mb-2">اسم الصورة</label>
                              <input type="text" value={newPurchaseImage.name} onChange={e => setNewPurchaseImage({...newPurchaseImage, name: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none mb-4" placeholder="مثال: Asia Cell QR" />
                              <label className="block text-xs font-bold text-gray-400 mb-2">ملف الصورة</label>
                              <input type="file" ref={purchaseImageFileInputRef} onChange={handlePurchaseImageFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20" accept="image/*" />
                              <button onClick={handleAddPurchaseImage} disabled={saving} className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">رفع الصورة</button>
                          </div>
                          <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex items-center justify-center text-gray-500 text-sm">
                              {newPurchaseImage.file ? <img src={URL.createObjectURL(newPurchaseImage.file)} className="max-h-48 rounded-lg" /> : <div className="text-center"><ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>معاينة الصورة</p></div>}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {purchaseImages.map(img => (
                              <div key={img.id} className="group relative bg-black border border-white/10 rounded-xl overflow-hidden">
                                  <img src={img.image_url} alt={img.name} className="w-full h-40 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                                      <p className="text-white font-bold text-sm truncate">{img.name}</p>
                                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleDeletePurchaseImage(img)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                                          <button onClick={() => { navigator.clipboard.writeText(img.image_url); setSuccess('تم نسخ الرابط'); setTimeout(() => setSuccess(null), 2000); }} className="p-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"><LinkIcon className="w-4 h-4" /></button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
               </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
               <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-yellow-400" /> معرض صور الفوز</h3>
                          <div className="flex gap-2">
                              {selectedPhotos.length > 0 && (
                                  <>
                                      <button onClick={() => setShowMoveModal(true)} className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-bold transition-colors">نقل ({selectedPhotos.length})</button>
                                      <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors">حذف ({selectedPhotos.length})</button>
                                  </>
                              )}
                          </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-8">
                          <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 mb-2">المنتج</label>
                                  <select value={newWinningPhotos.productName} onChange={e => setNewWinningPhotos({...newWinningPhotos, productName: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-yellow-500 focus:outline-none">
                                      {WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 mb-2">الوصف (اختياري)</label>
                                  <input type="text" value={newWinningPhotos.description} onChange={e => setNewWinningPhotos({...newWinningPhotos, description: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-yellow-500 focus:outline-none" placeholder="وصف قصير للصورة" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 mb-2">الصور</label>
                                  <div className="flex gap-2">
                                      <input type="file" multiple ref={winningPhotoFileInputRef} onChange={e => e.target.files && setNewWinningPhotos({...newWinningPhotos, files: Array.from(e.target.files)})} className="hidden" id="photo-upload" accept="image/*" />
                                      <label htmlFor="photo-upload" className="flex-1 p-3 bg-black border border-white/10 rounded-xl text-gray-400 text-center cursor-pointer hover:bg-white/5 transition-colors text-sm flex items-center justify-center gap-2">
                                          <UploadCloud className="w-4 h-4" />
                                          {newWinningPhotos.files.length > 0 ? `${newWinningPhotos.files.length} ملفات` : 'اختر صور'}
                                      </label>
                                      <button onClick={handleAddWinningPhotos} disabled={saving || newWinningPhotos.files.length === 0} className="px-6 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold disabled:opacity-50 transition-colors">رفع</button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                          <button onClick={() => setPhotoProductFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${photoProductFilter === 'all' ? 'bg-white text-black' : 'bg-black text-gray-400 border border-white/10'}`}>الكل</button>
                          {WINNING_PHOTO_PRODUCTS.map(p => (
                              <button key={p} onClick={() => setPhotoProductFilter(p)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${photoProductFilter === p ? 'bg-white text-black' : 'bg-black text-gray-400 border border-white/10'}`}>{p}</button>
                          ))}
                      </div>

                      <div className="space-y-8">
                          {Object.entries(groupedWinningPhotos).map(([productName, photos]) => {
                              if (photoProductFilter !== 'all' && photoProductFilter !== productName) return null;
                              if (photos.length === 0) return null;
                              return (
                                  <div key={productName}>
                                      <div className="flex items-center justify-between mb-4 px-2">
                                          <h4 className="text-white font-bold border-r-4 border-yellow-500 pr-3">{productName} <span className="text-gray-500 text-xs font-normal">({photos.length})</span></h4>
                                          <div className="flex items-center gap-2">
                                              <ModernCheckbox 
                                                  checked={photos.every(p => selectedPhotos.includes(p.id))}
                                                  onChange={() => handleSelectAllForProduct(productName, !photos.every(p => selectedPhotos.includes(p.id)))}
                                              />
                                              <span className="text-xs text-gray-400">تحديد الكل</span>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                          {photos.map(photo => (
                                              <PhotoItem 
                                                  key={photo.id} 
                                                  photo={photo} 
                                                  isSelected={selectedPhotos.includes(photo.id)} 
                                                  onSelectToggle={handleTogglePhotoSelection} 
                                                  onDelete={handleDeleteWinningPhoto}
                                                  saving={saving}
                                              />
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
               </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-fade-in-up">
                  <div className="flex justify-end">
                      <button onClick={() => { setIsAddingProduct(true); setEditingProduct(null); resetProductForm(); }} className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition-all"><Plus className="w-5 h-5" /> إضافة منتج جديد</button>
                  </div>

                  {(isAddingProduct || editingProduct) && (
                      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-fade-in-up">
                          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                              <h3 className="text-xl font-bold text-white">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
                              <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                          </div>
                          <div className="space-y-8">
                              {/* القسم 1: المعلومات الأساسية */}
                              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                                          <Package className="w-5 h-5 text-cyan-400" />
                                      </div>
                                      <div>
                                          <h4 className="text-white font-bold">المعلومات الأساسية</h4>
                                          <p className="text-xs text-gray-500">اسم المنتج، القسم، والوصف العام</p>
                                      </div>
                                  </div>
                                  
                                  <div className="grid md:grid-cols-2 gap-6">
                                      <div className="md:col-span-1">
                                          <label className="block text-xs font-bold text-gray-400 mb-2">اسم المنتج</label>
                                          <input type="text" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
                                      </div>
                                      <div className="md:col-span-1">
                                          <label className="block text-xs font-bold text-gray-400 mb-2">القسم</label>
                                          <select value={newProduct.category_id} onChange={e => handleCategoryChange(e.target.value)} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none">
                                              <option value="">اختر القسم</option>
                                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                          </select>
                                      </div>
                                      <div className="md:col-span-2">
                                          <label className="block text-xs font-bold text-gray-400 mb-2">الوصف</label>
                                          <textarea rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
                                      </div>
                                      
                                      {/* ميزات المنتج */}
                                      <div className="md:col-span-2 space-y-4">
                                          <div className="flex justify-between items-center">
                                              <label className="block text-xs font-bold text-gray-400">مميزات المنتج (Features)</label>
                                              <button onClick={addFeature} className="text-xs bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                                  <Plus className="w-3 h-3" /> إضافة ميزة
                                              </button>
                                          </div>
                                          <div className="grid md:grid-cols-2 gap-3">
                                              {newProduct.features.map((feature, idx) => (
                                                  <div key={idx} className="flex gap-2">
                                                      <input type="text" value={feature} onChange={e => updateFeature(idx, e.target.value)} placeholder="مثال: تحديثات تلقائية" className="flex-1 p-2.5 bg-black border border-white/10 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none" />
                                                      <button onClick={() => removeFeature(idx)} className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                                                          <X className="w-4 h-4" />
                                                      </button>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>

                                      <div className="md:col-span-2 flex gap-6 p-4 bg-black/40 rounded-xl border border-white/5">
                                          <div className="flex items-center gap-3">
                                              <ModernCheckbox checked={newProduct.is_popular || false} onChange={() => setNewProduct({...newProduct, is_popular: !newProduct.is_popular})} id="pop-check" />
                                              <label htmlFor="pop-check" className="text-sm font-bold text-purple-400 cursor-pointer">منتج شائع (Popular)</label>
                                          </div>
                                          <div className="flex items-center gap-3">
                                              <ModernCheckbox checked={newProduct.is_hidden || false} onChange={() => setNewProduct({...newProduct, is_hidden: !newProduct.is_hidden})} id="hide-check" />
                                              <label htmlFor="hide-check" className="text-sm font-bold text-red-400 cursor-pointer">مخفي (Hidden)</label>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* القسم 2: التسعير والضريبة */}
                              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                      <div className="p-2 bg-green-500/10 rounded-lg">
                                          <DollarSign className="w-5 h-5 text-green-400" />
                                      </div>
                                      <div>
                                          <h4 className="text-white font-bold">التسعير والضريبة</h4>
                                          <p className="text-xs text-gray-500">إدارة السعر والضرائب المضافة</p>
                                      </div>
                                  </div>
                                  
                                  <div className="grid md:grid-cols-3 gap-6">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-400 mb-2">السعر الأساسي ($)</label>
                                          <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-400 mb-2">نسبة الضريبة (%)</label>
                                          <input type="number" value={newProduct.payment_gateway_tax || 0} onChange={e => setNewProduct({...newProduct, payment_gateway_tax: Number(e.target.value)})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none" placeholder="0" />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-400 mb-2">السعر النهائي (تلقائي)</label>
                                          <div className="w-full p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 font-mono font-bold text-lg flex items-center justify-between">
                                              <span>${(newProduct.price + (newProduct.price * (newProduct.payment_gateway_tax || 0) / 100)).toFixed(2)}</span>
                                              <span className="text-[10px] text-gray-500 font-normal">تلقائي</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* القسم 3: إعدادات بوابة الدفع */}
                              <div className="bg-yellow-500/5 rounded-2xl border border-yellow-500/10 p-6 space-y-6">
                                  <div className="flex items-center gap-3 border-b border-yellow-500/10 pb-4">
                                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                                          <ShieldAlert className="w-5 h-5 text-yellow-500" />
                                      </div>
                                      <div>
                                          <h4 className="text-yellow-500 font-bold">إعدادات بوابة الدفع (تمويه)</h4>
                                          <p className="text-xs text-yellow-500/60">معلومات وهمية تظهر في بوابات الدفع لحماية الحساب</p>
                                      </div>
                                  </div>
                                  
                                  <div className="grid md:grid-cols-2 gap-6">
                                      <div>
                                          <label className="block text-xs font-bold text-yellow-500/80 mb-2">الاسم المستعار (Masked Name)</label>
                                          <input type="text" value={newProduct.masked_name || ''} onChange={e => setNewProduct({...newProduct, masked_name: e.target.value})} placeholder="مثال: Online Service Support" className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-yellow-500 focus:outline-none text-sm" />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-yellow-500/80 mb-2">الدومين المستعار (Redirect URL)</label>
                                          <input type="text" value={newProduct.masked_domain || ''} onChange={e => setNewProduct({...newProduct, masked_domain: e.target.value})} placeholder="مثال: payments.service.com" className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-yellow-500 focus:outline-none text-sm" />
                                      </div>
                                  </div>
                              </div>

                              {/* القسم 4: إعدادات الدفع بالبطاقة والروابط */}
                              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                      <div className="p-2 bg-purple-500/10 rounded-lg">
                                          <CreditCard className="w-5 h-5 text-purple-400" />
                                      </div>
                                      <div>
                                          <h4 className="text-white font-bold">إعدادات الدفع بالبطاقة والروابط</h4>
                                          <p className="text-xs text-gray-500">خاص بطريقة الدفع عن طريق البطاقة فقط</p>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                      <div className="flex flex-wrap gap-4 mb-4">
                                          <button onClick={() => setNewProduct({...newProduct, purchase_method: 'gateway', buy_link: '', purchase_image_id: null})} className={`flex-1 min-w-[140px] py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${newProduct.purchase_method === 'gateway' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
                                              <CreditCard className="w-4 h-4" /> بوابة الدفع
                                          </button>
                                          <button onClick={() => setNewProduct({...newProduct, purchase_method: 'external', purchase_image_id: null})} className={`flex-1 min-w-[140px] py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${newProduct.purchase_method === 'external' ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
                                              <ExternalLink className="w-4 h-4" /> رابط خارجي
                                          </button>
                                          <button onClick={() => setNewProduct({...newProduct, purchase_method: 'qr', buy_link: ''})} className={`flex-1 min-w-[140px] py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${newProduct.purchase_method === 'qr' ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
                                              <QrCode className="w-4 h-4" /> صورة QR
                                          </button>
                                      </div>
                                      
                                      {newProduct.purchase_method === 'gateway' && (
                                          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-4 animate-fade-in">
                                              <div className="p-3 bg-green-500/10 rounded-full">
                                                  <ShieldCheck className="w-6 h-6 text-green-400" />
                                              </div>
                                              <div>
                                                  <p className="text-sm text-green-400 font-bold">بوابة الدفع نشطة</p>
                                                  <p className="text-xs text-green-400/60">سيتم توجيه العميل تلقائياً إلى بوابة الدفع عند النقر على شراء.</p>
                                              </div>
                                          </div>
                                      )}

                                      {newProduct.purchase_method === 'external' && (
                                          <div className="space-y-6 animate-fade-in">
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-500 mb-2">الرابط الأساسي للشراء</label>
                                                  <input type="url" value={newProduct.buy_link} onChange={e => setNewProduct({...newProduct, buy_link: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none" placeholder="https://..." />
                                              </div>
                                              
                                              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-4">
                                                  <div className="flex justify-between items-center">
                                                      <label className="text-xs font-bold text-gray-400">روابط إضافية (اختياري)</label>
                                                      <button onClick={addAlternativeLink} className="text-xs bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                                          <Plus className="w-3 h-3" /> إضافة رابط
                                                      </button>
                                                  </div>
                                                  
                                                  {newProduct.alternative_links && newProduct.alternative_links.length > 0 ? (
                                                      <div className="space-y-3">
                                                          {newProduct.alternative_links.map((link, idx) => (
                                                              <div key={idx} className="flex gap-3 items-start bg-white/5 p-3 rounded-lg border border-white/5">
                                                                  <div className="flex-1 grid grid-cols-2 gap-3">
                                                                      <input type="text" placeholder="تسمية الرابط" value={link.label} onChange={(e) => updateAlternativeLink(idx, 'label', e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none" />
                                                                      <input type="url" placeholder="https://..." value={link.url} onChange={(e) => updateAlternativeLink(idx, 'url', e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none" />
                                                                  </div>
                                                                  <button onClick={() => removeAlternativeLink(idx)} className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                                                                      <Trash2 className="w-4 h-4" />
                                                                  </button>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  ) : (
                                                      <p className="text-xs text-gray-600 text-center py-4 border border-dashed border-white/10 rounded-lg">لا توجد روابط إضافية حالياً</p>
                                                  )}
                                              </div>
                                          </div>
                                      )}

                                      {newProduct.purchase_method === 'qr' && (
                                          <div className="space-y-2 animate-fade-in">
                                              <label className="block text-xs font-bold text-gray-400 mb-2">اختر صورة الدفع المعدة مسبقاً</label>
                                              <select value={newProduct.purchase_image_id || ''} onChange={e => setNewProduct({...newProduct, purchase_image_id: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none">
                                                  <option value="">اختر صورة الدفع</option>
                                                  {purchaseImages.map(img => <option key={img.id} value={img.id}>{img.name}</option>)}
                                              </select>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {/* القسم 5: الوسائط */}
                              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                      <div className="p-2 bg-pink-500/10 rounded-lg">
                                          <Image className="w-5 h-5 text-pink-400" />
                                      </div>
                                      <div>
                                          <h4 className="text-white font-bold">الوسائط (الصور والفيديو)</h4>
                                          <p className="text-xs text-gray-500">إدارة الملفات المرئية للمنتج</p>
                                      </div>
                                  </div>
                                  
                                  <div className="grid md:grid-cols-2 gap-8">
                                      <div className="space-y-4">
                                          <label className="block text-xs font-bold text-gray-400">صورة المنتج</label>
                                          <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                                              <div className="w-24 h-24 bg-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                  {imagePreviewUrl || newProduct.image ? <img src={imagePreviewUrl || newProduct.image} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-gray-700" />}
                                              </div>
                                              <div className="flex flex-col gap-2">
                                                  <button onClick={() => productImageInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors">رفع صورة جديدة</button>
                                                  <button onClick={() => setShowImageSelector(true)} className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition-colors">من المكتبة</button>
                                              </div>
                                              <input ref={productImageInputRef} type="file" className="hidden" accept="image/*" onChange={handleProductImageFileChange} />
                                          </div>
                                      </div>
                                      
                                      <div className="space-y-4">
                                          <label className="block text-xs font-bold text-gray-400">فيديو المنتج (اختياري)</label>
                                          <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                                              <div className="w-24 h-24 bg-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                  {videoPreviewUrl || newProduct.video_url ? (
                                                      <video src={videoPreviewUrl || newProduct.video_url} className="w-full h-full object-cover" />
                                                  ) : (
                                                      <Video className="w-10 h-10 text-gray-700" />
                                                  )}
                                              </div>
                                              <div className="flex flex-col gap-2">
                                                  <button onClick={() => productVideoInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors">رفع فيديو</button>
                                                  {(videoPreviewUrl || newProduct.video_url) && (
                                                      <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{videoUploadFile ? videoUploadFile.name : 'فيديو حالي'}</span>
                                                  )}
                                              </div>
                                              <input ref={productVideoInputRef} type="file" className="hidden" accept="video/*" onChange={handleProductVideoFileChange} />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div className="mt-8 flex justify-end gap-4">
                              <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="px-6 py-2 bg-black hover:bg-white/10 text-white rounded-xl font-bold transition-colors">إلغاء</button>
                              <button onClick={editingProduct ? handleUpdateProduct : handleAddProduct} disabled={saving} className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">{saving ? 'جاري الحفظ...' : 'حفظ المنتج'}</button>
                          </div>
                      </div>
                  )}

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductDragEnd}>
                      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                          <table className="w-full text-right">
                              <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  <tr>
                                      <th className="p-4">المنتج</th>
                                      <th className="p-4">السعر</th>
                                      <th className="p-4">القسم</th>
                                      <th className="p-4 text-center">الحالة</th>
                                      <th className="p-4 text-center">الإجراءات</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                      {products.map(product => (
                                          <SortableProductRow
                                              key={product.id}
                                              product={product}
                                              onEdit={handleEditProduct}
                                              onDelete={handleDeleteProduct}
                                              onToggleVisibility={handleToggleProductVisibility}
                                              getCategoryName={getCategoryName}
                                          />
                                      ))}
                                  </SortableContext>
                              </tbody>
                          </table>
                      </div>
                  </DndContext>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-purple-400" /> إدارة الأقسام</h3>
                          <button onClick={() => setIsAddingCategory(true)} className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة قسم</button>
                      </div>
                      {isAddingCategory && (
                          <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-6 flex gap-3 animate-fade-in-up">
                              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="اسم القسم" />
                              <button onClick={handleAddCategory} disabled={saving} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm">حفظ</button>
                              <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2 bg-black hover:bg-white/10 text-white rounded-lg font-bold text-sm">إلغاء</button>
                          </div>
                      )}
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                          <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {categories.map(cat => <SortableCategoryItem key={cat.id} category={cat} onDelete={handleDeleteCategory} saving={saving} />)}
                              </div>
                          </SortableContext>
                      </DndContext>
                  </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modals (Image Selector, Move Modal, Manual Intent, Invoice Modal, Print Options) - Kept same logic, just updated styling if needed */}
      {showImageSelector && ( <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"><div className="bg-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-white/10"><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white">Select Image</h3><button onClick={() => setShowImageSelector(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{getFilteredImages().map((image) => (<div key={image.id} className="bg-black rounded-xl p-4 cursor-pointer hover:border-cyan-500 border-2 border-transparent transition-all" onClick={() => handleSelectImage(image.path)}><img src={image.path} className="w-full h-24 object-contain mb-2"/><p className="text-white text-xs text-center">{image.name}</p></div>))}</div></div></div> )}
      {showMoveModal && ( <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"><div className="bg-slate-900 rounded-2xl p-6 border border-white/10 max-w-md w-full"><h3 className="text-xl font-bold text-white mb-4">نقل الصور</h3><select value={moveTargetProduct} onChange={(e) => setMoveTargetProduct(e.target.value)} className="w-full p-3 bg-black border border-white/10 rounded-xl text-white mb-6"><option value="">اختر الوجهة</option>{WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}</select><div className="flex justify-end gap-3"><button onClick={() => setShowMoveModal(false)} className="px-4 py-2 bg-black hover:bg-white/10 text-white rounded-lg">إلغاء</button><button onClick={handleMoveSelected} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">نقل</button></div></div></div> )}
      
      {/* Manual Intent Modal */}
      {isCreatingIntent && ( 
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-slate-900 rounded-2xl border border-white/10 max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-cyan-400"/> 
                        إنشاء طلب يدوي
                    </h3>
                    <button onClick={() => setIsCreatingIntent(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleCreateManualIntent} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">المنتج</label>
                        <div className="relative">
                            <Package className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select 
                                value={newIntentData.productId} 
                                onChange={(e) => setNewIntentData({...newIntentData, productId: e.target.value})} 
                                className="w-full pr-10 pl-4 py-3 bg-black border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-cyan-500 transition-all" 
                                required
                            >
                                <option value="">اختر منتج</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="email" 
                                value={newIntentData.email} 
                                onChange={(e) => setNewIntentData({...newIntentData, email: e.target.value})} 
                                className="w-full pr-10 pl-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all" 
                                placeholder="example@email.com"
                                required 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">الدولة</label>
                        <div className="relative">
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select 
                                value={newIntentData.country} 
                                onChange={(e) => setNewIntentData({...newIntentData, country: e.target.value})} 
                                className="w-full pr-10 pl-4 py-3 bg-black border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-cyan-500 transition-all" 
                                required
                            >
                                <option value="">اختر الدولة</option>
                                {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                        <button 
                            type="button" 
                            onClick={() => setIsCreatingIntent(false)} 
                            className="px-6 py-2.5 bg-black hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="px-8 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                            <span>إنشاء الطلب</span>
                        </button>
                    </div>
                </form>
            </div>
        </div> 
      )}

      {invoiceModalIntent && ( <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-2 md:p-4"><div className="bg-slate-900 rounded-3xl border border-white/10 w-full max-w-[1600px] h-[95vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"><div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl"><h3 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-cyan-400" /> إرسال الفاتورة</h3><button onClick={() => setInvoiceModalIntent(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"><X className="w-7 h-7" /></button></div><div className="flex-1 overflow-hidden grid lg:grid-cols-[480px_1fr] h-full"><div className="overflow-y-auto p-8 border-r border-white/5 space-y-8 bg-slate-900/30"><div>
        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
            <h4 className="text-cyan-400 font-bold">تفاصيل العميل</h4>
        </div>
        <div className="space-y-2 text-sm text-gray-300">
            {/* Product Title Row */}
            <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0 mr-2">
                    <span className="text-gray-500 text-xs block mb-0.5">المنتج</span>
                    <span className="block truncate" title={invoiceModalIntent.product_title}>{invoiceModalIntent.product_title}</span>
                </div>
                <button 
                    onClick={() => handleCopyText(invoiceModalIntent.product_title)} 
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="نسخ اسم المنتج"
                >
                    <Copy className="w-3 h-3" />
                </button>
            </div>

            {/* Email Row */}
            <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0 mr-2">
                    <span className="text-gray-500 text-xs block mb-0.5">البريد الإلكتروني</span>
                    <span className="block truncate" title={invoiceModalIntent.email}>{invoiceModalIntent.email}</span>
                </div>
                <button 
                    onClick={() => handleCopyText(invoiceModalIntent.email)} 
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="نسخ البريد"
                >
                    <Copy className="w-3 h-3" />
                </button>
            </div>

            {/* Country Row */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div>
                    <span className="text-gray-500 text-xs block mb-0.5">الدولة</span>
                    <span>{invoiceModalIntent.country}</span>
                </div>
            </div>

             {/* Phone Row if exists */}
             {invoiceModalIntent.phone_number && (
                <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0 mr-2">
                        <span className="text-gray-500 text-xs block mb-0.5">الهاتف</span>
                        <span className="block truncate">{invoiceModalIntent.phone_number}</span>
                    </div>
                    <button 
                        onClick={() => handleCopyText(invoiceModalIntent.phone_number)} 
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title="نسخ الهاتف"
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div></div><div>
        <label className="block text-sm font-bold text-white mb-2 flex justify-between">
            <span>مفتاح المنتج</span>
            <span className={`text-xs ${availableKeysForProduct.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {availableKeysForProduct.length} مفتاح متاح
            </span>
        </label>
        <div className="flex gap-2"><input type={showInvoiceKeyInput ? "text" : "password"} value={productKeyForInvoice || ''} onChange={(e) => setProductKeyForInvoice(e.target.value)} className="flex-1 p-3 bg-black border border-white/10 rounded-xl text-white font-mono text-center tracking-widest" placeholder="XXXX-XXXX-XXXX" /><button onClick={() => setShowInvoiceKeyInput(!showInvoiceKeyInput)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white"><Eye className="w-5 h-5" /></button><button onClick={handleUseManualKey} disabled={isUsingManualKey || !productKeyForInvoice} className="px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">تأكيد</button></div>{manualKeyError && <p className="text-red-400 text-xs mt-1">{manualKeyError}</p>}
        {availableKeysForProduct.length > 0 && (
            <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">اختر من المفاتيح المتاحة:</p>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {availableKeysForProduct.map(key => (
                        <div
                            key={key.id}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors border ${productKeyForInvoice === key.key_value ? 'bg-cyan-900/30 border-cyan-500/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        >
                            <button
                                onClick={() => setProductKeyForInvoice(key.key_value)}
                                className="flex-1 text-left truncate flex items-center gap-2 min-w-0"
                            >
                                {productKeyForInvoice === key.key_value && <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
                                <span className={`truncate ${productKeyForInvoice === key.key_value ? 'text-cyan-400' : 'text-gray-300'}`}>
                                    {revealedKeys.has(key.id) ? key.key_value : '••••••••••••••••'}
                                </span>
                            </button>
                            
                            <div className="flex items-center gap-1 flex-shrink-0 border-l border-white/10 pl-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleKeyReveal(key.id); }} 
                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    title={revealedKeys.has(key.id) ? "إخفاء" : "إظهار"}
                                >
                                    {revealedKeys.has(key.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleCopyText(key.key_value); }} 
                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    title="نسخ"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        </div><div className="flex flex-wrap gap-2 pt-4"><button onClick={handleCopyInvoiceText} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm">نسخ النص</button><button onClick={handleCopyWhatsappInvoice} className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50 rounded-lg text-sm font-bold flex items-center gap-2"><Copy className="w-4 h-4" /> نسخ للواتساب</button><button onClick={handleDownloadInvoiceImage} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm">تحميل صورة</button><button onClick={() => handleSendBrevoEmail(invoiceModalIntent, productKeyForInvoice || '')} disabled={sendingBrevo === invoiceModalIntent.id} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
    {sendingBrevo === invoiceModalIntent.id ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
    ) : (
        <Mail className="w-4 h-4" />
    )}
    إرسال Brevo
</button>
<button onClick={handleSendGmail} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Gmail</button><button onClick={handleSendWhatsapp} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">WhatsApp</button><button onClick={() => setShowPrintOptions(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm">طباعة</button></div></div><div className="bg-slate-950 h-full relative group flex flex-col">
    <div className="absolute top-6 left-6 z-10">
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs text-cyan-400 border border-cyan-500/30 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            Live Preview Mode
        </div>
    </div>
    <iframe 
        ref={iframeRef} 
        srcDoc={generateInvoiceHTML(invoiceModalIntent, productKeyForInvoice || '')} 
        className="w-full h-full border-0 bg-white shadow-2xl origin-center transition-transform duration-500" 
        style={{ transform: 'scale(0.98)' }}
        title="Preview" 
    />
</div></div></div></div> )}
      {showPrintOptions && ( <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"><div className="bg-slate-900 rounded-2xl p-6 border border-white/10 max-w-sm w-full"><h3 className="text-lg font-bold text-white mb-4">خيارات الطباعة</h3><div className="space-y-3"><button onClick={handleInternalPrint} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold">طباعة مباشرة</button><button onClick={handleExternalPrint} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">فتح في نافذة جديدة</button><button onClick={() => setShowPrintOptions(false)} className="w-full py-3 bg-black hover:bg-white/10 text-white rounded-xl font-bold">إلغاء</button></div></div></div> )}
      
      {/* User History Modal */}
      {selectedUserHistory && userHistoryData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
              <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-slate-900 to-slate-800">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                              {userHistoryData.email ? userHistoryData.email[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-white">{userHistoryData.email}</h3>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                  <span className="flex items-center gap-1 text-gray-400 bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">
                                      <Globe className="w-3 h-3" /> {userHistoryData.country}
                                  </span>
                                  <span className="flex items-center gap-1 text-gray-400 bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">
                                      <Calendar className="w-3 h-3" /> منذ {userHistoryData.joinDate ? userHistoryData.joinDate.toLocaleDateString('en-GB') : 'N/A'}
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedUserHistory(null)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-6 grid grid-cols-2 gap-4 bg-black/20 border-b border-white/5">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">إجمالي المشتريات</p>
                          <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-white">{userHistoryData.totalKeys}</span>
                              <span className="text-xs text-gray-500">مفتاح</span>
                          </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">إجمالي الإنفاق (تقديري)</p>
                          <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-green-400">${userHistoryData.totalSpent.toFixed(0)}</span>
                              <span className="text-xs text-gray-500">USD</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <History className="w-4 h-4 text-purple-400" /> سجل العمليات
                      </h4>
                      <div className="space-y-3">
                          {userHistoryData.keys.map((key, idx) => {
                              const product = products.find(p => p.id === key.product_id);
                              const usedDate = new Date(key.used_at!);
                              return (
                                  <div key={key.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <span className="text-gray-500 text-xs font-mono w-6">#{userHistoryData.keys.length - idx}</span>
                                          <div>
                                              <p className="text-white font-bold text-sm">{product?.title || 'Unknown Product'}</p>
                                              <p className="text-gray-500 text-xs font-mono">{usedDate.toLocaleDateString('en-GB')} • {usedDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <span className="text-cyan-400 font-mono text-xs block mb-1">{key.key_value}</span>
                                          <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">مكتمل</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          </div>
      )}
      {/* Assign Video Modal */}
      {showAssignVideoModal && videoToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1724] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">تحديد المنتجات للفيديو</h3>
                <p className="text-sm text-gray-400">اختر المنتجات التي ستعرض هذا الفيديو: <span className="text-purple-400">{videoToAssign.title}</span></p>
              </div>
              <button onClick={() => setShowAssignVideoModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {products.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => toggleProductForVideo(product.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selectedProductsForVideo.includes(product.id) ? 'bg-purple-500/20 border-purple-500' : 'bg-black/30 border-white/10 hover:border-white/30'}`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedProductsForVideo.includes(product.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}>
                      {selectedProductsForVideo.includes(product.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{product.title}</p>
                      <p className="text-xs text-gray-500">{getCategoryName(product.category_id)}</p>
                    </div>
                    {product.image && (
                      <div className="w-10 h-10 rounded bg-black border border-white/10 overflow-hidden">
                        <img src={product.image} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button onClick={() => setShowAssignVideoModal(false)} className="px-6 py-2 rounded-xl text-white font-bold hover:bg-white/5 transition-colors">إلغاء</button>
              <button onClick={handleAssignVideo} disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : `حفظ التغييرات (${selectedProductsForVideo.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
