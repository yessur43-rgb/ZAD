const USER_ID_KEY = 'zad_user_id';
const USER_PROFILES_KEY = 'zad_user_profiles';

// --- Helper Functions ---
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const getUserProfiles = (): Record<string, string> => {
    try {
        const stored = localStorage.getItem(USER_PROFILES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Failed to get user profiles", e);
        return {};
    }
};

const saveUserProfiles = (profiles: Record<string, string>): void => {
    try {
        localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error("Failed to save user profiles", e);
    }
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

// --- Username Management ---
export const getUsername = (userId: string): string | null => {
    const profiles = getUserProfiles();
    return profiles[userId] || null;
};

export const setUsername = (userId: string, username: string): void => {
    const profiles = getUserProfiles();
    profiles[userId] = username;
    saveUserProfiles(profiles);
};

export const setUserName = (username: string): void => {
    const userId = getUserId();
    setUsername(userId, username);
};

export const getUserName = (): string => {
    const userId = getUserId();
    return getUsername(userId) || `مستخدم ${userId.substring(0, 4)}`;
};

export const getAllUserProfiles = (): Record<string, string> => {
    return getUserProfiles();
};
