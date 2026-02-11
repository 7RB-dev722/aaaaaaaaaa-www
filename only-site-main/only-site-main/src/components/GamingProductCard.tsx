import React, { useRef, useState } from 'react';
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
  const { settings } = useSettings();
  const isCheatloop = brand === 'cheatloop';
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const getGalleryLink = () => {
    let productQuery = 'Cheatloop PUBG';
    if (brand === 'sinki') productQuery = 'Sinki';
    else if (title.toLowerCase().includes('codm')) productQuery = 'Cheatloop CODM';
    return `/winning-photos?product=${encodeURIComponent(productQuery)}`;
  };

  // Determine the next step after language selection
  let nextStep = `/check-compatibility/${id}`;
  // Skip compatibility check for Sinki or CODM products
  if (brand === 'sinki' || title.toLowerCase().includes('codm') || title.toLowerCase().includes('call of duty')) {
      nextStep = `/pre-purchase/${id}`;
  }
  
  // Final URL points to language selection first
  const finalUrl = `/select-language/${id}?next=${encodeURIComponent(nextStep)}`;

  // Theme colors
  const accentColor = isCheatloop ? '0, 243, 255' : '168, 85, 247'; // RGB values for cyan and purple
  
  // Button Styles
  const btnGradient = isCheatloop 
    ? 'from-cyan-600 to-blue-600' 
    : 'from-purple-600 to-pink-600';
    
  const btnShadow = isCheatloop
    ? 'shadow-cyan-500/20 hover:shadow-cyan-500/40'
    : 'shadow-purple-500/20 hover:shadow-purple-500/40';

  // Enhanced secondary buttons style
  const secondaryBtnStyle = isCheatloop
    ? 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
    : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]';

  return (
    <div 
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative w-full h-full rounded-xl bg-[#0a0a0c] border border-white/5 overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      )}
    >
      {/* Spotlight Effect Layer */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(${accentColor}, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Border Glow Layer */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(${accentColor}, 0.4), transparent 40%)`,
          maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 right-0 z-20 overflow-hidden rounded-bl-xl rounded-tr-xl">
          <div className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md",
            isCheatloop ? "bg-cyan-500 text-black" : "bg-purple-500 text-white"
          )}>
            <Zap className="w-3 h-3 fill-current" />
            Best Seller
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="relative h-full flex flex-col bg-[#050507]/90 backdrop-blur-sm rounded-[11px] m-[1px]">
        
        {/* Header / Image Area */}
        <div className="relative h-48 p-6 flex items-center justify-center overflow-hidden rounded-t-[11px]">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"></div>
          
          {/* Ambient Light */}
          <div className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40",
            isCheatloop ? "bg-cyan-500" : "bg-purple-500"
          )}></div>

          {/* Floating Image */}
          {image && (
            <div className="relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <img src={image} alt={title} className="w-32 h-32 object-contain relative" />
            </div>
          )}

          {/* Tier Badge */}
          <div className="absolute top-4 left-4">
            <span className={cn(
              "px-2 py-1 rounded text-[10px] font-mono uppercase border backdrop-blur-sm",
              isCheatloop 
                ? "border-cyan-500/20 text-cyan-400 bg-cyan-950/30" 
                : "border-purple-500/20 text-purple-400 bg-purple-950/30"
            )}>
              {tier}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
              {title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className={cn("text-3xl font-bold", isCheatloop ? "text-cyan-400" : "text-purple-400")}>{price}</span>
                <span className="text-2xl text-gray-400 font-bold">$</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-950/30 px-2 py-1 rounded border border-green-500/20">
                <Shield className="w-3 h-3" />
                <span>UNDETECTED</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8 flex-1">
            {features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 group/item">
                <div className={cn(
                  "mt-1.5 w-1 h-1 rounded-full transition-all duration-300 group-hover/item:scale-150",
                  isCheatloop ? "bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]" : "bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"
                )}></div>
                <span className="text-xs text-gray-400 group-hover/item:text-gray-200 transition-colors leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3">
            <Link 
              to={id ? finalUrl : '#'}
              className={cn(
                "group/btn relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm text-white overflow-hidden transition-all bg-gradient-to-r shadow-lg hover:-translate-y-0.5",
                btnGradient,
                btnShadow
              )}
            >
              {/* Shine Effect */}
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover/btn:animate-shimmer" />
              
              <span className="relative z-10">PURCHASE</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            <Link 
              to={getGalleryLink()} 
              className={cn(
                "w-10 flex items-center justify-center rounded-lg border bg-[#1a1a1e] transition-all",
                secondaryBtnStyle
              )}
              title="View Gallery"
            >
              <ImageIcon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            </Link>

            {videoLink ? (
              <a 
                href={videoLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={cn(
                  "w-10 flex items-center justify-center rounded-lg border bg-[#1a1a1e] transition-all",
                  secondaryBtnStyle
                )}
                title="Watch Video"
              >
                <PlayCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </a>
            ) : (
              <div className="w-10 flex items-center justify-center rounded-lg bg-[#1a1a1e] border border-white/5 opacity-30 cursor-not-allowed">
                <PlayCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamingProductCard;
