import { TravelStory, StoryHighlight, StoryReaction, StoryMedia } from '../types';

const STORIES_KEY = 'zad_travel_stories';
const HIGHLIGHTS_KEY = 'zad_story_highlights';
const STORY_EXPIRY_HOURS = 24;

// --- Helper Functions ---
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getStories = (): TravelStory[] => {
  try {
    const stored = localStorage.getItem(STORIES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      // Auto-cleanup expired stories
      const now = Date.now();
      const active = parsed.filter(story => story.expiresAt > now);
      if (active.length !== parsed.length) {
        saveStories(active);
      }
      return active;
    }
    return [];
  } catch (e) {
    console.error("Failed to get stories", e);
    return [];
  }
};

const saveStories = (stories: TravelStory[]): void => {
  try {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  } catch (e) {
    console.error("Failed to save stories", e);
  }
};

const getHighlights = (): StoryHighlight[] => {
  try {
    const stored = localStorage.getItem(HIGHLIGHTS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to get highlights", e);
    return [];
  }
};

const saveHighlights = (highlights: StoryHighlight[]): void => {
  try {
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
  } catch (e) {
    console.error("Failed to save highlights", e);
  }
};

// --- Story Management ---
export const createStory = (
  authorId: string,
  location: TravelStory['location'],
  media: StoryMedia[],
  caption?: string,
  category: TravelStory['category'] = 'general',
  tags: string[] = [],
  isPublic: boolean = true
): TravelStory => {
  const stories = getStories();
  const now = Date.now();
  const expiresAt = now + (STORY_EXPIRY_HOURS * 60 * 60 * 1000);

  const newStory: TravelStory = {
    id: generateId(),
    authorId,
    location,
    media,
    caption,
    timestamp: now,
    expiresAt,
    viewers: [],
    reactions: [],
    tags,
    category,
    isPublic
  };

  stories.unshift(newStory);
  saveStories(stories);
  return newStory;
};

export const deleteStory = (storyId: string, userId: string): boolean => {
  let stories = getStories();
  const story = stories.find(s => s.id === storyId);

  if (!story || story.authorId !== userId) {
    return false;
  }

  stories = stories.filter(s => s.id !== storyId);
  saveStories(stories);
  return true;
};

export const viewStory = (storyId: string, userId: string): void => {
  const stories = getStories();
  const story = stories.find(s => s.id === storyId);

  if (story && !story.viewers.includes(userId)) {
    story.viewers.push(userId);
    saveStories(stories);
  }
};

export const reactToStory = (storyId: string, userId: string, emoji: string): void => {
  const stories = getStories();
  const story = stories.find(s => s.id === storyId);

  if (!story) return;

  // Remove previous reaction from this user
  story.reactions = story.reactions.filter(r => r.userId !== userId);

  // Add new reaction
  story.reactions.push({
    emoji,
    userId,
    timestamp: Date.now()
  });

  saveStories(stories);
};

export const removeReaction = (storyId: string, userId: string): void => {
  const stories = getStories();
  const story = stories.find(s => s.id === storyId);

  if (!story) return;

  story.reactions = story.reactions.filter(r => r.userId !== userId);
  saveStories(stories);
};

// --- Get Stories with Filters ---
export const getAllActiveStories = (): TravelStory[] => {
  return getStories();
};

export const getStoriesByCity = (city: string): TravelStory[] => {
  return getStories().filter(story =>
    story.location.city.toLowerCase() === city.toLowerCase()
  );
};

export const getStoriesByUser = (userId: string): TravelStory[] => {
  return getStories().filter(story => story.authorId === userId);
};

export const getStoriesByCategory = (category: TravelStory['category']): TravelStory[] => {
  return getStories().filter(story => story.category === category);
};

export const getPublicStories = (): TravelStory[] => {
  return getStories().filter(story => story.isPublic);
};

export const getStoryById = (storyId: string): TravelStory | null => {
  return getStories().find(s => s.id === storyId) || null;
};

// --- Highlights Management ---
export const createHighlight = (
  userId: string,
  title: string,
  stories: TravelStory[],
  category: string,
  isPublic: boolean = true
): StoryHighlight => {
  const highlights = getHighlights();

  const newHighlight: StoryHighlight = {
    id: generateId(),
    userId,
    title,
    coverImage: stories[0]?.media[0]?.data || '',
    stories,
    createdAt: Date.now(),
    category,
    isPublic
  };

  highlights.unshift(newHighlight);
  saveHighlights(highlights);
  return newHighlight;
};

export const deleteHighlight = (highlightId: string, userId: string): boolean => {
  let highlights = getHighlights();
  const highlight = highlights.find(h => h.id === highlightId);

  if (!highlight || highlight.userId !== userId) {
    return false;
  }

  highlights = highlights.filter(h => h.id !== highlightId);
  saveHighlights(highlights);
  return true;
};

export const addStoryToHighlight = (highlightId: string, story: TravelStory, userId: string): boolean => {
  const highlights = getHighlights();
  const highlight = highlights.find(h => h.id === highlightId);

  if (!highlight || highlight.userId !== userId) {
    return false;
  }

  // Check if story already exists
  if (!highlight.stories.find(s => s.id === story.id)) {
    highlight.stories.push(story);
    saveHighlights(highlights);
  }

  return true;
};

export const getHighlightsByUser = (userId: string): StoryHighlight[] => {
  return getHighlights().filter(h => h.userId === userId);
};

export const getPublicHighlights = (): StoryHighlight[] => {
  return getHighlights().filter(h => h.isPublic);
};

export const getHighlightById = (highlightId: string): StoryHighlight | null => {
  return getHighlights().find(h => h.id === highlightId) || null;
};

// --- Story Statistics ---
export const getStoryStats = (storyId: string) => {
  const story = getStoryById(storyId);
  if (!story) return null;

  return {
    views: story.viewers.length,
    reactions: story.reactions.length,
    reactionsBreakdown: story.reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};

// --- Cleanup ---
export const cleanupExpiredStories = (): number => {
  const stories = getStories();
  const now = Date.now();
  const active = stories.filter(s => s.expiresAt > now);
  const removed = stories.length - active.length;

  if (removed > 0) {
    saveStories(active);
  }

  return removed;
};

// Export the getter
export { getStories, getHighlights };
