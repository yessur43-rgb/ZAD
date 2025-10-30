import { MySpaceEntry, EntryCategory, MySpaceStats, EntryLocation } from '../types';
import { getUserId } from './userService';

const ENTRIES_KEY = 'myspace_entries';

// ========================================
// HELPER FUNCTIONS
// ========================================

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getCurrentUserId = (): string => getUserId();

// ========================================
// ENTRY OPERATIONS
// ========================================

export const getAllEntries = (): MySpaceEntry[] => {
  try {
    const userId = getCurrentUserId();
    const stored = localStorage.getItem(`${ENTRIES_KEY}_${userId}`);
    if (!stored) return [];
    const entries: MySpaceEntry[] = JSON.parse(stored);
    console.log('📖 Retrieved entries:', entries.length);
    return entries.sort((a, b) => b.date - a.date); // newest first
  } catch (error) {
    console.error('❌ Error getting entries:', error);
    return [];
  }
};

export const getEntriesByCategory = (category: EntryCategory): MySpaceEntry[] => {
  return getAllEntries().filter(entry => entry.category === category);
};

export const getEntryById = (entryId: string): MySpaceEntry | null => {
  const entries = getAllEntries();
  return entries.find(entry => entry.id === entryId) || null;
};

export const createEntry = (
  category: EntryCategory,
  title: string,
  description: string,
  images: string[],
  location?: EntryLocation,
  rating?: number,
  notes?: string,
  aiAnalysis?: MySpaceEntry['aiAnalysis'],
  tags?: string[]
): MySpaceEntry => {
  const userId = getCurrentUserId();

  const newEntry: MySpaceEntry = {
    id: generateId(),
    category,
    title,
    description,
    images,
    location,
    date: Date.now(),
    rating,
    notes,
    aiAnalysis,
    tags,
    isFavorite: false
  };

  const entries = getAllEntries();
  entries.push(newEntry);
  localStorage.setItem(`${ENTRIES_KEY}_${userId}`, JSON.stringify(entries));

  console.log('✅ Entry created:', newEntry.title, '| Category:', category);
  return newEntry;
};

export const updateEntry = (entryId: string, updates: Partial<MySpaceEntry>): void => {
  const userId = getCurrentUserId();
  const entries = getAllEntries();
  const index = entries.findIndex(entry => entry.id === entryId);

  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    localStorage.setItem(`${ENTRIES_KEY}_${userId}`, JSON.stringify(entries));
    console.log('✅ Entry updated:', entryId);
  }
};

export const deleteEntry = (entryId: string): void => {
  const userId = getCurrentUserId();
  const entries = getAllEntries().filter(entry => entry.id !== entryId);
  localStorage.setItem(`${ENTRIES_KEY}_${userId}`, JSON.stringify(entries));
  console.log('❌ Entry deleted:', entryId);
};

export const toggleFavorite = (entryId: string): void => {
  const entry = getEntryById(entryId);
  if (entry) {
    updateEntry(entryId, { isFavorite: !entry.isFavorite });
  }
};

// ========================================
// SEARCH & FILTER
// ========================================

export const searchEntries = (query: string): MySpaceEntry[] => {
  const lowerQuery = query.toLowerCase();
  return getAllEntries().filter(entry =>
    entry.title.toLowerCase().includes(lowerQuery) ||
    entry.description.toLowerCase().includes(lowerQuery) ||
    entry.notes?.toLowerCase().includes(lowerQuery) ||
    entry.location?.name.toLowerCase().includes(lowerQuery) ||
    entry.location?.city?.toLowerCase().includes(lowerQuery) ||
    entry.location?.country?.toLowerCase().includes(lowerQuery) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getFavoriteEntries = (): MySpaceEntry[] => {
  return getAllEntries().filter(entry => entry.isFavorite);
};

export const getEntriesByLocation = (city?: string, country?: string): MySpaceEntry[] => {
  return getAllEntries().filter(entry => {
    if (city && entry.location?.city?.toLowerCase() === city.toLowerCase()) return true;
    if (country && entry.location?.country?.toLowerCase() === country.toLowerCase()) return true;
    return false;
  });
};

export const getEntriesByDateRange = (startDate: number, endDate: number): MySpaceEntry[] => {
  return getAllEntries().filter(entry => entry.date >= startDate && entry.date <= endDate);
};

// ========================================
// STATISTICS
// ========================================

export const getStats = (): MySpaceStats => {
  const entries = getAllEntries();

  const entriesByCategory: Record<EntryCategory, number> = {
    accommodation: 0,
    restaurants: 0,
    landmarks: 0,
    memories: 0,
    notes: 0,
    important: 0
  };

  const countriesSet = new Set<string>();
  const citiesSet = new Set<string>();
  let favoriteCount = 0;

  entries.forEach(entry => {
    entriesByCategory[entry.category]++;

    if (entry.location?.country) {
      countriesSet.add(entry.location.country);
    }

    if (entry.location?.city) {
      citiesSet.add(entry.location.city);
    }

    if (entry.isFavorite) {
      favoriteCount++;
    }
  });

  return {
    totalEntries: entries.length,
    entriesByCategory,
    countriesVisited: Array.from(countriesSet),
    citiesVisited: Array.from(citiesSet),
    favoriteCount,
    lastUpdated: Date.now()
  };
};

// ========================================
// EXPORT & IMPORT
// ========================================

export const exportEntries = (): string => {
  const entries = getAllEntries();
  return JSON.stringify(entries, null, 2);
};

export const importEntries = (jsonData: string): boolean => {
  try {
    const entries: MySpaceEntry[] = JSON.parse(jsonData);

    // Validate data
    if (!Array.isArray(entries)) {
      throw new Error('Invalid data format');
    }

    const userId = getCurrentUserId();
    const existingEntries = getAllEntries();

    // Merge with existing, avoiding duplicates by ID
    const existingIds = new Set(existingEntries.map(e => e.id));
    const newEntries = entries.filter(e => !existingIds.has(e.id));

    const merged = [...existingEntries, ...newEntries];
    localStorage.setItem(`${ENTRIES_KEY}_${userId}`, JSON.stringify(merged));

    console.log('✅ Imported', newEntries.length, 'new entries');
    return true;
  } catch (error) {
    console.error('❌ Error importing entries:', error);
    return false;
  }
};

// ========================================
// UTILITY
// ========================================

export const clearAllEntries = (): void => {
  const userId = getCurrentUserId();
  localStorage.removeItem(`${ENTRIES_KEY}_${userId}`);
  console.log('🗑️ All entries cleared');
};

export const getCategoryName = (category: EntryCategory): string => {
  const names: Record<EntryCategory, string> = {
    accommodation: 'السكن',
    restaurants: 'مطاعمي',
    landmarks: 'معالم زرتها',
    memories: 'ذكريات',
    notes: 'ملاحظات',
    important: 'مهم'
  };
  return names[category];
};

export const getCategoryIcon = (category: EntryCategory): string => {
  const icons: Record<EntryCategory, string> = {
    accommodation: '🏨',
    restaurants: '🍽️',
    landmarks: '🏛️',
    memories: '📸',
    notes: '📝',
    important: '⭐'
  };
  return icons[category];
};
