import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key. Please check your .env file.');
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Create a separate, isolated client for service role operations.
const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey.includes('YOUR_API_KEY') || supabaseServiceRoleKey.startsWith('Y***')) {
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

export const userService = {
  async getUsers(): Promise<AuthUser[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase service role key is not configured or is invalid. Please add a valid VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.');
    }
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error('Error listing users:', error);
      throw new Error(`Failed to list users: ${error.message}`);
    }
    return data.users;
  },

  async updateUserPassword(userId: string, password: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase service role key is not configured or is invalid.');
    }
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (error) {
      console.error('Error updating user password:', error);
      throw new Error(`Failed to update user password: ${error.message}`);
    }
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
    if (error) {
      console.error('Error updating settings:', error);
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  },
};

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
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
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      const slug = name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, slug }])
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        throw new Error(`Failed to add category: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Add category error:', error);
      throw error;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw new Error(`Failed to delete category: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
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
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      const productsWithHidden = (data || []).map(product => ({
        ...product,
        is_hidden: product.is_hidden ?? false
      }));

      return productsWithHidden;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },

  async getVisibleProducts(): Promise<Product[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

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
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
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

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        throw new Error(`Failed to add product: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Add product error:', error);
      throw error;
    }
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw new Error(`Failed to update product: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        throw new Error(`Failed to delete product: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
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
    if (photos.length === 0) return [];
    
    const photosToInsert = photos.map(photo => ({
      image_url: photo.image_url,
      product_name: photo.product_name,
      description: photo.description,
    }));

    const { data, error } = await supabase
      .from('winning_photos')
      .insert(photosToInsert)
      .select();
    if (error) {
      console.error('Error adding winning photos:', error);
      throw new Error(`Failed to add winning photos: ${error.message}`);
    }
    return data || [];
  },

  async deletePhotos(photos: WinningPhoto[]): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    if (photos.length === 0) return;

    const photoIds = photos.map(p => p.id);
    const imagePaths = photos
      .map(p => {
          try {
              const url = new URL(p.image_url);
              const pathParts = url.pathname.split('/');
              const bucketIndex = pathParts.indexOf('winning-photos');
              if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
                  return pathParts.slice(bucketIndex + 1).join('/');
              }
          } catch (e) {
              console.error("Invalid image URL, cannot extract path:", p.image_url);
          }
          return null;
      })
      .filter((p): p is string => p !== null);

    if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from('winning-photos').remove(imagePaths);
        if (storageError) {
            throw new Error(`Failed to delete files from storage: ${storageError.message}`);
        }
    }

    const { error: dbError } = await supabase.from('winning_photos').delete().in('id', photoIds);
    if (dbError) {
        throw new Error(`Failed to delete photo records from database after deleting files: ${dbError.message}`);
    }
  },

  async movePhotos(photoIds: string[], newProductName: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    if (photoIds.length === 0) return;

    const updates = photoIds.map((id) => 
        supabase.from('winning_photos').update({ 
            product_name: newProductName,
        }).eq('id', id)
    );
    
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error);

    if (firstError) {
        throw new Error(`Failed to move photos: ${firstError.error!.message}`);
    }
  },
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
    
    try {
      const url = new URL(image.image_url);
      const path = url.pathname.split('/purchase-images/')[1];
      if (path) {
        await supabase.storage.from('purchase-images').remove([path]);
      }
    } catch (e) {
      console.error("Could not parse or delete image from storage:", e);
    }
    
    const { error } = await supabase.from('purchase_images').delete().eq('id', image.id);
    if (error) throw new Error(`Failed to delete purchase image from DB: ${error.message}`);
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
    const { data, error } = await supabase
      .from('purchase_intents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch purchase intents: ${error.message}`);
    return data || [];
  },

  async deleteIntents(ids: string[]): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('purchase_intents')
      .delete()
      .in('id', ids);
    if (error) throw new Error(`Failed to delete purchase intents: ${error.message}`);
  },
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
    const { data, error } = await supabase
      .from('invoice_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update invoice template: ${error.message}`);
    return data;
  },
};

export const productKeysService = {
  async addKeys(productId: string, keys: string[]): Promise<number> {
    if (!supabase) throw new Error('Supabase not configured');
    if (keys.length === 0) return 0;

    const keysToInsert = keys.map(key => ({
      product_id: productId,
      key_value: key.trim(),
    }));

    const { data, error } = await supabase
      .from('product_keys')
      .upsert(keysToInsert, { onConflict: 'key_value', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Error adding product keys:', error);
      throw new Error(`Failed to add product keys: ${error.message}`);
    }
    
    return data?.length ?? 0;
  },

  async getKeys(filters: { productId?: string; isUsed?: boolean } = {}): Promise<ProductKey[]> {
    if (!supabase) throw new Error('Supabase not configured');
    
    let query = supabase.from('product_keys').select('*').order('created_at', { ascending: false });

    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }
    if (typeof filters.isUsed === 'boolean') {
      query = query.eq('is_used', filters.isUsed);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch product keys: ${error.message}`);
    return data || [];
  },

  async claimAvailableKey(productId: string, email: string, intentId: string): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.rpc('claim_available_key', {
      p_product_id: productId,
      p_email: email,
      p_intent_id: intentId,
    });
    if (error) {
        console.error('Error claiming key:', error);
        if (error.message.includes('No available keys')) {
            throw new Error('No available keys for this product. Please add more keys.');
        }
        throw new Error(`Failed to claim a key: ${error.message}`);
    }
    return data;
  },

  async returnKey(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('product_keys')
      .update({
        is_used: false,
        used_by_email: null,
        used_at: null,
        purchase_intent_id: null,
      })
      .eq('id', id);
    if (error) throw new Error(`Failed to return key: ${error.message}`);
  },

  async deleteKey(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('product_keys').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete key: ${error.message}`);
  },
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
  if (!supabase) {
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

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
