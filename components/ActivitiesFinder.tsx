import React, { useState, useEffect, useCallback } from 'react';
import { findActivities } from '../services/geminiService';
import { Activity } from '../types';
import ActivityCard from './ActivityCard';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { ActivityIcon } from './icons/ActivityIcon';
import { FindItIcon } from './icons/FindItIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';

const ActivitiesFinder: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [locationQuery, setLocationQuery] = useState<string>('');
    const [filterTerm, setFilterTerm] = useState<string>('');

    const performSearch = useCallback(async (location: { latitude: number; longitude: number } | string, query?: string) => {
        setHasSearched(true);
        setIsLoading(true);
        setError(null);
        setActivities([]);
        setFilteredActivities([]);
        setCategories([]);
        setSelectedCategory('الكل');
        setFilterTerm('');

        try {
            const result = await findActivities(location, query);
            setActivities(result);
            if (result.length > 0) {
                const uniqueCategories = ['الكل', ...Array.from(new Set(result.map(a => a.category)))];
                setCategories(uniqueCategories);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearch = useCallback(() => {
        const query = searchQuery.trim() || undefined;
        const locationName = locationQuery.trim();

        if (locationName) {
            performSearch(locationName, query);
        } else {
            if (!navigator.geolocation) {
                setError('خاصية تحديد الموقع الجغرافي غير مدعومة. يرجى إدخال موقع يدويًا.');
                return;
            }
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    performSearch({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }, query);
                },
                (err) => {
                    console.error(err);
                    setError('لم نتمكن من الوصول إلى موقعك. يرجى إدخال موقع في حقل البحث.');
                    setIsLoading(false);
                }
            );
        }
    }, [searchQuery, locationQuery, performSearch]);

    useEffect(() => {
        let tempActivities = activities;

        if (selectedCategory !== 'الكل') {
            tempActivities = tempActivities.filter(a => a.category === selectedCategory);
        }

        if (filterTerm.trim() !== '') {
            const lowercasedTerm = filterTerm.toLowerCase().trim();
            tempActivities = tempActivities.filter(a =>
                a.name.toLowerCase().includes(lowercasedTerm) ||
                a.description.toLowerCase().includes(lowercasedTerm) ||
                a.category.toLowerCase().includes(lowercasedTerm)
            );
        }

        setFilteredActivities(tempActivities);
    }, [selectedCategory, filterTerm, activities]);

    const renderResults = () => {
        if (!hasSearched) return null;

        if (isLoading) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <LoadingSpinner />
                    <p className="mt-2">جاري البحث عن أنشطة...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
                    <p>{error}</p>
                    <button onClick={handleSearch} className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg">
                        حاول مرة أخرى
                    </button>
                </div>
            );
        }
        
        if (activities.length === 0) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <ActivityIcon className="w-16 h-16 mx-auto mb-4" />
                    <p>لم يتم العثور على أي أنشطة تطابق بحثك.</p>
                </div>
            );
        }
        
        return (
            <div className="animate-fade-in">
                <div className="mb-4 space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="تصفية النتائج..."
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            className="w-full p-3 pr-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <FindItIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 whitespace-nowrap mx-1 ${
                                    selectedCategory === category
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
                 {filteredActivities.length > 0 ? (
                    <div className="space-y-4">
                        {filteredActivities.map((activity, index) => (
                            <ActivityCard key={`${activity.name}-${index}`} activity={activity} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                        <p>لا توجد أنشطة تطابق تصفيتك في فئة "{selectedCategory}".</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">مستكشف الأنشطة</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">ابحث عن أنشطة في أي مكان في العالم.</p>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                         <input
                            type="text"
                            placeholder="النشاط (مثال: بولينج) - اختياري"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <ActivityIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                     <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="الموقع (مثال: انترلاكن، سويسرا)"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={isLoading}
                        />
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LocationMarkerIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
                 <p className="text-xs text-center text-gray-500 dark:text-gray-400">اترك حقل الموقع فارغًا للبحث بالقرب منك.</p>
                 <button
                    onClick={handleSearch}
                    className="w-full px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center justify-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? <LoadingSpinner /> : <FindItIcon className="w-5 h-5" />}
                    <span>ابحث عن أنشطة</span>
                </button>
            </div>
            
            <div className="mt-6">
                {renderResults()}
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ActivitiesFinder;