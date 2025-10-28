// Defines the Halal status in English, used for logic and keys.
export type HalalStatus = 'Halal' | 'Haram' | 'Mushbooh' | 'Unknown';

// Defines the Halal status in Arabic, used for display.
export type HalalStatusArabic = 'حلال' | 'حرام' | 'مجهول' | 'غير معلوم';

// Represents a single point in the health assessment section.
export interface HealthPoint {
  النوع: 'إيجابي' | 'سلبي' | 'معلومة';
  نقطة: string;
}

// Represents the main response structure from the Gemini API for product analysis.
export interface GeminiResponse {
  الحالة: HalalStatusArabic;
  السبب: string;
  الأدلة: string[];
  التقييم_الصحي?: {
    ملخص: string;
    نقاط: HealthPoint[];
  };
}

// Represents a single item in the user's scan history.
export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'image' | 'barcode';
  identifier: string;
  result: GeminiResponse;
}

// Defines the categories for place searches in the ChatBot.
export type SearchCategory = 'restaurants' | 'supermarkets' | 'pharmacies' | 'mosques';

// Represents a geographical place with details.
export interface Place {
    name: string;
    address?: string;
    distance?: string;
    rating?: number;
    userRatingsTotal?: number;
    url?: string;
    cuisine?: string;
    closingTime?: string;
    location?: { latitude: number, longitude: number };
    phoneNumber?: string;
    priceLevel?: string;
    detailedHours?: string[];
}

// Represents a message in the ChatBot conversation.
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  places?: Place[];
  category?: SearchCategory;
}

// Represents the response for halal dish suggestions for a restaurant.
export interface DishSuggestionResponse {
  dishes: {
    name: string;
    description: string;
  }[];
  source_description: string;
}

// Represents a single parking suggestion.
export interface ParkingInfo {
    name: string;
    address: string;
    url?: string;
    distance_to_restaurant: string;
    pricing_details: string;
    parking_type: 'Garage' | 'Street' | 'Lot' | 'Unknown';
    notes?: string;
}

// Represents the response for parking suggestions.
export interface ParkingSuggestionResponse {
    parkingSuggestions: ParkingInfo[];
}

// Defines the categories for the "Find It" feature.
export type FindItCategory = 'product' | 'vignette' | 'identify';

// Represents the response for finding a product in nearby stores.
export interface FindItResponse {
    identifiedProduct: string;
    aiResponseText: string;
    places: Place[];
}

// Represents the detailed response for vignette (road tax sticker) information.
export interface VignetteDetailsResponse {
    details: {
        country: string;
        generalDescription: string;
        prices: {
            validity: string;
            price: string;
            vehicleType: string;
        }[];
        purchaseLocations: string[];
        officialWebsite?: string;
        importantNotes: string[];
        entryPointExamples: {
            comingFrom: string;
            locations: string[];
        }[];
    };
    sources: {
        title: string;
        uri: string;
    }[];
}

// --- START: Identification Types ---
export interface IdentificationResponse {
    name: string;
    description: string;
    address?: string;
    googleMapsUrl?: string;
}
// --- END: Identification Types ---

// Represents a single item in the Halal/Haram analysis list.
export interface HalalStatusItem {
    name: string;
    note: string;
}

// Represents the response for the Halal/Haram list analysis of a place.
export interface HalalHaramListResponse {
    halalItems: HalalStatusItem[];
    haramOrMushboohItems: HalalStatusItem[];
    source_description: string;
}

// --- START: Travel Planner Types ---

export type ActivityType = 'EAT' | 'SIGHTSEEING' | 'SHOPPING' | 'ACTIVITY' | 'TRAVEL' | 'PRAYER';

export interface Suggestion {
    name: string;
    suggestionDescription: string;
    address?: string;
    halalAssurance?: string;
    rating?: number;
    userRatingsTotal?: number;
    url?: string;
}

export interface TripFrameworkStep {
    timeOfDay: string; // e.g., "Morning (9:00 AM - 12:00 PM)"
    description: string; // e.g., "Explore the Old City"
    activityType: ActivityType;
    suggestions?: Suggestion[];
    chosenSuggestion?: Suggestion;
}

export interface ItineraryPlan {
    locationName: string;
    framework: TripFrameworkStep[];
}
// FIX: Add TravelGuideResponse type definition for the comprehensive travel guide feature.
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
        emergencyContacts: {
            service: string;
            number: string;
            note?: string;
        }[];
        healthTips: string[];
        safetyNotes?: string[];
    };
    localCulture: {
        etiquette: string[];
        helpfulPhrases: {
            phrase: string;
            translation: string;
            pronunciation: string;
        }[];
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
// --- END: Travel Planner Types ---

// --- START: Nearby Places Types ---
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
// --- END: Nearby Places Types ---

// --- START: Weather Icon Type ---
export type WeatherIconType = 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy' | 'snowy' | 'windy';
// --- END: Weather Icon Type ---


// --- START: Activities Finder Types ---

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
    location?: { latitude: number; longitude: number };
}

export interface ActivityResponse {
    activities: Activity[];
}

// --- END: Activities Finder Types ---

// --- START: Phrase Translator Types ---
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
// --- END: Phrase Translator Types ---

// --- START: Community Hub Types ---
export type TipCategory = 'food' | 'sights' | 'transport' | 'general';

export interface CommunityTip {
    id: string;
    content: string;
    category: TipCategory;
    timestamp: number;
    upvotes: number;
}
// --- END: Community Hub Types ---
