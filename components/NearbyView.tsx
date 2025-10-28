import React, { useState, useEffect, useRef } from 'react';
import { getNearbyPlacesForMap } from '../services/geminiService';
import { MapPlace, PlaceCategory } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { MapPinIcon } from './icons/MapPinIcon';
import { RestaurantIcon } from './icons/RestaurantIcon';
import { SightseeingIcon } from './icons/SightseeingIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import StarRating from './StarRating';

const categoryConfig: Record<PlaceCategory, { translation: string, color: string, Icon: React.FC<any> }> = {
    restaurant: { translation: 'مطاعم', color: 'bg-amber-500', Icon: RestaurantIcon },
    cafe: { translation: 'مقاهي', color: 'bg-orange-500', Icon: RestaurantIcon },
    sight: { translation: 'معالم', color: 'bg-sky-500', Icon: SightseeingIcon },
    shop: { translation: 'تسوق', color: 'bg-fuchsia-500', Icon: ShoppingBagIcon },
    other: { translation: 'متنوع', color: 'bg-gray-500', Icon: MapPinIcon },
};

const NearbyView: React.FC = () => {
    const [places, setPlaces] = useState<MapPlace[]>([]);
    const [filteredPlaces, setFilteredPlaces] = useState<MapPlace[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
    const [activeFilter, setActiveFilter] = useState<PlaceCategory | 'all'>('all');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    // Function to initialize or update the map
    const initMap = (lat: number, lng: number) => {
        if (!mapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) { console.error("Leaflet is not loaded"); return; }

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            mapInstanceRef.current = map;

            // User Location Marker
             const userIcon = L.divIcon({
                html: '<div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-md ring-4 ring-blue-500/50"></div>',
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map).bindPopup('موقعك الحالي');
        } else {
             mapInstanceRef.current.setView([lat, lng], 15);
        }
    };
    
    useEffect(() => {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                initMap(latitude, longitude);

                getNearbyPlacesForMap(latitude, longitude)
                    .then(response => {
                        setPlaces(response.places);
                        setFilteredPlaces(response.places);
                    })
                    .catch(err => {
                        console.error(err);
                        setError('فشل في جلب الأماكن القريبة.');
                    })
                    .finally(() => setIsLoading(false));
            },
            (err) => {
                console.error(err);
                setError('يرجى تمكين الوصول إلى الموقع لعرض الخريطة.');
                setIsLoading(false);
            },
            { enableHighAccuracy: true }
        );

        return () => {
             if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const L = (window as any).L;
        if (!mapInstanceRef.current || !L) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers for filtered places
        filteredPlaces.forEach(place => {
             const config = categoryConfig[place.category] || categoryConfig.other;
             const markerIcon = L.divIcon({
                html: `<div class="${config.color} rounded-full p-1.5 shadow-md"><svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">${(config.Icon({}))?.props.children}</svg></div>`,
                className: 'bg-transparent border-0',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });

            const marker = L.marker([place.latitude, place.longitude], { icon: markerIcon })
                .addTo(mapInstanceRef.current)
                .on('click', () => {
                    setSelectedPlace(place);
                    mapInstanceRef.current.setView([place.latitude, place.longitude], 16);
                });
            markersRef.current.push(marker);
        });

    }, [filteredPlaces]);
    
     const handleFilterChange = (category: PlaceCategory | 'all') => {
        setActiveFilter(category);
        setSelectedPlace(null);
        if (category === 'all') {
            setFilteredPlaces(places);
        } else {
            setFilteredPlaces(places.filter(p => p.category === category));
        }
    };

    const FilterButton: React.FC<{ category: PlaceCategory | 'all', label: string }> = ({ category, label }) => (
         <button onClick={() => handleFilterChange(category)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${activeFilter === category ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
            {label}
        </button>
    );

    return (
        <div className="h-full w-full flex flex-col relative" dir="rtl">
            <div ref={mapContainerRef} className="w-full h-full flex-grow bg-gray-200 dark:bg-gray-800"></div>

            {isLoading && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                    <LoadingSpinner />
                    <span className="ml-2">نكتشف ما حولك...</span>
                </div>
            )}
            
            {error && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-center p-4">
                    <p>{error}</p>
                </div>
            )}

            {/* Filter Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[1000]">
                <div className="flex justify-center items-center gap-2 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
                    <FilterButton category="all" label="الكل" />
                    <FilterButton category="restaurant" label="مطاعم" />
                    <FilterButton category="sight" label="معالم" />
                    <FilterButton category="shop" label="تسوق" />
                </div>
            </div>

            {/* Selected Place Card */}
            {selectedPlace && (
                <div 
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[1000] animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 relative">
                        <button onClick={() => setSelectedPlace(null)} className="absolute top-2 left-2 text-gray-400">&times;</button>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white pr-4">{selectedPlace.name}</h3>
                        {selectedPlace.rating && <StarRating rating={selectedPlace.rating} />}
                        {selectedPlace.address && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                <MapPinIcon className="w-3 h-3"/> {selectedPlace.address}
                            </p>
                        )}
                        {selectedPlace.url && (
                             <a href={selectedPlace.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                                عرض التفاصيل &rarr;
                            </a>
                        )}
                    </div>
                </div>
            )}
             <style>{`
                @keyframes slide-up {
                    from { transform: translate(-50%, 20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
             `}</style>
        </div>
    );
};

export default NearbyView;
