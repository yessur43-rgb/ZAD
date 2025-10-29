// FIX: Removed unused types `CommunityTip` and `TipCategory` as they are not defined in `types.ts`.
import { HistoryItem, GeminiResponse } from '../types';

// FIX: Removed unused "Community Tip" functions. The functionality seems to have been replaced by the "Community Hub" feature, which is handled in `services/communityService.ts`.

// --- START: Scan History Functions ---

const SCAN_HISTORY_KEY = 'scanHistory';

/**
 * Retrieves the user's scan history from localStorage.
 * @returns An array of HistoryItem, sorted by most recent first.
 */
export const getScanHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(SCAN_HISTORY_KEY);
        if (historyJson) {
            const history: HistoryItem[] = JSON.parse(historyJson);
            // Sort by timestamp descending to show the most recent first
            return history.sort((a, b) => b.timestamp - a.timestamp);
        }
    } catch (error) {
        console.error('Failed to retrieve scan history:', error);
    }
    return [];
};

/**
 * Saves a new item to the user's scan history.
 * @param item The item to save, without id and timestamp.
 */
export const saveScanHistoryItem = (item: { type: 'image' | 'barcode'; identifier: string; result: GeminiResponse; }): void => {
    try {
        const currentHistory = getScanHistory();
        const newHistoryItem: HistoryItem = {
            ...item,
            id: `${Date.now()}-${Math.random()}`, // Simple unique ID
            timestamp: Date.now(),
        };

        // Prepend new item and limit history to 50 items to prevent excessive storage usage.
        const updatedHistory = [newHistoryItem, ...currentHistory].slice(0, 50);

        localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Failed to save scan history item:', error);
    }
};


/**
 * Clears the entire scan history from localStorage.
 */
export const clearScanHistory = (): void => {
    try {
        localStorage.removeItem(SCAN_HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear scan history:', error);
    }
};

// --- END: Scan History Functions ---
