import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../lib/supabase';

interface ProductSectionProps {
  title: string;
  products: Product[];
}

const ProductSection: React.FC<ProductSectionProps> = ({ title, products }) => {
  return (
    <section className="py-16 relative">
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full opacity-20 animate-float ${
              i % 2 === 0 ? 'bg-cyan-400' : 'bg-purple-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 3}s`,
              animationDuration: `${10 + Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-4xl font-bold text-center text-white mb-12 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-fade-in-up">
          {title}
        </h2>
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard 
                  title={product.title}
                  price={product.price}
                  features={product.features}
                  description={product.description}
                  buyLink={product.buy_link}
                  image={product.image}
                  isPopular={product.is_popular}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12 animate-fade-in-up">
            <p>No products in this category yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
