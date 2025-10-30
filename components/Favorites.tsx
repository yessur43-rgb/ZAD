import React, { useState, useEffect } from 'react';
import { getFavorites, removeFromFavorites, FavoritePlace } from '../services/favoritesService';
import PlaceCard from './RestaurantCard';
import { SearchCategory } from '../types';

const Favorites: React.FC = () => {
    const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = () => {
        const storedFavorites = getFavorites();
        console.log('💝 Loading favorites:', storedFavorites.length, 'items');
        setFavorites(storedFavorites);
    };

    const handleRemove = (placeName: string, placeAddress?: string) => {
        console.log('💝 Removing favorite:', placeName);
        removeFromFavorites(placeName, placeAddress);
        loadFavorites(); // Reload favorites after deletion
    };

    const filteredFavorites = selectedCategory
        ? favorites.filter(fav => fav.category === selectedCategory)
        : favorites;

    const categories = Array.from(new Set(favorites.map(fav => fav.category).filter(Boolean)));

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
                    ❤️ المفضلة
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
                    {favorites.length} {favorites.length === 1 ? 'مكان محفوظ' : 'أماكن محفوظة'}
                </p>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
                    <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                !selectedCategory
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            الكل ({favorites.length})
                        </button>
                        {categories.map(cat => {
                            const count = favorites.filter(fav => fav.category === cat).length;
                            const categoryNames: Record<string, string> = {
                                restaurants: 'مطاعم',
                                cafes: 'مقاهي',
                                shopping: 'تسوق',
                                pharmacies: 'صيدليات',
                                attractions: 'معالم',
                                activities: 'أنشطة',
                                supermarkets: 'متاجر'
                            };
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat || null)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                        selectedCategory === cat
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {categoryNames[cat as string] || cat} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Favorites List */}
            <div className="overflow-y-auto flex-grow p-4">
                {filteredFavorites.length > 0 ? (
                    <div className="space-y-3">
                        {filteredFavorites.map((fav, index) => (
                            <div key={index} className="relative">
                                {/* Delete Button - positioned at top right */}
                                <button
                                    onClick={() => handleRemove(fav.name, fav.address)}
                                    className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all transform hover:scale-110"
                                    title="حذف من المفضلة"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                {/* Place Card */}
                                <PlaceCard
                                    place={fav}
                                    category={(fav.category as SearchCategory) || 'restaurants'}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="text-6xl mb-4">💔</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            لا توجد أماكن محفوظة
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {selectedCategory
                                ? 'لا توجد أماكن محفوظة في هذه الفئة'
                                : 'ابدأ بحفظ الأماكن المفضلة لديك من قسم البحث'
                            }
                        </p>
                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                عرض الكل
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
