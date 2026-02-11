import React from 'react';
import { Eye, Target, Zap, Shield, Image as ImageIcon, PlayCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '@/lib/utils';

interface GamingProductCardProps {
  id?: string;
  title: string;
  price: number;
  features: string[];
  description: string;
  safety: string;
  buyLink?: string | null;
  videoLink?: string | null;
  tier: 'basic' | 'premium' | 'exclusive';
  isPopular?: boolean;
  image?: string;
  brand: 'cheatloop' | 'sinki';
  purchase_image_id?: string | null;
}

export const GamingProductCard: React.FC<GamingProductCardProps> = ({
  id,
  title,
  price,
  features,
  description,
  safety,
  buyLink,
  videoLink,
  tier,
  isPopular = false,
  image,
  brand,
  purchase_image_id
}) => {
  const { settings, loading } = useSettings();

  const isCheatloop = brand === 'cheatloop';

  const getGalleryLink = () => {
    let productQuery = 'Cheatloop PUBG';
    if (brand === 'sinki') productQuery = 'Sinki';
    else if (title.toLowerCase().includes('codm')) productQuery = 'Cheatloop CODM';
    return `/winning-photos?product=${encodeURIComponent(productQuery)}`;
  };

  let finalUrl = `/check-compatibility/${id}`;
  if (brand === 'sinki' || title.toLowerCase().includes('codm') || title.toLowerCase().includes('call of duty')) {
      finalUrl = `/pre-purchase/${id}`;
  }

  return (
    <div className={cn(
      "group relative h-full flex flex-col",
      "bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden",
      "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
      isCheatloop ? "hover:border-cyan-500/30 hover:shadow-cyan-500/10" : "hover:border-purple-500/30 hover:shadow-purple-500/10"
    )}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-3 right-3 z-20">
          <div className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full text-white shadow-lg flex items-center gap-1",
            isCheatloop ? "bg-cyan-600" : "bg-purple-600"
          )}>
            <Zap size={10} fill="currentColor" /> HOT
          </div>
        </div>
      )}

      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-b from-white/5 to-transparent p-6 flex items-center justify-center">
        <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500",
            isCheatloop ? "bg-cyan-500 blur-3xl" : "bg-purple-500 blur-3xl"
        )}></div>
        {image && (
          <img 
            src={image} 
            alt={title} 
            className="w-32 h-32 object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight group-hover:text-gray-200 transition-colors">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold", isCheatloop ? "text-cyan-400" : "text-purple-400")}>{price}$</span>
            <span className="text-xs text-gray-500 font-medium uppercase border border-white/10 px-2 py-0.5 rounded">{tier}</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6 flex-1">
          {features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
              <div className={cn("w-1 h-1 rounded-full", isCheatloop ? "bg-cyan-500" : "bg-purple-500")}></div>
              <span className="truncate">{feature}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <Link 
                to={id ? finalUrl : '#'}
                className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:scale-[1.02]",
                    isCheatloop ? "bg-cyan-600 hover:bg-cyan-500" : "bg-purple-600 hover:bg-purple-500"
                )}
            >
                Buy Now <ArrowRight size={14} />
            </Link>
            <Link to={getGalleryLink()} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <ImageIcon size={16} />
            </Link>
            {videoLink && (
                <a href={videoLink} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <PlayCircle size={16} />
                </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default GamingProductCard;
