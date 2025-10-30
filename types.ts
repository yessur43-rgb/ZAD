// --- General & Location ---
export interface UserLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export type WeatherIconType = 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy';

// --- Gemini & API Responses ---

export type HalalStatusArabic = 'حلال' | 'حرام' | 'مجهول' | 'غير معلوم';
export type HalalStatus = 'Halal' | 'Haram' | 'Mushbooh' | 'Unknown';

export interface HealthPoint {
    'النوع': 'إيجابي' | 'سلبي' | 'معلومة';
    'نقطة': string;
}

export interface GeminiResponse {
    'الحالة': HalalStatusArabic;
    'السبب': string;
    'الأدلة': string[];
    'التقييم_الصحي'?: {
        'ملخص': string;
        'نقاط': HealthPoint[];
    };
}

// --- Chat & Places ---
export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    places?: Place[];
}

export interface Place {
    name: string;
    url: string;
    address?: string;
    rating?: number;
    userRatingsTotal?: number;
    location?: { latitude: number; longitude: number };
    phoneNumber?: string;
    priceLevel?: string;
    detailedHours?: string[];
    closingTime?: string;
    distance?: string;
    overview?: string; // Brief description of the place
}

export type SearchCategory = 'restaurants' | 'cafes' | 'shopping' | 'pharmacies' | 'attractions';

// --- Restaurant & Menu Analysis ---
export interface Dish {
    name: string;
    description: string;
}

export interface DishSuggestionResponse {
    dishes: Dish[];
    source_description: string;
}

export interface HalalHaramItem {
    name: string;
    note: string;
}

export interface HalalHaramListResponse {
    halalItems: HalalHaramItem[];
    haramOrMushboohItems: HalalHaramItem[];
    source_description: string;
}

export interface ParkingInfo {
    name: string;
    address: string;
    url?: string;
    distance_to_restaurant: string;
    pricing_details: string;
    parking_type: 'Garage' | 'Street' | 'Lot' | 'Unknown';
    notes?: string;
}

export interface ParkingSuggestionResponse {
    parkingSuggestions: ParkingInfo[];
}


// --- "Find It" Feature ---
export type FindItCategory = 'product' | 'vignette' | 'identify';

export interface FindItResponse {
    identifiedProduct: string;
    aiResponseText: string;
    places: Place[];
}

export interface VignettePrice {
    validity: string;
    price: string;
    vehicleType: string;
}

export interface VignetteEntryPoint {
    comingFrom: string;
    locations: string[];
}

export interface VignetteDetails {
    country: string;
    generalDescription: string;
    prices: VignettePrice[];
    purchaseLocations: string[];
    officialWebsite?: string;
    importantNotes: string[];
    entryPointExamples?: VignetteEntryPoint[];
}

export interface VignetteDetailsResponse {
    details: VignetteDetails;
    sources?: { title: string, uri: string }[];
}

export interface IdentificationResponse {
    name: string;
    description: string;
    address?: string;
    googleMapsUrl?: string;
}

// --- History ---
export interface HistoryItem {
    id: string;
    timestamp: number;
    type: 'image' | 'barcode';
    identifier: string;
    result: GeminiResponse;
}

// --- Activities Finder ---
export type ActivityStatus = 'مفتوح' | 'يغلق قريباً' | 'مغلق';

export interface Activity {
    name: string;
    description: string;
    category: string;
    address: string;
    price: string;
    operatingHours: Record<string, string> | string;
    status?: ActivityStatus;
    statusNote?: string;
    url?: string;
}

export interface ActivityResponse {
    activities: Activity[];
}

// --- Nearby Places for Map ---
export type PlaceCategory = 'restaurant' | 'cafe' | 'sight' | 'shop' | 'other';
export interface MapPlace {
    name: string;
    latitude: number;
    longitude: number;
    category: PlaceCategory;
    address?: string;
    rating?: number;
    url?: string;
}

export interface NearbyPlacesResponse {
    places: MapPlace[];
}


// --- Travel Planner ---
export type ActivityType = 'EAT' | 'SIGHTSEEING' | 'SHOPPING' | 'ACTIVITY' | 'TRAVEL' | 'PRAYER';

export interface Suggestion {
    name: string;
    suggestionDescription: string;
    address?: string;
    rating?: number;
    userRatingsTotal?: number;
    url?: string;
    halalAssurance?: string;
}

export interface TripFrameworkStep {
    timeOfDay: string;
    description: string;
    activityType: ActivityType;
    suggestions?: Suggestion[];
    chosenSuggestion?: Suggestion;
}

export interface ItineraryPlan {
    locationName: string;
    framework: TripFrameworkStep[];
}

// --- Phrase Translator ---
export interface Phrase {
    original: string;
    translated: string;
    phonetic: string;
}

export interface PhraseCategory {
    categoryName: string;
    phrases: Phrase[];
}

export interface CommonPhrasesResponse {
    languageName: string;
    langCode: string;
    categories: PhraseCategory[];
}

export interface PhraseTranslation {
    translated: string;
    phonetic: string;
}

// --- Travel Guide ---
export interface TravelGuideResponse {
    locationInfo: {
        city: string;
        country: string;
        generalDescription: string;
    };
    entryRequirements?: {
        visaInfo: string;
        customsNotes?: string[];
    };
    gettingAround: {
        publicTransport: string;
        taxisRideSharing?: string;
        carRental?: string;
    };
    money: {
        currency: string;
        tippingCulture: string;
        budgetTips?: string[];
    };
    connectivity: {
        simCards: string;
        wifi?: string;
    };
    healthAndSafety: {
        emergencyContacts: { service: string; number: string; note?: string }[];
        healthTips: string[];
        safetyNotes?: string[];
    };
    localCulture: {
        etiquette: string[];
        helpfulPhrases: { phrase: string; translation: string; pronunciation: string }[];
    };
    muslimTravelerInfo: {
        halalFoodAvailability: string;
        nearbyMosquesSuggestion: string;
        prayerTimesLink?: string;
    };
    practicalInfo: {
        powerPlugs: string;
        drinkingWater: string;
    };
}

// --- Community Hub ---
export interface Attachment {
  id: string;
  name: string;
  type: string; // 'image/jpeg', 'video/mp4', 'application/pdf'
  data: string; // base64 data url
}

export interface CommunityPost {
  id: string;
  authorId: string;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  location?: {
    name: string;
    lat: number;
    lon: number;
  };
}

export interface Community {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  posts: CommunityPost[];
}

// --- Travel Stories (Snapchat-style) ---
export type StoryCategory = 'food' | 'hotel' | 'activity' | 'tip' | 'warning' | 'transport' | 'general';

export interface StoryMedia {
  id: string;
  type: 'image' | 'video';
  data: string; // base64 or URL
  duration?: number; // for videos, in seconds
}

export interface StoryReaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

export interface TravelStory {
  id: string;
  authorId: string;
  location: {
    name: string;
    lat: number;
    lon: number;
    city: string;
    country: string;
  };
  media: StoryMedia[];
  caption?: string;
  timestamp: number;
  expiresAt: number; // 24 hours from creation
  viewers: string[]; // user IDs who viewed
  reactions: StoryReaction[];
  tags: string[]; // #food #sunset #budget
  category: StoryCategory;
  isPublic: boolean;
}

export interface StoryHighlight {
  id: string;
  userId: string;
  title: string;
  coverImage: string;
  stories: TravelStory[];
  createdAt: number;
  category: string;
  isPublic: boolean;
}

// --- City Hubs (Telegram Channels-style) ---
export type UpdatePriority = 'low' | 'medium' | 'high' | 'urgent';
export type UpdateType = 'tip' | 'warning' | 'event' | 'deal' | 'announcement';

export interface CityUpdate {
  id: string;
  type: UpdateType;
  title: string;
  content: string;
  priority: UpdatePriority;
  timestamp: number;
  expiresAt: number;
  authorId: string;
  location?: string;
  image?: string;
  upvotes: string[]; // user IDs
  downvotes: string[];
}

export interface CityHub {
  id: string;
  city: string;
  country: string;
  coverImage?: string;
  description: string;

  // Content
  updates: CityUpdate[];
  activeStories: string[]; // story IDs

  // Community
  members: string[]; // user IDs
  moderators: string[];
  createdAt: number;
  lastActivityAt: number;
}

// --- Quick Questions ---
export type QuestionCategory = 'food' | 'transport' | 'safety' | 'accommodation' | 'general';
export type QuestionStatus = 'active' | 'resolved' | 'expired';

export interface QuestionAnswer {
  id: string;
  userId: string;
  text: string;
  photos?: string[];
  helpful: string[]; // user IDs who found it helpful
  timestamp: number;
}

export interface QuickQuestion {
  id: string;
  askedBy: string;
  question: string;
  location: {
    city: string;
    lat: number;
    lon: number;
  };
  category: QuestionCategory;
  urgency: 'low' | 'high';
  timestamp: number;
  expiresAt: number; // 6 hours
  answers: QuestionAnswer[];
  bestAnswerId?: string; // chosen by asker
  status: QuestionStatus;
  tags: string[];
}

// --- Telegram-Style Chat System ---

export type ChatType = 'private' | 'group' | 'channel';
export type MessageType = 'text' | 'image' | 'file' | 'location' | 'audio';

export interface TelegramMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string; // text content or file URL/base64
  fileName?: string; // for files
  fileSize?: number; // for files in bytes
  location?: {
    name: string;
    lat: number;
    lon: number;
  };
  replyToId?: string; // message ID being replied to
  reactions: MessageReaction[];
  timestamp: number;
  isRead: boolean;
  isEdited: boolean;
  editedAt?: number;
  deliveredTo: string[]; // user IDs who received the message
  readBy: string[]; // user IDs who read the message
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface TelegramChat {
  id: string;
  type: ChatType;
  name: string;
  description?: string;
  avatar?: string; // base64 or URL
  participants: string[]; // user IDs
  admins: string[]; // user IDs with admin rights
  createdBy: string;
  createdAt: number;
  lastMessageId?: string;
  lastMessageText?: string;
  lastMessageTime?: number;
  unreadCount: Record<string, number>; // userId -> unread count
  pinnedMessageIds: string[];
  mutedBy: string[]; // user IDs who muted this chat
  isOnline?: boolean; // for private chats only
  lastSeen?: number; // for private chats only
  typingUsers: string[]; // user IDs currently typing
}

export interface TelegramStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaUrl: string; // base64 or URL
  type: 'image' | 'video';
  caption?: string;
  viewedBy: StoryView[];
  reactions: MessageReaction[];
  timestamp: number;
  expiresAt: number; // 24 hours
}

export interface StoryView {
  userId: string;
  userName: string;
  viewedAt: number;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  role: 'member' | 'admin' | 'owner';
  joinedAt: number;
  lastSeen?: number;
  isOnline?: boolean;
}

// --- MySpace (Personal Travel Journal) ---
export type EntryCategory = 'accommodation' | 'restaurants' | 'landmarks' | 'memories' | 'notes' | 'important';

export interface EntryLocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export interface MySpaceEntry {
  id: string;
  category: EntryCategory;
  title: string;
  description: string;
  images: string[]; // base64 compressed images
  location?: EntryLocation;
  date: number; // timestamp
  rating?: number; // 1-5 stars (for accommodation, restaurants)
  notes?: string; // personal notes
  aiAnalysis?: {
    detectedType: string; // what AI detected (hotel, restaurant, landmark, etc.)
    extractedInfo: string; // AI description
    suggestedCategory: EntryCategory;
    confidence: number; // 0-1
  };
  tags?: string[]; // custom tags
  isFavorite?: boolean;
}

export interface MySpaceStats {
  totalEntries: number;
  entriesByCategory: Record<EntryCategory, number>;
  countriesVisited: string[];
  citiesVisited: string[];
  favoriteCount: number;
  lastUpdated: number;
}

export interface EntryAnalysisResponse {
  detectedType: string; // "فندق", "مطعم", "معلم سياحي", "منظر طبيعي", etc.
  title: string; // extracted or suggested title
  description: string; // AI-generated description
  location?: EntryLocation;
  suggestedCategory: EntryCategory;
  confidence: number;
  tags?: string[];
}