import { HistoryItem, CommunityTip, TipCategory } from '../types';

const HISTORY_KEY = 'halalScanHistory';
const COMMUNITY_TIPS_KEY_PREFIX = 'communityTips_';

// --- START: Scan History Functions ---

export const getScanHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson) {
      // Sort by most recent first
      return JSON.parse(historyJson).sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp);
    }
  } catch (error) {
    console.error('Failed to retrieve scan history:', error);
  }
  return [];
};

export const saveScanToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>): void => {
  try {
    const history = getScanHistory();
    const newHistoryItem: HistoryItem = {
      ...item,
      id: new Date().toISOString(),
      timestamp: Date.now(),
    };
    // Add new item to the beginning of the array
    const updatedHistory = [newHistoryItem, ...history];
    // Limit history to 50 items to prevent excessive storage usage
    if (updatedHistory.length > 50) {
        updatedHistory.pop();
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save scan to history:', error);
  }
};

export const clearScanHistory = (): void => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear scan history:', error);
    }
};

// --- END: Scan History Functions ---

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
