import React, { useState, useEffect } from 'react';
import { GamingProductCard } from './GamingProductCard';
import { productService, categoryService, Product, Category } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { retry } from '../lib/utils';

export const ProductsGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use retry logic for fetching data to handle potential connection issues
      const [allProducts, allCategories] = await Promise.all([
        retry(() => productService.getVisibleProducts(), 3, 1000),
        retry(() => categoryService.getAllCategories(), 3, 1000)
      ]);
      
      setProducts(allProducts);
      setCategories(allCategories);
    } catch (err: any) {
      console.error('Error loading data after retries:', err);
      setError(err.message || 'Failed to load data from the database. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => product.category_id === categoryId);
  };

  if (loading) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-6 text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 animate-pulse">Loading Arsenal...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-20 relative">
      <div className="container mx-auto px-6 relative z-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-center max-w-2xl mx-auto">
            <p className="mb-2">{error}</p>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {categories.map((category, categoryIndex) => {
          const categoryProducts = getProductsByCategory(category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} className="mb-24 last:mb-0">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-12">
                <div className="relative">
                  <h2 className="text-3xl md:text-4xl font-bold text-white relative z-10 pl-4 border-l-4 border-indigo-500">
                    {category.name}
                  </h2>
                  <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl opacity-50 rounded-full"></div>
                </div>
                <div className="hidden md:block h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-8"></div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryProducts.map((product, productIndex) => (
                  <div 
                    key={product.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${productIndex * 0.1}s` }}
                  >
                    <GamingProductCard 
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      features={product.features}
                      description={product.description}
                      safety="Safe for Main Accounts"
                      buyLink={product.buy_link}
                      videoLink={product.video_link}
                      videoUrl={product.video_url}
                      tier={product.price <= 40 ? 'basic' : product.price <= 45 ? 'premium' : 'exclusive'}
                      isPopular={product.is_popular}
                      image={product.image}
                      brand={product.title.toLowerCase().includes('cheatloop') ? 'cheatloop' : 'sinki'}
                      purchase_image_id={product.purchase_image_id}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {products.length === 0 && !loading && !error && (
           <div className="text-center text-zinc-500 py-20">
            <p className="text-xl">No products available currently.</p>
          </div>
        )}
      </div>
    </section>
  );
};
