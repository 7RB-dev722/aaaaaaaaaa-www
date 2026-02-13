import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Trim environment variables to avoid issues with accidental whitespace
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key. Please check your .env file.');
}

// Create the Supabase client with explicit configuration for better stability
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }) 
  : null;

// Admin client for user management
const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey.includes('YOUR_API_KEY')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const supabaseAdmin = createAdminClient();

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  features: string[];
  description: string;
  buy_link: string;
  buy_link_2?: string;
  buy_link_3?: string;
  buy_link_4?: string;
  buy_link_5?: string;
  image?: string;
  video_link?: string;
  is_popular?: boolean;
  is_hidden?: boolean;
  category: 'pubg' | 'codm';
  category_id: string;
  purchase_image_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WinningPhoto {
  id: string;
  created_at?: string;
  image_url: string;
  product_name: string;
  description?: string;
  position?: number;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export interface PurchaseImage {
  id: string;
  created_at?: string;
  name: string;
  image_url: string;
}

export interface PurchaseIntent {
  id: string;
  created_at: string;
  product_id: string;
  product_title: string;
  country: string;
  email: string;
  phone_number: string;
}

export interface InvoiceTemplateData {
  id: string;
  brand_name: string;
  logo_url: string | null;
  company_name: string | null;
  support_contact: string | null;
  footer_notes: string | null;
  created_at: string;
}

export interface ProductKey {
  id: string;
  created_at: string;
  product_id: string;
  key_value: string;
  is_used: boolean;
  used_by_email: string | null;
  used_at: string | null;
  purchase_intent_id: string | null;
}

export interface VerifiedUser {
  id: string;
  username: string;
  product_type: string;
  created_at?: string;
}

export interface LocalPaymentMethod {
  id: string;
  country: string;
  method_name: string;
  account_holder?: string;
  account_number?: string;
  iban?: string;
  custom_price?: string;
  currency_symbol?: string; // New field for currency symbol (e.g., IQD, TRY)
  product_prices?: Record<string, string>; // JSONB: { product_id: price_string }
  is_active: boolean;
  is_crypto?: boolean;
  crypto_network?: string;
  created_at?: string;
}

export interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
    created_at: string;
    last_sign_in_at?: string;
}

// Services
export const userService = {
  async getUsers(): Promise<AuthUser[]> {
    if (!supabaseAdmin) {
      console.warn('Supabase service role key missing for user management.');
      return [];
    }
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    return data.users;
  },

  async updateUserPassword(userId: string, password: string): Promise<void> {
    if (!supabaseAdmin) throw new Error('Supabase service role key missing.');
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (error) throw new Error(`Failed to update user password: ${error.message}`);
  }
};

export const settingsService = {
  async getSettings(): Promise<Record<string, string>> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) {
      console.error('Error fetching settings:', error);
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }
    return (data || []).reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  },

  async updateSettings(settings: SiteSetting[]): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('site_settings').upsert(settings);
    if (error) throw new Error(`Failed to update settings: ${error.message}`);
  },
};

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  },

  async addCategory(name: string): Promise<Category> {
    if (!supabase) throw new Error('Supabase not configured');
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('categories').insert([{ name, slug }]).select().single();
    if (error) throw new Error(`Failed to add category: ${error.message}`);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete category: ${error.message}`);
  }
};

export const productService = {
  async getProductById(id: string): Promise<Product> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        console.error(`Error fetching product by id ${id}:`, error);
        throw new Error(`Failed to fetch product: ${error.message}`);
    }
    return data;
  },
  
  async getAllProducts(): Promise<Product[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(`Failed to fetch products: ${error.message}`);
    return (data || []).map(product => ({ ...product, is_hidden: product.is_hidden ?? false }));
  },

  async getVisibleProducts(): Promise<Product[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching visible products:', error);
        throw new Error(`Failed to fetch visible products: ${error.message}`);
    }

    return (data || []).map(product => ({
        ...product,
        is_hidden: product.is_hidden ?? false,
    }));
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    if (!supabase) throw new Error('Supabase not configured');
    const productData = {
        title: product.title || '',
        price: product.price || 0,
        features: product.features || [],
        description: product.description || '',
        buy_link: product.buy_link || '',
        buy_link_2: product.buy_link_2 || '',
        buy_link_3: product.buy_link_3 || '',
        buy_link_4: product.buy_link_4 || '',
        buy_link_5: product.buy_link_5 || '',
        image: product.image || '',
        is_popular: product.is_popular || false,
        is_hidden: product.is_hidden || false,
        category: product.category || 'pubg',
        category_id: product.category_id || '',
        video_link: product.video_link || null,
        purchase_image_id: product.purchase_image_id || null
    };
    const { data, error } = await supabase.from('products').insert([productData]).select().single();
    if (error) throw new Error(`Failed to add product: ${error.message}`);
    return data;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update product: ${error.message}`);
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
  }
};

export const winningPhotosService = {
  async getPhotos(productName?: string): Promise<WinningPhoto[]> {
    if (!supabase) throw new Error('Supabase not configured');
    let query = supabase
      .from('winning_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (productName) {
      query = query.eq('product_name', productName);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch winning photos: ${error.message}`);
    return data || [];
  },

  async addPhotos(photos: Omit<WinningPhoto, 'id' | 'created_at' | 'position'>[]): Promise<WinningPhoto[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('winning_photos').insert(photos).select();
    if (error) throw new Error(`Failed to add winning photos: ${error.message}`);
    return data || [];
  },

  async deletePhotos(photos: WinningPhoto[]): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const photoIds = photos.map(p => p.id);
    const { error } = await supabase.from('winning_photos').delete().in('id', photoIds);
    if (error) throw new Error(`Failed to delete photos: ${error.message}`);
  },

  async movePhotos(photoIds: string[], newProductName: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('winning_photos').update({ product_name: newProductName }).in('id', photoIds);
    if (error) throw new Error(`Failed to move photos: ${error.message}`);
  }
};

export const purchaseImagesService = {
  async getAll(): Promise<PurchaseImage[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('purchase_images').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch purchase images: ${error.message}`);
    return data || [];
  },

  async getById(id: string): Promise<PurchaseImage> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('purchase_images').select('*').eq('id', id).single();
    if (error) throw new Error(`Failed to fetch purchase image: ${error.message}`);
    return data;
  },

  async addImage(name: string, imageUrl: string): Promise<PurchaseImage> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('purchase_images').insert([{ name, image_url: imageUrl }]).select().single();
    if (error) throw new Error(`Failed to add purchase image: ${error.message}`);
    return data;
  },

  async deleteImage(image: PurchaseImage): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('purchase_images').delete().eq('id', image.id);
    if (error) throw new Error(`Failed to delete purchase image: ${error.message}`);
  }
};

export const purchaseIntentsService = {
  async addIntent(intent: Omit<PurchaseIntent, 'id' | 'created_at'>): Promise<PurchaseIntent> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('purchase_intents')
      .insert([intent])
      .select()
      .single();
    if (error) throw new Error(`Failed to add purchase intent: ${error.message}`);
    return data;
  },

  async getAll(): Promise<PurchaseIntent[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('purchase_intents').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch purchase intents: ${error.message}`);
    return data || [];
  },

  async deleteIntents(ids: string[]): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('purchase_intents').delete().in('id', ids);
    if (error) throw new Error(`Failed to delete purchase intents: ${error.message}`);
  }
};

export const invoiceTemplateService = {
  async getAll(): Promise<InvoiceTemplateData[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('invoice_templates').select('*');
    if (error) throw new Error(`Failed to fetch invoice templates: ${error.message}`);
    return data || [];
  },

  async update(id: string, updates: Partial<InvoiceTemplateData>): Promise<InvoiceTemplateData> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('invoice_templates').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update invoice template: ${error.message}`);
    return data;
  },
};

export const productKeysService = {
  async addKeys(productId: string, keys: string[]): Promise<number> {
    if (!supabase) throw new Error('Supabase not configured');
    const keysToInsert = keys.map(key => ({ product_id: productId, key_value: key.trim() }));
    const { data, error } = await supabase.from('product_keys').upsert(keysToInsert, { onConflict: 'key_value', ignoreDuplicates: true }).select();
    if (error) throw new Error(`Failed to add product keys: ${error.message}`);
    return data?.length ?? 0;
  },

  async getKeys(): Promise<ProductKey[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('product_keys').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch product keys: ${error.message}`);
    return data || [];
  },

  async claimAvailableKey(productId: string, email: string, intentId: string): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.rpc('claim_available_key', { p_product_id: productId, p_email: email, p_intent_id: intentId });
    if (error) throw new Error(`Failed to claim key: ${error.message}`);
    return data;
  },

  async assignSpecificKey(keyId: string, email: string, intentId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    
    // First check if key is still available
    const { data: key } = await supabase.from('product_keys').select('is_used').eq('id', keyId).single();
    if (key?.is_used) throw new Error('This key has already been used.');

    const { error } = await supabase
      .from('product_keys')
      .update({
        is_used: true,
        used_by_email: email,
        used_at: new Date().toISOString(),
        purchase_intent_id: intentId,
      })
      .eq('id', keyId);

    if (error) throw new Error(`Failed to assign key: ${error.message}`);
  },

  async returnKey(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('product_keys').update({ is_used: false, used_by_email: null, used_at: null, purchase_intent_id: null }).eq('id', id);
    if (error) throw new Error(`Failed to return key: ${error.message}`);
  },

  async deleteKey(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('product_keys').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete key: ${error.message}`);
  },

  async getProductKeys(productId: string): Promise<ProductKey[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('product_keys')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch product keys: ${error.message}`);
    return data || [];
  }
};

export const verifiedUserService = {
  async getAll(): Promise<VerifiedUser[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('verified_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch verified users: ${error.message}`);
    return data || [];
  },

  async add(username: string, product_type: string): Promise<VerifiedUser> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('verified_users')
      .insert([{ username, product_type }])
      .select()
      .single();
    if (error) throw new Error(`Failed to add verified user: ${error.message}`);
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('verified_users').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete verified user: ${error.message}`);
  },

  async checkVerification(username: string, _product_type: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not configured');
    // إذا كان المستخدم يمتلك أي توثيق، فإنه مسموح له بشراء أي شيء
    // البحث غير حساس لحالة الأحرف (ilike) للتساهل مع المستخدم
    const { data, error } = await supabase
      .from('verified_users')
      .select('id')
      .ilike('username', username)
      .maybeSingle();
    if (error) {
      console.error('Error checking verification:', error);
      return false;
    }
    return !!data;
  }
};

export const localPaymentService = {
  async getAll(): Promise<LocalPaymentMethod[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('local_payment_methods').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch local payment methods: ${error.message}`);
    return data || [];
  },

  async getById(id: string): Promise<LocalPaymentMethod> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('local_payment_methods').select('*').eq('id', id).single();
    if (error) throw new Error(`Failed to fetch local payment method: ${error.message}`);
    return data;
  },

  async addMethod(method: Omit<LocalPaymentMethod, 'id' | 'created_at'>): Promise<LocalPaymentMethod> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('local_payment_methods').insert([method]).select().single();
    if (error) throw new Error(`Failed to add local payment method: ${error.message}`);
    return data;
  },

  async updateMethod(id: string, updates: Partial<LocalPaymentMethod>): Promise<LocalPaymentMethod> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('local_payment_methods').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update local payment method: ${error.message}`);
    return data;
  },

  async deleteMethod(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('local_payment_methods').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete local payment method: ${error.message}`);
  }
};

export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('categories').select('id').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};
