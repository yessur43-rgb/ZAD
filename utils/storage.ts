import { HistoryItem, CommunityTip, TipCategory } from '../types';

const HISTORY_KEY = 'halalScanHistory';
const COMMUNITY_TIPS_KEY = 'communityHubTips';


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


// --- START: Community Hub Functions ---

const normalizeLocation = (location: string) => location.trim().toLowerCase();

export const getCommunityTips = (location: string): CommunityTip[] => {
    const locationKey = normalizeLocation(location);
    if (!locationKey) return [];
    try {
        const allTipsData = localStorage.getItem(COMMUNITY_TIPS_KEY);
        const allTips: Record<string, CommunityTip[]> = allTipsData ? JSON.parse(allTipsData) : {};
        return (allTips[locationKey] || []).sort((a, b) => b.upvotes - a.upvotes || b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Failed to retrieve community tips:', error);
        return [];
    }
};

export const saveCommunityTip = (location: string, content: string, category: TipCategory): CommunityTip[] => {
    const locationKey = normalizeLocation(location);
    const newTip: CommunityTip = {
        id: Date.now().toString(),
        content,
        category,
        upvotes: 0,
        timestamp: Date.now(),
    };

    try {
        const allTipsData = localStorage.getItem(COMMUNITY_TIPS_KEY);
        const allTips: Record<string, CommunityTip[]> = allTipsData ? JSON.parse(allTipsData) : {};
        const locationTips = allTips[locationKey] || [];
        const updatedTips = [newTip, ...locationTips];
        allTips[locationKey] = updatedTips;
        localStorage.setItem(COMMUNITY_TIPS_KEY, JSON.stringify(allTips));
        return updatedTips.sort((a, b) => b.upvotes - a.upvotes || b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Failed to save community tip:', error);
        return getCommunityTips(location);
    }
};

export const upvoteCommunityTip = (location: string, tipId: string): CommunityTip[] => {
    const locationKey = normalizeLocation(location);
    try {
        const allTipsData = localStorage.getItem(COMMUNITY_TIPS_KEY);
        const allTips: Record<string, CommunityTip[]> = allTipsData ? JSON.parse(allTipsData) : {};
        const locationTips = allTips[locationKey] || [];
        const tipIndex = locationTips.findIndex(t => t.id === tipId);

        if (tipIndex > -1) {
            locationTips[tipIndex].upvotes += 1;
            allTips[locationKey] = locationTips;
            localStorage.setItem(COMMUNITY_TIPS_KEY, JSON.stringify(allTips));
        }
        return locationTips.sort((a, b) => b.upvotes - a.upvotes || b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Failed to upvote tip:', error);
        return getCommunityTips(location);
    }
};
// --- END: Community Hub Functions ---
