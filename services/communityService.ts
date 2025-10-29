import { Community, CommunityPost, Attachment } from '../types';

const ADMIN_PASSWORD = 'nashmi43';
const COMMUNITIES_KEY = 'zad_communities';
const BANNED_USERS_KEY = 'zad_banned_users';

// --- Helper Functions ---
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getCommunities = (): Community[] => {
    try {
        const stored = localStorage.getItem(COMMUNITIES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to get communities from localStorage", e);
        return [];
    }
};

const saveCommunities = (communities: Community[]): void => {
    try {
        localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(communities));
    } catch (e) {
        console.error("Failed to save communities to localStorage", e);
    }
};

// --- Password ---
export const checkAdminPassword = (password: string): boolean => {
    return password === ADMIN_PASSWORD;
};

// --- Community Management ---
export const addCommunity = (name: string, description: string, creatorId: string): Community => {
    const communities = getCommunities();
    const newCommunity: Community = {
        id: generateId(),
        name,
        description,
        creatorId,
        posts: [],
    };
    communities.unshift(newCommunity);
    saveCommunities(communities);
    return newCommunity;
};

export const deleteCommunity = (communityId: string): void => {
    let communities = getCommunities();
    communities = communities.filter(c => c.id !== communityId);
    saveCommunities(communities);
};

// --- Post Management ---
export const addPostToCommunity = (communityId: string, content: string, authorId: string, attachments?: Attachment[], location?: CommunityPost['location']): CommunityPost | null => {
    const communities = getCommunities();
    const community = communities.find(c => c.id === communityId);
    if (!community) return null;

    const newPost: CommunityPost = {
        id: generateId(),
        content,
        authorId,
        timestamp: Date.now(),
        attachments: attachments || [],
        location: location
    };

    community.posts.unshift(newPost);
    saveCommunities(communities);
    return newPost;
};


export const deletePost = (communityId: string, postId: string): void => {
    const communities = getCommunities();
    const community = communities.find(c => c.id === communityId);
    if (community) {
        community.posts = community.posts.filter(p => p.id !== postId);
        saveCommunities(communities);
    }
};

// --- Attachment Management ---
export const deleteAttachment = (communityId: string, postId: string, attachmentId: string): void => {
    const communities = getCommunities();
    const community = communities.find(c => c.id === communityId);
    if (community) {
        const post = community.posts.find(p => p.id === postId);
        if (post && post.attachments) {
            post.attachments = post.attachments.filter(a => a.id !== attachmentId);
            saveCommunities(communities);
        }
    }
};


// --- Banned Users Management ---
export const getBannedUsers = (): string[] => {
    try {
        const stored = localStorage.getItem(BANNED_USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to get banned users", e);
        return [];
    }
};

const saveBannedUsers = (bannedUsers: string[]): void => {
    try {
        localStorage.setItem(BANNED_USERS_KEY, JSON.stringify(bannedUsers));
    } catch (e) {
        console.error("Failed to save banned users", e);
    }
};

export const isUserBanned = (userId: string): boolean => {
    return getBannedUsers().includes(userId);
};

export const banUser = (userId: string): void => {
    const bannedUsers = getBannedUsers();
    if (!bannedUsers.includes(userId)) {
        bannedUsers.push(userId);
        saveBannedUsers(bannedUsers);
    }
};

export const unbanUser = (userId: string): void => {
    let bannedUsers = getBannedUsers();
    bannedUsers = bannedUsers.filter(id => id !== userId);
    saveBannedUsers(bannedUsers);
};

// --- Export the getter for components to use ---
export { getCommunities };