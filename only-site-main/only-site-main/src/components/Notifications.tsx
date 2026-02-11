import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase, Product, productService } from '../lib/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Session } from '@supabase/supabase-js';

interface Notification {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  metadata: {
    product_id?: string;
    type?: 'purchase_confirmation';
  } | null;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { t } = useLanguage();
  const { settings } = useSettings();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();

      const channel = supabase?.channel('public:user_notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${session.user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    } else {
        setNotifications([]);
        setLoading(false);
    }
  }, [session]);

  const fetchNotifications = async () => {
    if (!supabase || !session?.user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const handleConfirmPurchase = async (notification: Notification) => {
    if (!notification.metadata?.product_id) return;
    try {
      const productData = await productService.getProductById(notification.metadata.product_id);
      setSelectedProduct(productData);
      setIsModalOpen(true);
      markAsRead(notification.id);
    } catch (error) {
      console.error("Failed to fetch product for notification", error);
    }
  };

  const handleDetailsSubmit = (details: { email: string; phone: string; anydesk: string; }) => {
    if (!selectedProduct || !settings.telegram_url) return;
    
    const message = `
    New Purchase Confirmation: ${selectedProduct.title}
    Price: ${selectedProduct.price}$
    ---
    Email: ${details.email}
    Phone: ${details.phone || 'Not provided'}
    AnyDesk: ${details.anydesk || 'Not provided'}
    `;
    
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(settings.telegram_url)}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
    
    setIsModalOpen(false);
  };

  const markAsRead = async (id: string) => {
    if (!supabase) return;
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!session) {
    return null;
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-slate-800 border-slate-700 text-white">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                You have {unreadCount} unread message(s).
              </p>
            </div>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`grid grid-cols-[25px_1fr] items-start gap-4 rounded-md p-3 transition-colors ${!notification.is_read ? 'bg-slate-700/50' : ''}`}
                  >
                    {!notification.is_read && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />}
                    {notification.is_read && <span/>}
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.metadata?.type === 'purchase_confirmation' && (
                         <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700" onClick={() => handleConfirmPurchase(notification)}>
                           تأكيد
                         </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No notifications yet.</p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {selectedProduct && (
        <PurchaseDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleDetailsSubmit}
          translations={t}
        />
      )}
    </>
  );
};

export default Notifications;
