import { TelegramChat, TelegramMessage, TelegramStory, MessageType, ChatType, MessageReaction, StoryView } from '../types';
import { getUserId, getUserName } from './userService';

const CHATS_KEY = 'telegram_chats';
const MESSAGES_KEY = 'telegram_messages';
const STORIES_KEY = 'telegram_stories';

// ========================================
// HELPER FUNCTIONS
// ========================================

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getCurrentUserId = (): string => getUserId();

const getCurrentUserName = (): string => getUserName();

// ========================================
// CHAT OPERATIONS
// ========================================

export const getAllChats = (): TelegramChat[] => {
  try {
    const stored = localStorage.getItem(CHATS_KEY);
    if (!stored) return [];
    const chats: TelegramChat[] = JSON.parse(stored);

    // Filter chats where current user is a participant
    const currentUserId = getCurrentUserId();
    return chats.filter(chat => chat.participants.includes(currentUserId));
  } catch (error) {
    console.error('Error getting chats:', error);
    return [];
  }
};

export const getChatById = (chatId: string): TelegramChat | null => {
  const chats = getAllChats();
  return chats.find(chat => chat.id === chatId) || null;
};

export const createChat = (
  type: ChatType,
  name: string,
  participantIds: string[],
  description?: string,
  avatar?: string
): TelegramChat => {
  const currentUserId = getCurrentUserId();

  const newChat: TelegramChat = {
    id: generateId(),
    type,
    name,
    description,
    avatar,
    participants: [currentUserId, ...participantIds],
    admins: [currentUserId],
    createdBy: currentUserId,
    createdAt: Date.now(),
    unreadCount: {},
    pinnedMessageIds: [],
    mutedBy: [],
    typingUsers: []
  };

  // Initialize unread counts
  newChat.participants.forEach(userId => {
    newChat.unreadCount[userId] = 0;
  });

  const chats = getAllChats();
  chats.push(newChat);
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));

  console.log('✅ Chat created:', newChat.name);
  return newChat;
};

export const updateChat = (chatId: string, updates: Partial<TelegramChat>): void => {
  const allChats = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
  const index = allChats.findIndex((c: TelegramChat) => c.id === chatId);

  if (index !== -1) {
    allChats[index] = { ...allChats[index], ...updates };
    localStorage.setItem(CHATS_KEY, JSON.stringify(allChats));
  }
};

export const deleteChat = (chatId: string): void => {
  const chats = getAllChats().filter(chat => chat.id !== chatId);
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));

  // Also delete all messages in this chat
  const messages = getAllMessages().filter(msg => msg.chatId !== chatId);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  console.log('❌ Chat deleted:', chatId);
};

export const leaveChat = (chatId: string): void => {
  const chat = getChatById(chatId);
  if (!chat) return;

  const currentUserId = getCurrentUserId();
  const updatedParticipants = chat.participants.filter(id => id !== currentUserId);

  if (updatedParticipants.length === 0) {
    // If no participants left, delete the chat
    deleteChat(chatId);
  } else {
    updateChat(chatId, { participants: updatedParticipants });
  }
};

export const markChatAsRead = (chatId: string): void => {
  const chat = getChatById(chatId);
  if (!chat) return;

  const currentUserId = getCurrentUserId();
  chat.unreadCount[currentUserId] = 0;
  updateChat(chatId, { unreadCount: chat.unreadCount });
};

// ========================================
// MESSAGE OPERATIONS
// ========================================

export const getAllMessages = (): TelegramMessage[] => {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const getMessagesByChat = (chatId: string): TelegramMessage[] => {
  return getAllMessages()
    .filter(msg => msg.chatId === chatId)
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const sendMessage = (
  chatId: string,
  type: MessageType,
  content: string,
  replyToId?: string,
  fileName?: string,
  fileSize?: number,
  location?: { name: string; lat: number; lon: number }
): TelegramMessage => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();
  const chat = getChatById(chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  const newMessage: TelegramMessage = {
    id: generateId(),
    chatId,
    senderId: currentUserId,
    senderName: currentUserName,
    type,
    content,
    fileName,
    fileSize,
    location,
    replyToId,
    reactions: [],
    timestamp: Date.now(),
    isRead: false,
    isEdited: false,
    deliveredTo: [currentUserId],
    readBy: [currentUserId]
  };

  const messages = getAllMessages();
  messages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  // Update chat's last message
  const shortContent = type === 'text' ? content.substring(0, 50) :
                       type === 'image' ? '📷 صورة' :
                       type === 'file' ? `📎 ${fileName || 'ملف'}` :
                       type === 'location' ? '📍 موقع' :
                       '🎵 صوت';

  updateChat(chatId, {
    lastMessageId: newMessage.id,
    lastMessageText: shortContent,
    lastMessageTime: newMessage.timestamp
  });

  // Increment unread count for other participants
  const updatedUnreadCount = { ...chat.unreadCount };
  chat.participants.forEach(userId => {
    if (userId !== currentUserId) {
      updatedUnreadCount[userId] = (updatedUnreadCount[userId] || 0) + 1;
    }
  });
  updateChat(chatId, { unreadCount: updatedUnreadCount });

  console.log('✅ Message sent:', newMessage.id);
  return newMessage;
};

export const editMessage = (messageId: string, newContent: string): void => {
  const messages = getAllMessages();
  const index = messages.findIndex(msg => msg.id === messageId);

  if (index !== -1) {
    messages[index].content = newContent;
    messages[index].isEdited = true;
    messages[index].editedAt = Date.now();
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    console.log('✏️ Message edited:', messageId);
  }
};

export const deleteMessage = (messageId: string): void => {
  const messages = getAllMessages().filter(msg => msg.id !== messageId);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  console.log('❌ Message deleted:', messageId);
};

export const addReaction = (messageId: string, emoji: string): void => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();
  const messages = getAllMessages();
  const index = messages.findIndex(msg => msg.id === messageId);

  if (index !== -1) {
    const message = messages[index];

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.findIndex(
      r => r.userId === currentUserId && r.emoji === emoji
    );

    if (existingReaction !== -1) {
      // Remove reaction if already exists
      message.reactions.splice(existingReaction, 1);
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        userId: currentUserId,
        userName: currentUserName,
        timestamp: Date.now()
      });
    }

    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    console.log('💝 Reaction added:', emoji);
  }
};

export const markMessageAsRead = (messageId: string): void => {
  const currentUserId = getCurrentUserId();
  const messages = getAllMessages();
  const index = messages.findIndex(msg => msg.id === messageId);

  if (index !== -1) {
    const message = messages[index];
    if (!message.readBy.includes(currentUserId)) {
      message.readBy.push(currentUserId);
      message.isRead = true;
    }
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }
};

// ========================================
// STORY OPERATIONS
// ========================================

export const getAllStories = (): TelegramStory[] => {
  try {
    const stored = localStorage.getItem(STORIES_KEY);
    const stories: TelegramStory[] = stored ? JSON.parse(stored) : [];

    // Filter expired stories
    const now = Date.now();
    const activeStories = stories.filter(story => story.expiresAt > now);

    // Update storage if we filtered any
    if (activeStories.length !== stories.length) {
      localStorage.setItem(STORIES_KEY, JSON.stringify(activeStories));
    }

    return activeStories.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting stories:', error);
    return [];
  }
};

export const getStoriesByUser = (userId: string): TelegramStory[] => {
  return getAllStories().filter(story => story.userId === userId);
};

export const createStory = (
  mediaUrl: string,
  type: 'image' | 'video',
  caption?: string
): TelegramStory => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  const newStory: TelegramStory = {
    id: generateId(),
    userId: currentUserId,
    userName: currentUserName,
    mediaUrl,
    type,
    caption,
    viewedBy: [],
    reactions: [],
    timestamp: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };

  try {
    const stories = getAllStories();
    stories.push(newStory);
    const storiesJson = JSON.stringify(stories);

    console.log('💾 Saving story. Total stories:', stories.length, 'Data size:', storiesJson.length, 'characters');

    localStorage.setItem(STORIES_KEY, storiesJson);

    // Verify it was saved
    const saved = localStorage.getItem(STORIES_KEY);
    if (!saved) {
      throw new Error('Story was not saved to localStorage!');
    }

    console.log('✅ Story created successfully:', newStory.id);
    return newStory;
  } catch (error) {
    console.error('❌ Error creating story:', error);
    // If localStorage is full, try to clean up old stories and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded. Cleaning old stories...');

      // Get only stories from last 12 hours
      const stories = getAllStories();
      const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
      const recentStories = stories.filter(s => s.timestamp > twelveHoursAgo);
      recentStories.push(newStory);

      try {
        localStorage.setItem(STORIES_KEY, JSON.stringify(recentStories));
        console.log('✅ Story saved after cleanup. Stories:', recentStories.length);
        return newStory;
      } catch (retryError) {
        console.error('❌ Failed to save story even after cleanup:', retryError);
        throw new Error('تعذر حفظ القصة. المساحة المتاحة ممتلئة.');
      }
    }
    throw error;
  }
};

export const viewStory = (storyId: string): void => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();
  const stories = getAllStories();
  const index = stories.findIndex(story => story.id === storyId);

  if (index !== -1) {
    const story = stories[index];

    // Check if already viewed
    if (!story.viewedBy.find(v => v.userId === currentUserId)) {
      story.viewedBy.push({
        userId: currentUserId,
        userName: currentUserName,
        viewedAt: Date.now()
      });
      localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    }
  }
};

export const addStoryReaction = (storyId: string, emoji: string): void => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();
  const stories = getAllStories();
  const index = stories.findIndex(story => story.id === storyId);

  if (index !== -1) {
    const story = stories[index];

    // Remove existing reaction from this user if exists
    story.reactions = story.reactions.filter(r => r.userId !== currentUserId);

    // Add new reaction
    story.reactions.push({
      emoji,
      userId: currentUserId,
      userName: currentUserName,
      timestamp: Date.now()
    });

    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    console.log('💝 Story reaction added:', emoji);
  }
};

export const deleteStory = (storyId: string): void => {
  const stories = getAllStories().filter(story => story.id !== storyId);
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  console.log('❌ Story deleted:', storyId);
};

// ========================================
// SEARCH & UTILITY
// ========================================

export const searchChats = (query: string): TelegramChat[] => {
  const lowerQuery = query.toLowerCase();
  return getAllChats().filter(chat =>
    chat.name.toLowerCase().includes(lowerQuery) ||
    chat.description?.toLowerCase().includes(lowerQuery)
  );
};

export const getUnreadChatsCount = (): number => {
  const currentUserId = getCurrentUserId();
  return getAllChats().filter(chat => (chat.unreadCount[currentUserId] || 0) > 0).length;
};

export const clearAllData = (): void => {
  localStorage.removeItem(CHATS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
  localStorage.removeItem(STORIES_KEY);
  console.log('🗑️ All Telegram data cleared');
};
