import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, Image as ImageIcon, AlertTriangle, X, ChevronLeft, ChevronRight, Calendar, Clock, Star } from 'lucide-react';
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
                setError(err.message || 'Failed to load photos.');
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
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
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
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${timeFilter === filter 
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' 
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative">
            <AnimatedBackground />
            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-6">
                     <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {productFilter ? `Winning Photos: ${productFilter}` : 'Winning Photos'}
                    </h1>
                    <Link to="/" className="relative">
                        <div className="container-back relative p-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl transition-all duration-400 hover:shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl opacity-0 blur-lg transition-all duration-400 hover:opacity-100 hover:blur-xl"></div>
                            <button className="relative bg-black text-white px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 hover:bg-gray-900 flex items-center space-x-2">
                                <Home className="w-4 h-4" />
                                <span>Back to Home</span>
                            </button>
                        </div>
                    </Link>
                </div>

                <div className="flex justify-center space-x-2 md:space-x-4 mb-12 bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl max-w-md mx-auto">
                    <FilterButton filter="all" label="All Time" icon={Star} />
                    <FilterButton filter="today" label="Today" icon={Clock} />
                    <FilterButton filter="week" label="Last Week" icon={Calendar} />
                    <FilterButton filter="month" label="Last Month" icon={Calendar} />
                </div>

                {loading && (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                            <p className="text-white">Loading Photos...</p>
                        </div>
                    </div>
                )}

                {error && (
                     <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg">
                            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">An Error Occurred</h2>
                            <p className="text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && filteredPhotos.length === 0 && (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center bg-slate-800/50 p-8 rounded-2xl max-w-lg">
                            <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">No Photos Found</h2>
                            <p className="text-gray-400">No winning photos have been uploaded for this filter. Check back soon!</p>
                        </div>
                    </div>
                )}

                {!loading && !error && filteredPhotos.length > 0 && (
                    <div className="space-y-16">
                        {Object.entries(groupedPhotos).map(([productName, productPhotos]) => (
                            <div key={productName}>
                                {!productFilter && (
                                    <h2 className="text-3xl font-bold text-center mb-8 text-cyan-300">{productName}</h2>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {productPhotos.map((photo, index) => (
                                        <div 
                                            key={photo.id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-700/50 cursor-pointer"
                                            style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
                                            onClick={() => openLightbox(photo.id)}
                                        >
                                            <img 
                                                src={photo.image_url} 
                                                alt={photo.description || `Winning photo for ${productName}`}
                                                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                            {photo.description && (
                                                <p className="absolute bottom-0 left-0 right-0 p-4 text-sm text-gray-200 transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                                                    {photo.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {lightboxIndex !== null && filteredPhotos.length > 0 && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
                    onClick={closeLightbox}
                >
                    <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="absolute top-4 right-4 text-white hover:text-cyan-400 transition-colors p-2 z-[60] rounded-full bg-black/50">
                        <X size={32} />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); showPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-cyan-400 transition-colors p-2 z-[60] rounded-full bg-black/50">
                        <ChevronLeft size={48} />
                    </button>
                    
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={filteredPhotos[lightboxIndex].image_url} 
                            alt={filteredPhotos[lightboxIndex].description || ''}
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl shadow-cyan-500/20"
                        />
                        {filteredPhotos[lightboxIndex].description && (
                            <div className="absolute bottom-0 left-0 right-0 text-center text-white p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                                <p>{filteredPhotos[lightboxIndex].description}</p>
                            </div>
                        )}
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); showNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-cyan-400 transition-colors p-2 z-[60] rounded-full bg-black/50">
                        <ChevronRight size={48} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default WinningPhotosPage;
