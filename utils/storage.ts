import { CommunityTip, TipCategory, HistoryItem, GeminiResponse } from '../types';

const COMMUNITY_TIPS_KEY_PREFIX = 'communityTips_';

// --- START: Community Tip Functions ---

export const getCommunityTips = (location: string): CommunityTip[] => {
    const key = `${COMMUNITY_TIPS_KEY_PREFIX}${location.toLowerCase().trim()}`;
    try {
        const tipsJson = localStorage.getItem(key);
        if (tipsJson) {
            const tips: CommunityTip[] = JSON.parse(tipsJson);
            // Sort by upvotes desc, then by timestamp desc
            return tips.sort((a, b) => b.upvotes - a.upvotes || b.timestamp - a.timestamp);
        }
    } catch (error) {
        console.error('Failed to retrieve community tips:', error);
    }
    return [];
};

const saveTipsForLocation = (location: string, tips: CommunityTip[]): void => {
    const key = `${COMMUNITY_TIPS_KEY_PREFIX}${location.toLowerCase().trim()}`;
    try {
        localStorage.setItem(key, JSON.stringify(tips));
    } catch (error) {
        console.error('Failed to save community tips:', error);
    }
};

export const saveCommunityTip = (location: string, content: string, category: TipCategory): CommunityTip[] => {
    const currentTips = getCommunityTips(location);
    const newTip: CommunityTip = {
        id: new Date().toISOString(),
        content,
        category,
        timestamp: Date.now(),
        upvotes: 0,
    };
    const updatedTips = [newTip, ...currentTips];
    saveTipsForLocation(location, updatedTips);
    return updatedTips;
};

export const upvoteCommunityTip = (location: string, tipId: string): CommunityTip[] => {
    const currentTips = getCommunityTips(location);
    const tipIndex = currentTips.findIndex(tip => tip.id === tipId);
    if (tipIndex > -1) {
        currentTips[tipIndex].upvotes += 1;
        saveTipsForLocation(location, currentTips);
        // Return a new sorted array to trigger re-renders in React components
        return [...currentTips].sort((a, b) => b.upvotes - a.upvotes || b.timestamp - a.timestamp);
    }
    return currentTips;
};

// --- END: Community Tip Functions ---

// FIX: Add scan history management functions
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