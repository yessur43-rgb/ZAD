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
    distance?: string; // Added from ChatBot usage
}

export type SearchCategory = 'restaurants' | 'supermarkets' | 'pharmacies' | 'mosques';

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