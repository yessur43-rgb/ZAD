const PERMISSIONS_REQUESTED_KEY = 'zad_permissions_requested';

/**
 * Checks if the permission gate has been shown to the user before.
 * @returns True if the gate has been shown, false otherwise.
 */
export const havePermissionsBeenRequested = (): boolean => {
    try {
        return localStorage.getItem(PERMISSIONS_REQUESTED_KEY) === 'true';
    } catch (error) {
        console.error("Failed to read permission status from localStorage:", error);
        return false;
    }
};

/**
 * Marks that the permission gate has been shown to the user.
 */
export const markPermissionsAsRequested = (): void => {
    try {
        localStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
    } catch (error) {
        console.error("Failed to save permission status to localStorage:", error);
    }
};