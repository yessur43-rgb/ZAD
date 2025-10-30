import React, { useState } from 'react';
import { findPlacesOnRoute } from '../services/geminiService';
import { Place, UserLocation } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import PlaceCard from './RestaurantCard';
import { RestaurantIcon } from './icons/RestaurantIcon';
import { MosqueIcon } from './icons/MosqueIcon';
import { SightseeingIcon } from './icons/SightseeingIcon';
import { CafeIcon } from './icons/CafeIcon';

type RouteCategory = 'restaurants' | 'cafes' | 'mosques' | 'sights';

const categoryConfig: Record<RouteCategory, { label: string; query: string; Icon: React.FC<any> }> = {
    restaurants: { label: 'مطاعم حلال', query: 'مطاعم حلال', Icon: RestaurantIcon },
    cafes: { label: 'مقاهي', query: 'مقاهي', Icon: CafeIcon },
    mosques: { label: 'مساجد', query: 'مساجد أو مصليات', Icon: MosqueIcon },
    sights: { label: 'استراحات وخدمات', query: 'استراحات أو محطات خدمة على الطريق', Icon: SightseeingIcon },
};

interface OnMyWayProps {
    location: UserLocation | null;
}

const OnMyWay: React.FC<OnMyWayProps> = ({ location }) => {
    const [startPoint, setStartPoint] = useState('');
    const [destination, setDestination] = useState('');
    const [activeTrip, setActiveTrip] = useState<{ start: string; end: string } | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Place[]>([]);
    const [currentCategory, setCurrentCategory] = useState<RouteCategory | null>(null);

    const handleUseCurrentLocation = () => {
        if (location) {
            setStartPoint('موقعي الحالي');
            setError(null);
        } else {
            setError('الموقع الحالي غير متوفر. يرجى تمكين الوصول إلى الموقع من الشاشة الرئيسية.');
        }
    };

    const handleStartTrip = () => {
        if (!startPoint.trim() || !destination.trim()) {
            setError('يرجى إدخال نقطة البداية والوجهة.');
            return;
        }
        setError(null);
        setResults([]);
        setCurrentCategory(null);
        setActiveTrip({ start: startPoint, end: destination });
    };

    const handleFindCategory = async (category: RouteCategory) => {
        if (!activeTrip) return;
        
        setIsLoading(true);
        setError(null);
        setResults([]);
        setCurrentCategory(category);

        try {
            const locationForApi = activeTrip.start === 'موقعي الحالي' ? location : null;
            const { places } = await findPlacesOnRoute(activeTrip.start, activeTrip.end, categoryConfig[category].query, locationForApi);
            setResults(places);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (activeTrip) {
        return (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">في طريقك من</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{activeTrip.start === 'موقعي الحالي' && location ? location.name : activeTrip.start}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">إلى</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{activeTrip.end}</p>
                    </div>
                     <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(Object.keys(categoryConfig) as RouteCategory[]).map(key => {
                            const { label, Icon } = categoryConfig[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleFindCategory(key)}
                                    disabled={isLoading}
                                    className={`p-3 text-sm font-semibold rounded-lg flex flex-col items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 ${
                                        currentCategory === key
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                    }`}
                                >
                                    <Icon className="w-6 h-6" />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                     <button
                        onClick={() => setActiveTrip(null)}
                        className="w-full mt-4 text-sm text-center text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold"
                    >
                        بدء رحلة جديدة
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-center text-gray-500">
                                <LoadingSpinner />
                                <p className="mt-2">جاري البحث عن {categoryConfig[currentCategory!]?.label} على طريقك...</p>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
                    {!isLoading && results.length > 0 && (
                        <div className="space-y-3">
                            {results.map((place, index) => {
                                // Map route category to search category for favorites
                                const searchCategory = currentCategory === 'restaurants' ? 'restaurants' :
                                                     currentCategory === 'cafes' ? 'cafes' :
                                                     currentCategory === 'mosques' ? 'attractions' :
                                                     'attractions';
                                return (
                                    <PlaceCard key={index} place={place} category={searchCategory} />
                                );
                            })}
                        </div>
                    )}
                    {!isLoading && results.length === 0 && currentCategory && (
                        <div className="text-center text-gray-600 dark:text-gray-400 pt-10">
                            <p>لم يتم العثور على أماكن تطابق بحثك على هذا الطريق.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
         <div className="flex flex-col items-center justify-center p-4 h-full animate-fade-in">
            <div className="w-full max-w-md">
                 <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">على طريقي</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">ابحث عن مطاعم، استراحات، والمزيد على طول مسار رحلتك.</p>
                </div>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">نقطة البداية</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                id="start"
                                value={startPoint}
                                onChange={(e) => setStartPoint(e.target.value)}
                                className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="مثال: الرياض"
                            />
                            <button onClick={handleUseCurrentLocation} className="px-3 bg-gray-200 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-500 rounded-l-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50" title="استخدام موقعي الحالي" disabled={!location}>
                                <LocationMarkerIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوجهة</label>
                         <input
                            type="text"
                            id="destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="مثال: الدمام"
                        />
                    </div>
                </div>

                 {error && <p className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-lg">{error}</p>}
                
                <button
                    onClick={handleStartTrip}
                    className="mt-6 w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
                >
                    اعرض لي خيارات الطريق
                </button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default OnMyWay;