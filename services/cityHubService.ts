import { CityHub, CityUpdate, UpdateType, UpdatePriority } from '../types';

const CITY_HUBS_KEY = 'zad_city_hubs';
const UPDATE_EXPIRY_HOURS = 48; // Updates expire after 48 hours by default

// --- Helper Functions ---
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getCityHubs = (): CityHub[] => {
  try {
    const stored = localStorage.getItem(CITY_HUBS_KEY);
    if (!stored) {
      return getDefaultCityHubs();
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return getDefaultCityHubs();
  } catch (e) {
    console.error("Failed to get city hubs", e);
    return getDefaultCityHubs();
  }
};

const saveCityHubs = (hubs: CityHub[]): void => {
  try {
    localStorage.setItem(CITY_HUBS_KEY, JSON.stringify(hubs));
  } catch (e) {
    console.error("Failed to save city hubs", e);
  }
};

// --- Default City Hubs ---
const getDefaultCityHubs = (): CityHub[] => {
  const now = Date.now();
  return [
    {
      id: generateId(),
      city: 'باريس',
      country: 'فرنسا',
      description: 'مدينة الأنوار - مركز للسياح والمسافرين',
      updates: [],
      activeStories: [],
      members: [],
      moderators: [],
      createdAt: now,
      lastActivityAt: now
    },
    {
      id: generateId(),
      city: 'لندن',
      country: 'بريطانيا',
      description: 'العاصمة البريطانية - وجهة سياحية عالمية',
      updates: [],
      activeStories: [],
      members: [],
      moderators: [],
      createdAt: now,
      lastActivityAt: now
    },
    {
      id: generateId(),
      city: 'دبي',
      country: 'الإمارات',
      description: 'مدينة المستقبل - وجهة فاخرة ومميزة',
      updates: [],
      activeStories: [],
      members: [],
      moderators: [],
      createdAt: now,
      lastActivityAt: now
    },
    {
      id: generateId(),
      city: 'طوكيو',
      country: 'اليابان',
      description: 'عاصمة التكنولوجيا والثقافة اليابانية',
      updates: [],
      activeStories: [],
      members: [],
      moderators: [],
      createdAt: now,
      lastActivityAt: now
    },
    {
      id: generateId(),
      city: 'اسطنبول',
      country: 'تركيا',
      description: 'ملتقى الشرق والغرب - تاريخ وثقافة',
      updates: [],
      activeStories: [],
      members: [],
      moderators: [],
      createdAt: now,
      lastActivityAt: now
    }
  ];
};

// --- City Hub Management ---
export const createCityHub = (
  city: string,
  country: string,
  description: string,
  creatorId: string
): CityHub => {
  const hubs = getCityHubs();
  const now = Date.now();

  const newHub: CityHub = {
    id: generateId(),
    city,
    country,
    description,
    updates: [],
    activeStories: [],
    members: [creatorId],
    moderators: [creatorId],
    createdAt: now,
    lastActivityAt: now
  };

  hubs.unshift(newHub);
  saveCityHubs(hubs);
  return newHub;
};

export const deleteCityHub = (hubId: string, userId: string): boolean => {
  let hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub || !hub.moderators.includes(userId)) {
    return false;
  }

  hubs = hubs.filter(h => h.id !== hubId);
  saveCityHubs(hubs);
  return true;
};

export const joinCityHub = (hubId: string, userId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return false;

  if (!hub.members.includes(userId)) {
    hub.members.push(userId);
    hub.lastActivityAt = Date.now();
    saveCityHubs(hubs);
  }

  return true;
};

export const leaveCityHub = (hubId: string, userId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return false;

  hub.members = hub.members.filter(id => id !== userId);
  saveCityHubs(hubs);
  return true;
};

// --- Update Management ---
export const addUpdate = (
  hubId: string,
  authorId: string,
  type: UpdateType,
  title: string,
  content: string,
  priority: UpdatePriority = 'low',
  location?: string,
  image?: string,
  expiryHours: number = UPDATE_EXPIRY_HOURS
): CityUpdate | null => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return null;

  const now = Date.now();
  const newUpdate: CityUpdate = {
    id: generateId(),
    type,
    title,
    content,
    priority,
    timestamp: now,
    expiresAt: now + (expiryHours * 60 * 60 * 1000),
    authorId,
    location,
    image,
    upvotes: [],
    downvotes: []
  };

  hub.updates.unshift(newUpdate);
  hub.lastActivityAt = now;

  // Auto-cleanup expired updates
  cleanupExpiredUpdates(hubId);

  saveCityHubs(hubs);
  return newUpdate;
};

export const deleteUpdate = (hubId: string, updateId: string, userId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return false;

  const update = hub.updates.find(u => u.id === updateId);
  if (!update) return false;

  // Only author or moderators can delete
  if (update.authorId !== userId && !hub.moderators.includes(userId)) {
    return false;
  }

  hub.updates = hub.updates.filter(u => u.id !== updateId);
  saveCityHubs(hubs);
  return true;
};

export const upvoteUpdate = (hubId: string, updateId: string, userId: string): void => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return;

  const update = hub.updates.find(u => u.id === updateId);
  if (!update) return;

  // Remove from downvotes if exists
  update.downvotes = update.downvotes.filter(id => id !== userId);

  // Toggle upvote
  if (update.upvotes.includes(userId)) {
    update.upvotes = update.upvotes.filter(id => id !== userId);
  } else {
    update.upvotes.push(userId);
  }

  saveCityHubs(hubs);
};

export const downvoteUpdate = (hubId: string, updateId: string, userId: string): void => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return;

  const update = hub.updates.find(u => u.id === updateId);
  if (!update) return;

  // Remove from upvotes if exists
  update.upvotes = update.upvotes.filter(id => id !== userId);

  // Toggle downvote
  if (update.downvotes.includes(userId)) {
    update.downvotes = update.downvotes.filter(id => id !== userId);
  } else {
    update.downvotes.push(userId);
  }

  saveCityHubs(hubs);
};

// --- Story Association ---
export const addStoryToHub = (hubId: string, storyId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return false;

  if (!hub.activeStories.includes(storyId)) {
    hub.activeStories.unshift(storyId);
    hub.lastActivityAt = Date.now();
    saveCityHubs(hubs);
  }

  return true;
};

export const removeStoryFromHub = (hubId: string, storyId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return false;

  hub.activeStories = hub.activeStories.filter(id => id !== storyId);
  saveCityHubs(hubs);
  return true;
};

// --- Get Functions ---
export const getCityHubById = (hubId: string): CityHub | null => {
  return getCityHubs().find(h => h.id === hubId) || null;
};

export const getCityHubByName = (city: string, country?: string): CityHub | null => {
  const hubs = getCityHubs();
  return hubs.find(h => {
    const cityMatch = h.city.toLowerCase() === city.toLowerCase();
    if (country) {
      return cityMatch && h.country.toLowerCase() === country.toLowerCase();
    }
    return cityMatch;
  }) || null;
};

export const searchCityHubs = (query: string): CityHub[] => {
  const lowerQuery = query.toLowerCase();
  return getCityHubs().filter(h =>
    h.city.toLowerCase().includes(lowerQuery) ||
    h.country.toLowerCase().includes(lowerQuery) ||
    h.description.toLowerCase().includes(lowerQuery)
  );
};

export const getActiveUpdates = (hubId: string): CityUpdate[] => {
  const hub = getCityHubById(hubId);
  if (!hub) return [];

  const now = Date.now();
  return hub.updates.filter(u => u.expiresAt > now);
};

export const getUpdatesByType = (hubId: string, type: UpdateType): CityUpdate[] => {
  const hub = getCityHubById(hubId);
  if (!hub) return [];

  const now = Date.now();
  return hub.updates.filter(u => u.type === type && u.expiresAt > now);
};

export const getUrgentUpdates = (hubId: string): CityUpdate[] => {
  const hub = getCityHubById(hubId);
  if (!hub) return [];

  const now = Date.now();
  return hub.updates.filter(u =>
    (u.priority === 'high' || u.priority === 'urgent') && u.expiresAt > now
  );
};

// --- Moderator Management ---
export const addModerator = (hubId: string, userId: string, currentModeratorId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub || !hub.moderators.includes(currentModeratorId)) {
    return false;
  }

  if (!hub.moderators.includes(userId)) {
    hub.moderators.push(userId);
    saveCityHubs(hubs);
  }

  return true;
};

export const removeModerator = (hubId: string, userId: string, currentModeratorId: string): boolean => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub || !hub.moderators.includes(currentModeratorId)) {
    return false;
  }

  hub.moderators = hub.moderators.filter(id => id !== userId);
  saveCityHubs(hubs);
  return true;
};

// --- Cleanup ---
export const cleanupExpiredUpdates = (hubId: string): number => {
  const hubs = getCityHubs();
  const hub = hubs.find(h => h.id === hubId);

  if (!hub) return 0;

  const now = Date.now();
  const beforeCount = hub.updates.length;
  hub.updates = hub.updates.filter(u => u.expiresAt > now);
  const removed = beforeCount - hub.updates.length;

  if (removed > 0) {
    saveCityHubs(hubs);
  }

  return removed;
};

export const cleanupAllExpiredUpdates = (): number => {
  const hubs = getCityHubs();
  let totalRemoved = 0;

  hubs.forEach(hub => {
    const now = Date.now();
    const beforeCount = hub.updates.length;
    hub.updates = hub.updates.filter(u => u.expiresAt > now);
    totalRemoved += (beforeCount - hub.updates.length);
  });

  if (totalRemoved > 0) {
    saveCityHubs(hubs);
  }

  return totalRemoved;
};

// Export the getter
export { getCityHubs };
