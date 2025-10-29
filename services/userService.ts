const USER_ID_KEY = 'zad_user_id';

/**
 * Generates a simple pseudo-UUID.
 * @returns A unique string identifier.
 */
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Retrieves the unique user ID from localStorage.
 * If one doesn't exist, it creates, saves, and returns a new one.
 * This ID is anonymous and tied to the browser session.
 * @returns The user's unique ID string.
 */
export const getUserId = (): string => {
    try {
        let userId = localStorage.getItem(USER_ID_KEY);
        if (!userId) {
            userId = generateId();
            localStorage.setItem(USER_ID_KEY, userId);
        }
        return userId;
    } catch (error) {
        console.error("Failed to manage user ID in localStorage:", error);
        // Fallback to a non-persistent ID if localStorage fails
        return generateId();
    }
};
