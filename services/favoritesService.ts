import { Place } from '../types';

const FAVORITES_KEY = 'zad_favorites';

export interface FavoritePlace extends Place {
    savedAt: number;
    category?: string;
}

// Get all favorites from localStorage
export const getFavorites = (): FavoritePlace[] => {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (!stored) {
            console.log('💝 No favorites in localStorage');
            return [];
        }
        const favorites = JSON.parse(stored);
        console.log('💝 Retrieved favorites from localStorage:', favorites.length, 'items');
        return favorites;
    } catch (error) {
        console.error('❌ Error getting favorites:', error);
        return [];
    }
};

// Add a place to favorites
export const addToFavorites = (place: Place, category?: string): void => {
    try {
        const favorites = getFavorites();
        console.log('💝 Current favorites before add:', favorites.length);

        // Check if already exists
        const exists = favorites.some(fav => fav.name === place.name && fav.address === place.address);
        if (exists) {
            console.log('⚠️ Place already in favorites:', place.name);
            return;
        }

        const favoritePlace: FavoritePlace = {
            ...place,
            savedAt: Date.now(),
            category
        };

        favorites.push(favoritePlace);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        console.log('✅ Added to favorites:', place.name, '| Total:', favorites.length);
        console.log('💾 Saved to localStorage:', localStorage.getItem(FAVORITES_KEY)?.length, 'characters');
    } catch (error) {
        console.error('❌ Error adding to favorites:', error);
    }
};

// Remove a place from favorites
export const removeFromFavorites = (placeName: string, placeAddress?: string): void => {
    try {
        const favorites = getFavorites();
        console.log('💝 Current favorites before remove:', favorites.length);
        const filtered = favorites.filter(fav =>
            !(fav.name === placeName && fav.address === placeAddress)
        );
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
        console.log('❌ Removed from favorites:', placeName, '| Remaining:', filtered.length);
        console.log('💾 Saved to localStorage:', localStorage.getItem(FAVORITES_KEY)?.length, 'characters');
    } catch (error) {
        console.error('❌ Error removing from favorites:', error);
    }
};

// Check if a place is in favorites
export const isFavorite = (placeName: string, placeAddress?: string): boolean => {
    const favorites = getFavorites();
    const result = favorites.some(fav => fav.name === placeName && fav.address === placeAddress);
    console.log(`💝 Is "${placeName}" favorite?`, result, '| Total favorites:', favorites.length);
    return result;
};

// Clear all favorites
export const clearFavorites = (): void => {
    localStorage.removeItem(FAVORITES_KEY);
};
