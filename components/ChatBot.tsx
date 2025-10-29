import React, { useState, useEffect, useRef } from 'react';
import { findPlaces } from '../services/geminiService';
import { ChatMessage, Place, SearchCategory, UserLocation } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import PlaceCard from './RestaurantCard';
import { RestaurantIcon } from './icons/RestaurantIcon';
import { PharmacyIcon } from './icons/PharmacyIcon';
import { CafeIcon } from './icons/CafeIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { SightseeingIcon } from './icons/SightseeingIcon';
import MapView from './MapView';
import { MapIcon } from './icons/MapIcon';
import { SortAscendingIcon } from './icons/SortAscendingIcon';
import { StarIcon } from './icons/StarIcon';

const categoryTranslations: Record<SearchCategory, string> = {
    restaurants: 'مطاعم',
    cafes: 'مقاهي',
    shopping: 'تسوق',
    pharmacies: 'صيدليات',
    attractions: 'معالم'
};

const quickSuggestions: { [key in SearchCategory]: string[] } = {
    restaurants: ['مشويات', 'شاورما', 'هندي', 'مأكولات بحرية'],
    cafes: ['قهوة مختصة', 'شاي', 'حلى', 'فطور'],
    shopping: ['مولات', 'ملابس', 'إلكترونيات', 'هدايا'],
    pharmacies: ['صيدلية مناوبة', 'فيتامينات', 'مستلزمات أطفال', 'عناية بالبشرة'],
    attractions: ['متاحف', 'حدائق', 'معالم تاريخية', 'أماكن ترفيهية']
};

interface ChatBotProps {
  location: UserLocation | null;
}

const ChatBot: React.FC<ChatBotProps> = ({ location }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<SearchCategory>('restaurants');
    const [placesToShowOnMap, setPlacesToShowOnMap] = useState<Place[] | null>(null);
    const [latestResponse, setLatestResponse] = useState<{ places: Place[], category: SearchCategory } | null>(null);
    const [sortedPlaces, setSortedPlaces] = useState<Place[]>([]);

    // Filter states
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [filterPrice, setFilterPrice] = useState<string | null>(null);
    const [filterDistance, setFilterDistance] = useState<number | null>(null);
    const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const initialMessage = location 
            ? 'أهلاً بك! تم تحديد موقعك. اختر فئة وحدد ما تبحث عنه.'
            : 'أهلاً بك! لم يتم تحديد موقعك. اختر فئة واحرص على ذكر اسم المدينة في بحثك (مثال: "مطاعم في جدة").';
        setMessages([{ role: 'model', parts: [{ text: initialMessage }] }]);
    }, [location]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (latestResponse) {
            applyFilters(latestResponse.places);
        } else {
            setSortedPlaces([]);
        }
    }, [latestResponse, filterRating, filterPrice, filterDistance, filterOpenNow]);

    const applyFilters = (places: Place[]) => {
        let filtered = [...places];

        // Filter by rating
        if (filterRating) {
            filtered = filtered.filter(p => (p.rating || 0) >= filterRating);
        }

        // Filter by price
        if (filterPrice) {
            filtered = filtered.filter(p => p.priceLevel === filterPrice);
        }

        // Filter by distance
        if (filterDistance && location) {
            filtered = filtered.filter(p => {
                if (!p.distance) return false;
                const distanceNum = parseFloat(p.distance.match(/[\d.]+/)?.[0] || '9999');
                const unit = p.distance.includes('كم') ? 1000 : 1;
                return (distanceNum * unit) <= filterDistance;
            });
        }

        // Filter by open now
        if (filterOpenNow) {
            filtered = filtered.filter(p => {
                if (!p.closingTime) return false;
                return p.closingTime.includes('مفتوح') || p.closingTime.includes('Open');
            });
        }

        setSortedPlaces(filtered);
    };

    const handleSortPlaces = (sortBy: 'distance' | 'rating') => {
        const newlySortedPlaces = [...sortedPlaces].sort((a, b) => {
            if (sortBy === 'distance') {
                const distA = parseFloat(a.distance?.match(/[\\d.]+/)?.[0] || '9999');
                const distB = parseFloat(b.distance?.match(/[\\d.]+/)?.[0] || '9999');
                const unitA = a.distance?.includes('km') ? 1000 : 1;
                const unitB = b.distance?.includes('km') ? 1000 : 1;
                return (distA * unitA) - (distB * unitB);
            }
            if (sortBy === 'rating') {
                const ratingA = a.rating || 0;
                const ratingB = b.rating || 0;
                return ratingB - ratingA;
            }
            return 0;
        });
        setSortedPlaces(newlySortedPlaces);
    };

    const submitMessage = async (query: string) => {
        if (!query.trim() || isLoading) return;

        const fullPrompt = `${categoryTranslations[category]} ${query}`;
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: fullPrompt }] };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLatestResponse(null);
        setError(null);
        setIsLoading(true);

        try {
            const chatHistory = messages.filter(m => !m.places);
            const response = await findPlaces(chatHistory, fullPrompt, location);

            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setMessages((prev) => [...prev, modelMessage]);

            setLatestResponse({ places: response.places || [], category });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
            setError(errorMessage);
            const errorModelMessage: ChatMessage = { role: 'model', parts: [{ text: errorMessage }] };
            setMessages((prev) => [...prev, errorModelMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const CategoryButton = ({ value, label, Icon }: { value: SearchCategory, label: string, Icon: React.FC<any> }) => (
        <button
            onClick={() => {
                setCategory(value);
                setLatestResponse(null);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                category === value ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            <Icon className="w-6 h-6" />
            <span>{label}</span>
        </button>
    );

     const renderInputArea = () => {
        return (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="space-x-2 text-right mb-2" dir="rtl">
                    {quickSuggestions[category].map((sugg) => (
                        <button
                            key={sugg}
                            onClick={() => submitMessage(sugg)}
                            className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
                        >
                            {sugg}
                        </button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submitMessage(input); }} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`ابحث عن ${categoryTranslations[category]}...`}
                        className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
                    >
                        {isLoading ? <LoadingSpinner /> : 'أرسل'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full" dir="rtl">
            {placesToShowOnMap && (
                <MapView places={placesToShowOnMap} userLocation={location} onClose={() => setPlacesToShowOnMap(null)} />
            )}
            
            <div className="flex-grow flex flex-col overflow-hidden">
                
                <div className={`flex flex-col transition-all duration-300 ease-in-out ${latestResponse ? 'max-h-[60%] flex-shrink-0' : 'h-full'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="flex items-center justify-around bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                            <CategoryButton value="restaurants" label="مطاعم" Icon={RestaurantIcon} />
                            <CategoryButton value="cafes" label="مقاهي" Icon={CafeIcon} />
                            <CategoryButton value="shopping" label="تسوق" Icon={ShoppingBagIcon} />
                            <CategoryButton value="pharmacies" label="صيدليات" Icon={PharmacyIcon} />
                            <CategoryButton value="attractions" label="معالم" Icon={SightseeingIcon} />
                        </div>
                    </div>

                    {!location && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/40 text-center text-sm text-amber-800 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800 flex-shrink-0">
                            ⚠️ الموقع غير متوفر. للحصول على أفضل النتائج، يرجى ذكر اسم المدينة في بحثك.
                        </div>
                    )}

                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                             <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                                    msg.role === 'user'
                                        ? 'bg-emerald-500 text-white rounded-br-none'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-bl-none'
                                }`}>
                                    <p>{msg.parts[0].text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="p-2 rounded-2xl bg-gray-100 dark:bg-gray-700 inline-block">
                                    <LoadingSpinner />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {renderInputArea()}
                </div>

                {latestResponse && (
                    <div className="flex flex-col flex-grow border-t-4 border-emerald-500 bg-gray-50 dark:bg-gray-900/50">
                        <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">نتائج البحث ({sortedPlaces.length})</h3>
                            {sortedPlaces.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPlacesToShowOnMap(sortedPlaces)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="عرض على الخريطة">
                                        <MapIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleSortPlaces('distance')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="الترتيب حسب المسافة">
                                        <SortAscendingIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleSortPlaces('rating')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="الترتيب حسب التقييم">
                                        <StarIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Filter Bar */}
                        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="flex flex-wrap gap-2" dir="rtl">
                                {/* All Filter */}
                                <button
                                    onClick={() => {
                                        setFilterRating(null);
                                        setFilterPrice(null);
                                        setFilterDistance(null);
                                        setFilterOpenNow(false);
                                    }}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                        !filterRating && !filterPrice && !filterDistance && !filterOpenNow
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    الكل
                                </button>

                                {/* Rating Filter */}
                                <button
                                    onClick={() => setFilterRating(filterRating === 4.5 ? null : 4.5)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                        filterRating === 4.5
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    ⭐ 4.5+
                                </button>

                                {/* Price Filters */}
                                {['$', '$$', '$$$'].map(price => (
                                    <button
                                        key={price}
                                        onClick={() => setFilterPrice(filterPrice === price ? null : price)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                            filterPrice === price
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        💰 {price}
                                    </button>
                                ))}

                                {/* Distance Filters */}
                                {location && (
                                    <>
                                        <button
                                            onClick={() => setFilterDistance(filterDistance === 1000 ? null : 1000)}
                                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                                filterDistance === 1000
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            📍 أقل من 1 كم
                                        </button>
                                        <button
                                            onClick={() => setFilterDistance(filterDistance === 5000 ? null : 5000)}
                                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                                filterDistance === 5000
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            📍 أقل من 5 كم
                                        </button>
                                    </>
                                )}

                                {/* Open Now Filter */}
                                <button
                                    onClick={() => setFilterOpenNow(!filterOpenNow)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                        filterOpenNow
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    🕐 مفتوح الآن
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-grow p-4">
                            {!isLoading && sortedPlaces.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedPlaces.map((place, index) => (
                                        <PlaceCard key={index} place={place} category={latestResponse.category} />
                                    ))}
                                </div>
                            ) : (
                                 !isLoading && <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
                                    <p>لم يتم العثور على أماكن تطابق بحثك.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBot;
