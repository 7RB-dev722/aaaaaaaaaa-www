import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Grid,
  Film
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productService, Product } from '@/lib/supabase';

interface VideoPlayerStudioProps {
  // Props can be passed via router state or directly if used as a component
}

const VideoPlayerStudio: React.FC<VideoPlayerStudioProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State from navigation (initial)
  const initialVideoUrl = location.state?.videoUrl;
  const initialProductTitle = location.state?.productTitle;

  // Player state
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(initialVideoUrl || null);
  const [currentProductTitle, setCurrentProductTitle] = useState<string>(initialProductTitle || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch products with videos on mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const allProducts = await productService.getAllProducts();
        const productsWithVideos = allProducts.filter(p => p.video_url || p.video_link);
        setProducts(productsWithVideos);
        
        // If no video selected initially, but we have products, maybe don't auto-select to show gallery first
        // unless specific behavior is desired. For now, we keep gallery view if no URL.
      } catch (error) {
        console.error('Failed to fetch video products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Reset player when video changes
  useEffect(() => {
    if (currentVideoUrl) {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.load();
        // Auto-play is handled by the video tag autoPlay or explicit play() call
        // but modern browsers block unmuted autoplay.
        // We will try to play when ready.
      }
    }
  }, [currentVideoUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (isPlaying) {
         videoRef.current.play().catch(() => {
             setIsPlaying(false); // Fallback if autoplay blocked
         });
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const selectVideo = (product: Product) => {
    if (product.video_url) {
      setCurrentVideoUrl(product.video_url);
      setCurrentProductTitle(product.title);
    } else if (product.video_link) {
      // Fallback for external links (YouTube, etc.) - Just open them or try to play if direct
      // Ideally we should only support direct video files for this player.
      // If it's a youtube link, we might need an embed. For now, let's assume direct URLs or warn.
      if (product.video_link.match(/\.(mp4|webm|ogg)$/i)) {
          setCurrentVideoUrl(product.video_link);
          setCurrentProductTitle(product.title);
      } else {
          window.open(product.video_link, '_blank');
      }
    }
  };

  // Gallery View Render
  if (!currentVideoUrl) {
    return (
      <div className="min-h-screen bg-[#030014] relative overflow-hidden flex flex-col">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20 pointer-events-none" />
        
        {/* Header */}
        <div className="relative z-10 p-6 flex items-center justify-between">
            <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">الرجوع للرئيسية</span>
            </button>
            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
                <Film className="w-6 h-6 text-cyan-400" />
                مكتبة الفيديوهات
            </h1>
            <div className="w-24"></div> {/* Spacer */}
        </div>

        {/* Gallery Grid */}
        <div className="relative z-10 flex-1 container mx-auto px-6 py-10 overflow-y-auto">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl">لا توجد فيديوهات متاحة حالياً</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                        <div 
                            key={product.id}
                            onClick={() => selectVideo(product)}
                            className="group relative bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300"
                        >
                            {/* Thumbnail Placeholder */}
                            <div className="aspect-video bg-black/50 relative overflow-hidden">
                                {product.image ? (
                                    <img src={product.image} alt={product.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                        <Film className="w-12 h-12 text-gray-700" />
                                    </div>
                                )}
                                
                                {/* Play Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[2px]">
                                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                        <Play className="w-8 h-8 text-black fill-current ml-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">{product.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20 pointer-events-none" />

      {/* Top Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 p-6 z-20 transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <button 
          onClick={() => { setCurrentVideoUrl(null); setIsPlaying(false); }}
          className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">العودة للمكتبة</span>
        </button>
        
        <div className="text-center">
            <h1 className="text-white/90 font-bold text-lg hidden md:block">
            {currentProductTitle}
            </h1>
        </div>

        {/* Playlist Toggle (Future Feature Placeholder) */}
        <div className="w-24"></div> 
      </div>

      {/* Video Player */}
      <div className={cn(
        "relative w-full h-full flex items-center justify-center transition-all duration-300",
        isFullscreen ? "max-w-none px-0 py-0" : "max-w-7xl mx-auto px-4 md:px-12 py-20"
      )}>
        <video
          ref={videoRef}
          src={currentVideoUrl}
          className={cn(
            "w-full h-full object-contain shadow-2xl shadow-black/50 transition-all duration-300",
            isFullscreen ? "rounded-none" : "rounded-lg"
          )}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          onEnded={() => setIsPlaying(false)}
          autoPlay
        />
      </div>

      {/* Controls Bar */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-6 z-20 transition-all duration-300 bg-gradient-to-t from-black/90 via-black/60 to-transparent",
        showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}>
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 group">
            <span className="text-xs text-gray-400 font-mono w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />
            <span className="text-xs text-gray-400 font-mono w-10">{formatTime(duration)}</span>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between">
            
            {/* Volume */}
            <div className="flex items-center gap-3 w-32">
              <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => skip(-10)}
                className="group flex flex-col items-center gap-1 text-white/70 hover:text-cyan-400 transition-colors"
                title="-10 ثواني"
              >
                <RotateCcw className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
                <span className="text-[10px] font-bold">-10s</span>
              </button>

              <button 
                onClick={togglePlay}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button 
                onClick={() => skip(10)}
                className="group flex flex-col items-center gap-1 text-white/70 hover:text-cyan-400 transition-colors"
                title="+10 ثواني"
              >
                <RotateCw className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-bold">+10s</span>
              </button>
            </div>

            {/* Fullscreen */}
            <div className="flex items-center justify-end w-32">
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerStudio;
