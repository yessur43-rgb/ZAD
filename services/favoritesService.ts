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
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
};

// Add a place to favorites
export const addToFavorites = (place: Place, category?: string): void => {
    try {
        const favorites = getFavorites();

        // Check if already exists
        const exists = favorites.some(fav => fav.name === place.name && fav.address === place.address);
        if (exists) {
            console.log('Place already in favorites');
            return;
        }

        const favoritePlace: FavoritePlace = {
            ...place,
            savedAt: Date.now(),
            category
        };

        favorites.push(favoritePlace);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        console.log('✅ Added to favorites:', place.name);
    } catch (error) {
        console.error('Error adding to favorites:', error);
    }
};

// Remove a place from favorites
export const removeFromFavorites = (placeName: string, placeAddress?: string): void => {
    try {
        const favorites = getFavorites();
        const filtered = favorites.filter(fav =>
            !(fav.name === placeName && fav.address === placeAddress)
        );
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
        console.log('❌ Removed from favorites:', placeName);
    } catch (error) {
        console.error('Error removing from favorites:', error);
    }
};

// Check if a place is in favorites
export const isFavorite = (placeName: string, placeAddress?: string): boolean => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.name === placeName && fav.address === placeAddress);
};

// Clear all favorites
export const clearFavorites = (): void => {
    localStorage.removeItem(FAVORITES_KEY);
};
