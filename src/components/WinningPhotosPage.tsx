import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, Image as ImageIcon, AlertTriangle, X, ChevronLeft, ChevronRight, Calendar, Clock, Star, Camera, Sparkles, LayoutGrid } from 'lucide-react';
import { winningPhotosService, WinningPhoto } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const WinningPhotosPage: React.FC = () => {
    const [photos, setPhotos] = useState<WinningPhoto[]>([]);
    const [filteredPhotos, setFilteredPhotos] = useState<WinningPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [searchParams] = useSearchParams();
    const productFilter = searchParams.get('product');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await winningPhotosService.getPhotos(productFilter || undefined);
                setPhotos(data);
            } catch (err: any) {
                setError(err.message || 'فشل تحميل الصور.');
            } finally {
                setLoading(false);
            }
        };
        fetchPhotos();
    }, [productFilter]);

    useEffect(() => {
        if (loading) return;

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const result = photos.filter(photo => {
            if (!photo.created_at) return timeFilter === 'all';
            const photoDate = new Date(photo.created_at);

            switch (timeFilter) {
                case 'today':
                    return photoDate >= twentyFourHoursAgo;
                case 'week':
                    return photoDate >= sevenDaysAgo;
                case 'month':
                    return photoDate >= thirtyDaysAgo;
                case 'all':
                default:
                    return true;
            }
        });
        setFilteredPhotos(result);
    }, [photos, timeFilter, loading]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'ArrowRight') {
                showNext();
            } else if (e.key === 'ArrowLeft') {
                showPrev();
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, filteredPhotos.length]);

    const openLightbox = (photoId: string) => {
        const photoIndex = filteredPhotos.findIndex(p => p.id === photoId);
        if (photoIndex !== -1) {
            setLightboxIndex(photoIndex);
        }
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const showNext = () => {
        if (lightboxIndex === null || filteredPhotos.length === 0) return;
        setLightboxIndex((prevIndex) => (prevIndex! + 1) % filteredPhotos.length);
    };

    const showPrev = () => {
        if (lightboxIndex === null || filteredPhotos.length === 0) return;
        setLightboxIndex((prevIndex) => (prevIndex! - 1 + filteredPhotos.length) % filteredPhotos.length);
    };

    const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
        const key = photo.product_name;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(photo);
        return acc;
    }, {} as Record<string, WinningPhoto[]>);

    const FilterButton = ({ filter, label, icon: Icon }: { filter: TimeFilter, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => setTimeFilter(filter)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300
                ${timeFilter === filter 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white relative font-['Tajawal']" dir="rtl">
            <AnimatedBackground />
            
            <div className="relative z-10 container mx-auto px-4 py-12">
                {/* Studio Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
                            <Camera className="w-10 h-10 text-cyan-400 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-l from-white via-cyan-300 to-cyan-500 bg-clip-text text-transparent mb-2">
                                {productFilter ? `استوديو: ${productFilter}` : 'استوديو الفوز'}
                            </h1>
                            <p className="text-gray-500 flex items-center gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                عرض صور الفوز والاشتراكات النشطة
                            </p>
                        </div>
                    </div>

                    <Link to="/" className="group">
                        <div className="relative p-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)]">
                            <div className="relative bg-[#0a0a0a] px-8 py-4 rounded-[14px] flex items-center gap-3 transition-colors group-hover:bg-transparent">
                                <Home className="w-5 h-5 text-cyan-400" />
                                <span className="font-bold text-sm">العودة للرئيسية</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-16 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 max-w-fit mx-auto shadow-2xl">
                    <FilterButton filter="all" label="كل الأوقات" icon={LayoutGrid} />
                    <FilterButton filter="today" label="اليوم" icon={Clock} />
                    <FilterButton filter="week" label="هذا الأسبوع" icon={Calendar} />
                    <FilterButton filter="month" label="هذا الشهر" icon={Calendar} />
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center min-h-[40vh]">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-6 text-gray-400 font-bold animate-pulse">جاري تحميل الاستوديو...</p>
                    </div>
                )}

                {error && (
                    <div className="max-w-md mx-auto text-center p-8 bg-red-500/5 border border-red-500/20 rounded-3xl backdrop-blur-sm">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">حدث خطأ ما</h2>
                        <p className="text-red-400/80">{error}</p>
                    </div>
                )}

                {!loading && !error && filteredPhotos.length === 0 && (
                    <div className="max-w-md mx-auto text-center p-12 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                        <ImageIcon className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">الاستوديو فارغ</h2>
                        <p className="text-gray-500">لم يتم رفع أي صور فوز لهذا التصنيف بعد.</p>
                    </div>
                )}

                {!loading && !error && filteredPhotos.length > 0 && (
                    <div className="space-y-24">
                        {Object.entries(groupedPhotos).map(([productName, productPhotos]) => (
                            <div key={productName} className="relative">
                                {!productFilter && (
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/50 to-transparent"></div>
                                        <h2 className="text-2xl font-black text-white px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                                            {productName}
                                        </h2>
                                        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {productPhotos.map((photo, index) => (
                                        <div 
                                            key={photo.id}
                                            className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 hover:border-cyan-500/50"
                                            style={{ animation: `fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${index * 0.1}s both` }}
                                            onClick={() => openLightbox(photo.id)}
                                        >
                                            {/* Photo Image */}
                                            <img 
                                                src={photo.image_url} 
                                                alt={photo.description || ''}
                                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                                            />
                                            
                                            {/* Studio Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                                            
                                            {/* Photo Info */}
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                                        <Star className="w-4 h-4 text-cyan-400" />
                                                    </div>
                                                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Winning Shot</span>
                                                </div>
                                                <p className="text-white font-bold text-lg line-clamp-2 leading-tight mb-2">
                                                    {photo.description || 'صورة فوز جديدة'}
                                                </p>
                                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(photo.created_at).toLocaleDateString('ar-EG')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* View Button Overlay */}
                                            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-2xl">
                                                    <Sparkles className="w-5 h-5 text-cyan-400" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Studio Lightbox */}
            {lightboxIndex !== null && filteredPhotos.length > 0 && (
                <div 
                    className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in"
                    onClick={closeLightbox}
                >
                    {/* Lightbox Controls */}
                    <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all hover:rotate-90 p-3 z-[110] rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <X size={28} />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); showPrev(); }} className="absolute left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-cyan-400 transition-all p-4 z-[110] rounded-full bg-white/5 border border-white/10 backdrop-blur-md group">
                        <ChevronRight size={40} className="group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); showNext(); }} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-cyan-400 transition-all p-4 z-[110] rounded-full bg-white/5 border border-white/10 backdrop-blur-md group">
                        <ChevronLeft size={40} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="relative max-w-5xl w-full flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <img 
                                src={filteredPhotos[lightboxIndex].image_url} 
                                alt={filteredPhotos[lightboxIndex].description || ''}
                                className="relative max-h-[80vh] w-auto object-contain rounded-3xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.5)] border border-white/10"
                            />
                        </div>
                        
                        <div className="text-center space-y-2 animate-fade-in-up">
                            <h3 className="text-2xl font-black text-white">
                                {filteredPhotos[lightboxIndex].description || 'تفاصيل الصورة'}
                            </h3>
                            <p className="text-cyan-400 font-bold text-sm tracking-widest uppercase">
                                {filteredPhotos[lightboxIndex].product_name}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </div>
    );
};

export default WinningPhotosPage;
