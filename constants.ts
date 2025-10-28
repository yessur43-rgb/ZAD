import { Type } from '@google/genai';

// Schema for analyzing food products (from image or barcode)
export const PRODUCT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    'الحالة': { 
      type: Type.STRING, 
      description: 'The Halal status of the product: حلال, حرام, مجهول, or غير معلوم.',
      enum: ['حلال', 'حرام', 'مجهول', 'غير معلوم'] 
    },
    'السبب': { 
      type: Type.STRING, 
      description: 'A brief, clear reason for the given Halal status.' 
    },
    'الأدلة': { 
      type: Type.ARRAY, 
      description: 'A list of ingredients or evidence that led to the conclusion. Can be empty.',
      items: { type: Type.STRING } 
    },
    'التقييم_الصحي': {
        type: Type.OBJECT,
        description: 'A health assessment of the product, including a summary and key points.',
        properties: {
            'ملخص': { 
              type: Type.STRING, 
              description: 'A brief summary of the health assessment.'
            },
            'نقاط': {
                type: Type.ARRAY,
                description: 'A list of positive, negative, or informational health points.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        'النوع': { 
                          type: Type.STRING, 
                          description: 'The type of health point: إيجابي, سلبي, or معلومة.',
                          enum: ['إيجابي', 'سلبي', 'معلومة'] 
                        },
                        'نقطة': { 
                          type: Type.STRING,
                          description: 'The specific health point or piece of information.'
                        }
                    },
                    required: ['النوع', 'نقطة']
                }
            }
        },
        required: ['ملخص', 'نقاط']
    }
  },
  required: ['الحالة', 'السبب', 'الأدلة']
};

// Schema for suggesting halal dishes from a restaurant
export const DISH_SUGGESTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'dishes': {
            type: Type.ARRAY,
            description: 'A list of suggested halal dishes.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'The name of the dish.' },
                    'description': { type: Type.STRING, description: 'A brief description of the dish.' }
                },
                required: ['name', 'description']
            }
        },
        'source_description': {
            type: Type.STRING,
            description: 'A description of where the information was sourced from (e.g., "Based on user reviews" or "Could not find an official menu").'
        }
    },
    required: ['dishes', 'source_description']
};

// Schema for analyzing a place's menu for Halal/Haram items
export const HALAL_HARAM_LIST_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'halalItems': {
            type: Type.ARRAY,
            description: 'A list of items that are generally considered Halal.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'The name of the item.' },
                    'note': { type: Type.STRING, description: 'A brief note, e.g., "Standard coffee, no additives".' }
                },
                required: ['name', 'note']
            }
        },
        'haramOrMushboohItems': {
            type: Type.ARRAY,
            description: 'A list of items that are potentially Haram or Mushbooh (doubtful).',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'The name of the item.' },
                    'note': { type: Type.STRING, description: 'A clear explanation of the potential issue (e.g., "May contain alcohol", "Check if lard is used instead of butter").' }
                },
                required: ['name', 'note']
            }
        },
        'source_description': {
            type: Type.STRING,
            description: 'A description of where the information was sourced from (e.g., "Based on analysis of their official online menu" or "Based on typical offerings for this type of cafe").'
        }
    },
    required: ['halalItems', 'haramOrMushboohItems', 'source_description']
};

// Schema for finding parking
export const PARKING_INFO_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'parkingSuggestions': {
            type: Type.ARRAY,
            description: 'A list of 2-3 nearby parking suggestions.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'The name of the parking lot or garage.' },
                    'address': { type: Type.STRING, description: 'The full street address of the parking location.' },
                    'url': { type: Type.STRING, description: 'The Google Maps URL for the parking location.'},
                    'distance_to_restaurant': { type: Type.STRING, description: 'Walking distance or time from the parking to the restaurant (e.g., "5-minute walk", "400 meters").' },
                    'pricing_details': { type: Type.STRING, description: 'Information about the cost of parking (e.g., "3 SAR/hour", "Free for customers", "Flat rate 10 SAR").' },
                    'parking_type': { type: Type.STRING, enum: ['Garage', 'Street', 'Lot', 'Unknown'], description: 'The type of parking.'},
                    'notes': { type: Type.STRING, description: 'Any other important notes, like "Usually busy", "Cash only", or "Entrance is on the back street".'}
                },
                required: ['name', 'address', 'distance_to_restaurant', 'pricing_details', 'parking_type']
            }
        }
    },
    required: ['parkingSuggestions']
};

// Schema for finding a product in stores
export const FIND_PRODUCT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'identifiedProduct': {
            type: Type.STRING,
            description: 'The name of the product identified from the image or text.'
        },
        'aiResponseText': {
            type: Type.STRING,
            description: 'A friendly introductory text from the AI, like "وجدت لك هذا المنتج وقد يكون متوفراً في الأماكن التالية:".'
        },
    },
    required: ['identifiedProduct', 'aiResponseText']
}

// Schema for vignette information
export const VIGNETTE_INFO_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'details': {
            type: Type.OBJECT,
            properties: {
                'country': { type: Type.STRING, description: 'The country the vignette is for.'},
                'generalDescription': { type: Type.STRING, description: 'A general overview of the vignette system in this country.' },
                'prices': {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            'validity': { type: Type.STRING, description: 'Validity period (e.g., "10 أيام").' },
                            'price': { type: Type.STRING, description: 'Price with currency (e.g., "9.90 يورو").' },
                            'vehicleType': { type: Type.STRING, description: 'Vehicle type (e.g., "سيارة حتى 3.5 طن").' }
                        },
                        required: ['validity', 'price', 'vehicleType']
                    }
                },
                'purchaseLocations': { type: Type.ARRAY, items: { type: Type.STRING }, description: 'General places where the vignette can be bought (e.g., "محطات الوقود الحدودية").' },
                'officialWebsite': { type: Type.STRING, description: 'The official website URL for online purchase, if available.' },
                'importantNotes': { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Crucial notes or warnings (e.g., "يجب لصقها قبل عبور الحدود").' },
                'entryPointExamples': {
                    type: Type.ARRAY,
                    description: "Specific advice for travelers coming from neighboring countries.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            'comingFrom': { type: Type.STRING, description: 'The country the traveler is coming from.'},
                            'locations': { type: Type.ARRAY, items: { type: Type.STRING}, description: 'List of specific purchase locations for that route.' }
                        },
                        required: ['comingFrom', 'locations']
                    }
                }
            },
             required: ['country', 'generalDescription', 'prices', 'purchaseLocations', 'importantNotes']
        },
    },
    required: ['details']
}

// Schema for general object/place identification
export const IDENTIFICATION_SCHEMA = {
    type: Type.OBJECT,
    description: 'Identifies the main object, building, plant, animal, or place in an image. Provides a name, a detailed description, and optionally an address and Google Maps URL if it is a fixed location.',
    properties: {
        'name': { type: Type.STRING, description: 'The name of the identified subject.' },
        'description': { type: Type.STRING, description: 'A detailed description of the subject, including interesting facts, history, or characteristics.' },
        'address': { type: Type.STRING, description: 'The full street address, only if the subject is a fixed location.' },
        'googleMapsUrl': { type: Type.STRING, description: 'The Google Maps URL, only if the subject is a fixed location.' }
    },
    required: ['name', 'description']
};

// --- START: Activities Finder Schema ---
export const ACTIVITY_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'activities': {
            type: Type.ARRAY,
            description: "A list of diverse, family-friendly activities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: "The name of the activity or place." },
                    'description': { type: Type.STRING, description: "A brief, engaging description of the activity." },
                    'category': { type: Type.STRING, description: "A category for the activity, e.g., 'ترفيه', 'ثقافة وتاريخ', 'متعة عائلية', 'رياضة'." },
                    'address': { type: Type.STRING, description: "The full street address." },
                    'price': { type: Type.STRING, description: "Pricing information, e.g., '50 ريال للشخص', 'دخول مجاني', 'تبدأ من 100 ريال'." },
                    'operatingHours': { 
                        type: Type.OBJECT, 
                        description: "An object with Arabic day names as keys (e.g., 'الاثنين') and operating hours as string values (e.g., '10:00 صباحًا - 10:00 مساءً' or 'مغلق').",
                        properties: {
                            'الاثنين': { type: Type.STRING, description: "Operating hours for Monday." },
                            'الثلاثاء': { type: Type.STRING, description: "Operating hours for Tuesday." },
                            'الأربعاء': { type: Type.STRING, description: "Operating hours for Wednesday." },
                            'الخميس': { type: Type.STRING, description: "Operating hours for Thursday." },
                            'الجمعة': { type: Type.STRING, description: "Operating hours for Friday." },
                            'السبت': { type: Type.STRING, description: "Operating hours for Saturday." },
                            'الأحد': { type: Type.STRING, description: "Operating hours for Sunday." },
                        }
                    },
                    'status': { type: Type.STRING, enum: ['مفتوح', 'يغلق قريباً', 'مغلق'], description: "The current operational status based on the current time." },
                    'statusNote': { type: Type.STRING, description: "An optional note for the status, e.g., 'يغلق خلال ساعة', 'مغلق اليوم للصيانة'." },
                    'url': { type: Type.STRING, description: "The Google Maps URL for the activity location." },
                },
                required: ['name', 'description', 'category', 'address', 'price', 'operatingHours']
            }
        }
    },
    required: ['activities']
};
// --- END: Activities Finder Schema ---

// --- START: Travel Planner Schemas ---
export const TRIP_FRAMEWORK_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING, description: 'The city and country of the trip, e.g., "Interlaken, Switzerland".' },
        framework: {
            type: Type.ARRAY,
            description: "A list of steps for a 3-day itinerary.",
            items: {
                type: Type.OBJECT,
                properties: {
                    timeOfDay: { type: Type.STRING, description: 'The time of day for the activity, e.g., "Day 1: Morning (9 AM - 1 PM)".' },
                    description: { type: Type.STRING, description: 'A one-sentence description of the suggested activity.' },
                    activityType: { type: Type.STRING, enum: ['EAT', 'SIGHTSEEING', 'SHOPPING', 'ACTIVITY', 'TRAVEL', 'PRAYER'], description: 'The general category of the activity.' }
                },
                required: ['timeOfDay', 'description', 'activityType']
            }
        }
    },
    required: ['locationName', 'framework']
};

export const SUGGESTIONS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "A list of 2-3 specific suggestions for the user's trip step.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the place or activity." },
                    suggestionDescription: { type: Type.STRING, description: "A brief, compelling description of why this is a good suggestion." },
                    address: { type: Type.STRING, description: "The full address of the location." },
                    halalAssurance: { type: Type.STRING, description: "A note on Halal status if applicable (e.g., 'Certified Halal', 'Serves Halal options', 'Muslim-owned'). Omit if not applicable." },
                    rating: { type: Type.NUMBER, description: "The Google Maps rating, if available." },
                    userRatingsTotal: { type: Type.NUMBER, description: "The total number of user ratings, if available." },
                    url: { type: Type.STRING, description: "The Google Maps URL for the location." },
                },
                required: ['name', 'suggestionDescription']
            }
        }
    },
    required: ['suggestions']
};
// --- END: Travel Planner Schemas ---

// --- START: Nearby Places Schema ---
export const NEARBY_PLACES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        places: {
            type: Type.ARRAY,
            description: "A list of interesting places near the user's location.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'The name of the place.' },
                    latitude: { type: Type.NUMBER, description: 'The latitude of the place.' },
                    longitude: { type: Type.NUMBER, description: 'The longitude of the place.' },
                    category: { type: Type.STRING, enum: ['restaurant', 'cafe', 'sight', 'shop', 'other'], description: 'The category of the place.' },
                    address: { type: Type.STRING, description: 'The street address of the place.' },
                    rating: { type: Type.NUMBER, description: 'The Google Maps rating.' },
                    url: { type: Type.STRING, description: 'The Google Maps URL.' }
                },
                required: ['name', 'latitude', 'longitude', 'category']
            }
        }
    },
    required: ['places']
};
// --- END: Nearby Places Schema ---

// --- START: Phrase Translator Schemas ---
export const PHRASES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        languageName: { type: Type.STRING, description: 'The name of the local language (e.g., "Japanese").' },
        langCode: { type: Type.STRING, description: 'The BCP-47 language code for the local language (e.g., "ja-JP").' },
        categories: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    categoryName: { type: Type.STRING, description: 'The category of phrases (e.g., "Greetings", "Shopping").' },
                    phrases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING, description: 'The phrase in Arabic.' },
                                translated: { type: Type.STRING, description: 'The translation in the local language.' },
                                phonetic: { type: Type.STRING, description: 'A simple phonetic pronunciation.' }
                            },
                            required: ['original', 'translated', 'phonetic']
                        }
                    }
                },
                required: ['categoryName', 'phrases']
            }
        }
    },
    required: ['languageName', 'langCode', 'categories']
};

export const TRANSLATE_PHRASE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        translated: { type: Type.STRING, description: 'The translation in the local language.' },
        phonetic: { type: Type.STRING, description: 'A simple phonetic pronunciation.' }
    },
    required: ['translated', 'phonetic']
};
// --- END: Phrase Translator Schemas ---

// FIX: Add schema for the comprehensive travel guide.
// --- START: Travel Guide Schema ---
export const TRAVEL_GUIDE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        locationInfo: {
            type: Type.OBJECT,
            properties: {
                city: { type: Type.STRING },
                country: { type: Type.STRING },
                generalDescription: { type: Type.STRING, description: "A brief, engaging overview of the location." }
            },
            required: ['city', 'country', 'generalDescription']
        },
        entryRequirements: {
            type: Type.OBJECT,
            properties: {
                visaInfo: { type: Type.STRING, description: "Visa requirements for typical tourists." },
                customsNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important customs declarations or rules." }
            },
            required: ['visaInfo']
        },
        gettingAround: {
            type: Type.OBJECT,
            properties: {
                publicTransport: { type: Type.STRING, description: "Information on local public transport." },
                taxisRideSharing: { type: Type.STRING, description: "Details about taxis and ride-sharing services." },
                carRental: { type: Type.STRING, description: "Advice on renting a car." }
            },
            required: ['publicTransport']
        },
        money: {
            type: Type.OBJECT,
            properties: {
                currency: { type: Type.STRING, description: "Local currency, exchange rates, and ATM availability." },
                tippingCulture: { type: Type.STRING, description: "Local customs regarding tipping." },
                budgetTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tips for saving money." }
            },
            required: ['currency', 'tippingCulture']
        },
        connectivity: {
            type: Type.OBJECT,
            properties: {
                simCards: { type: Type.STRING, description: "Information on buying local SIM cards." },
                wifi: { type: Type.STRING, description: "Availability of public Wi-Fi." }
            },
            required: ['simCards']
        },
        healthAndSafety: {
            type: Type.OBJECT,
            properties: {
                emergencyContacts: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            service: { type: Type.STRING },
                            number: { type: Type.STRING },
                            note: { type: Type.STRING }
                        },
                        required: ['service', 'number']
                    }
                },
                healthTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                safetyNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['emergencyContacts', 'healthTips']
        },
        localCulture: {
            type: Type.OBJECT,
            properties: {
                etiquette: { type: Type.ARRAY, items: { type: Type.STRING } },
                helpfulPhrases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            phrase: { type: Type.STRING },
                            translation: { type: Type.STRING },
                            pronunciation: { type: Type.STRING }
                        },
                        required: ['phrase', 'translation', 'pronunciation']
                    }
                }
            },
            required: ['etiquette', 'helpfulPhrases']
        },
        muslimTravelerInfo: {
            type: Type.OBJECT,
            properties: {
                halalFoodAvailability: { type: Type.STRING },
                nearbyMosquesSuggestion: { type: Type.STRING },
                prayerTimesLink: { type: Type.STRING }
            },
            required: ['halalFoodAvailability', 'nearbyMosquesSuggestion']
        },
        practicalInfo: {
            type: Type.OBJECT,
            properties: {
                powerPlugs: { type: Type.STRING, description: "Type of electrical outlets and voltage." },
                drinkingWater: { type: Type.STRING, description: "Information on tap water safety." }
            },
            required: ['powerPlugs', 'drinkingWater']
        }
    },
    required: ['locationInfo', 'gettingAround', 'money', 'connectivity', 'healthAndSafety', 'localCulture', 'muslimTravelerInfo', 'practicalInfo']
};
// --- END: Travel Guide Schema ---
