const API_KEY_STORAGE_KEY = 'zadd_gemini_api_key';

/**
 * Saves the user's API key to localStorage.
 * @param key The API key string to save.
 */
export const saveApiKey = (key: string): void => {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
        console.error("Failed to save API key to localStorage:", error);
    }
};

/**
 * Retrieves the user's API key from localStorage.
 * @returns The saved API key string, or null if it doesn't exist.
 */
export const getApiKey = (): string | null => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to retrieve API key from localStorage:", error);
        return null;
    }
};

/**
 * Removes the user's API key from localStorage.
 */
export const clearApiKey = (): void => {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear API key from localStorage:", error);
    }
};
