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

// --- START: Interactive Travel Planner Schemas & Prompts ---

export const TRIP_FRAMEWORK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    'locationName': { type: Type.STRING, description: 'The name of the city/area identified from the user query.'},
    'framework': {
      type: Type.ARRAY,
      description: 'An array of steps for a flexible daily itinerary.',
      items: {
        type: Type.OBJECT,
        properties: {
          'timeOfDay': { type: Type.STRING, enum: ['الصباح', 'الظهيرة', 'بعد الظهر', 'المساء', 'العشاء'], description: 'The part of the day.'},
          'activityType': { type: Type.STRING, enum: ['EAT', 'SIGHTSEEING', 'SHOPPING', 'ACTIVITY', 'TRAVEL', 'PRAYER'], description: 'The category of the activity.' },
          'description': { type: Type.STRING, description: 'A brief, one-sentence description of the suggested activity framework. E.g., "تناول الغداء في مطعم محلي مطل على البحيرة".'}
        },
        required: ['timeOfDay', 'activityType', 'description']
      }
    }
  },
  required: ['locationName', 'framework']
};

export const SUGGESTIONS_SCHEMA = {
    type: Type.ARRAY,
    description: "A list of 2-3 specific suggestions for the user's request.",
    items: {
        type: Type.OBJECT,
        properties: {
            'name': { type: Type.STRING },
            'suggestionDescription': { type: Type.STRING, description: 'A detailed, persuasive description of why this is a good suggestion for a Muslim traveler.'},
            'halalAssurance': { type: Type.STRING, description: 'Crucial information about Halal status. E.g., "مطعم حلال معتمد", "يقدم خيارات بحرية ونباتية", "لا يقدم الكحول". If not applicable, omit this field.'},
        },
        required: ['name', 'suggestionDescription']
    }
}

export const FRAMEWORK_PROMPT = (destination: string) => `
أنت "رفيق سفر" خبير وودود، متخصص في مساعدة المسافرين المسلمين.
مهمتك هي إنشاء إطار عمل مرن ليوم كامل في "${destination}".
لا تقم بإنشاء خطة مفصلة الآن، فقط اقترح إطارًا عامًا للأنشطة مقسمًا حسب أوقات اليوم (الصباح، الظهيرة، بعد الظهر، المساء).
يجب أن يكون كل جزء من الإطار عبارة عن فكرة عامة، وليس مكانًا محددًا.
مثال جيد: "الصباح: جولة في المدينة القديمة"، "الظهيرة: غداء في مطعم مطل على النهر".
مثال سيء: "الصباح: اذهب إلى متحف اللوفر"، "الظهيرة: تناول الغداء في مطعم Le Procope".
ركز على الأنشطة التي تهم المسافر المسلم.
حدد اسم الموقع بوضوح في حقل locationName.
`;

export const SUGGESTION_PROMPT = (location: string, frameworkStepDescription: string) => `
أنت "رفيق سفر" خبير وودود، متخصص في مساعدة المسافرين المسلمين.
مهمتك هي تقديم 2-3 اقتراحات **محددة ومفصلة** للنشاط التالي في مدينة "${location}":
"${frameworkStepDescription}"

استخدم بحث جوجل وخرائط جوجل للعثور على أفضل الخيارات.
لكل اقتراح، قدم:
1.  اسم المكان.
2.  وصفًا جذابًا ومقنعًا (suggestionDescription) يشرح لماذا هذا الخيار رائع ومناسب.
3.  **الأهم:** معلومة واضحة عن حالة الحلال (halalAssurance). إذا كان مطعمًا، ابحث عن شهادة حلال. إذا لم تجد، ابحث عن بدائل ممتازة مثل مطاعم المأكولات البحرية أو النباتية واذكر ذلك بوضوح. إذا كان نشاطًا، اذكر ما إذا كان مناسبًا للعائلة وما إلى ذلك.

استخدم نتائج الخرائط لتعزيز اقتراحاتك بمعلومات واقعية.
`;

// --- END: Interactive Travel Planner Schemas & Prompts ---

// --- START: Phrase Translator Schemas ---

export const PHRASES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'languageName': { type: Type.STRING, description: 'The name of the local language (e.g., "Japanese").' },
        'langCode': { type: Type.STRING, description: 'The BCP-47 language code for text-to-speech (e.g., "ja-JP").' },
        'categories': {
            type: Type.ARRAY,
            description: 'A list of phrase categories.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'categoryName': { type: Type.STRING, description: 'Category of phrases (e.g., "Greetings", "Shopping").' },
                    'phrases': {
                        type: Type.ARRAY,
                        description: 'A list of phrases in this category.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                'original': { type: Type.STRING, description: 'The phrase in Arabic.' },
                                'translated': { type: Type.STRING, description: 'The phrase in the local language.' },
                                'phonetic': { type: Type.STRING, description: 'A simple phonetic pronunciation guide.' }
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

export const TRANSLATED_PHRASE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'translated': { type: Type.STRING, description: 'The phrase in the target language.' },
        'phonetic': { type: Type.STRING, description: 'A simple phonetic pronunciation guide.' }
    },
    required: ['translated', 'phonetic']
};

// --- END: Phrase Translator Schemas ---

// --- START: Traveler's Guide Schema ---
export const TRAVEL_GUIDE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        locationInfo: {
            type: Type.OBJECT,
            properties: {
                country: { type: Type.STRING },
                city: { type: Type.STRING },
                generalDescription: { type: Type.STRING, description: "A brief, welcoming introduction to the location." }
            },
            required: ['country', 'city', 'generalDescription']
        },
        entryRequirements: {
            type: Type.OBJECT,
            properties: {
                visaInfo: { type: Type.STRING, description: "Information about visa requirements for most travelers." },
                customsNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Brief notes on important customs regulations." }
            },
            required: ['visaInfo']
        },
        gettingAround: {
            type: Type.OBJECT,
            properties: {
                publicTransport: { type: Type.STRING, description: "Details about the main public transport systems (train, bus, metro)." },
                taxisRideSharing: { type: Type.STRING, description: "Information on taxis and available ride-sharing apps like Uber or local alternatives." },
                carRental: { type: Type.STRING, description: "Tips and notes about renting a car." }
            },
            required: ['publicTransport']
        },
        connectivity: {
            type: Type.OBJECT,
            properties: {
                simCards: { type: Type.STRING, description: "Advice on buying local SIM cards or using eSIMs." },
                wifi: { type: Type.STRING, description: "Information about public Wi-Fi availability." }
            },
            required: ['simCards']
        },
        money: {
            type: Type.OBJECT,
            properties: {
                currency: { type: Type.STRING, description: "Local currency name, code, and symbol (e.g., 'Swiss Franc (CHF, Fr.)')." },
                tippingCulture: { type: Type.STRING, description: "Summary of the local tipping etiquette." },
                budgetTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tips for saving money." }
            },
            required: ['currency', 'tippingCulture']
        },
        healthAndSafety: {
            type: Type.OBJECT,
            properties: {
                emergencyContacts: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            service: { type: Type.STRING, enum: ['الشرطة', 'الإسعاف', 'الإطفاء', 'الطوارئ العامة'] },
                            number: { type: Type.STRING },
                            note: { type: Type.STRING }
                        },
                        required: ['service', 'number']
                    }
                },
                healthTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Local health advice and notes." },
                safetyNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tips on staying safe and avoiding common scams." }
            },
            required: ['emergencyContacts', 'healthTips']
        },
        localCulture: {
            type: Type.OBJECT,
            properties: {
                etiquette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key do's and don'ts of local culture." },
                helpfulPhrases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            phrase: { type: Type.STRING, description: "The phrase in Arabic." },
                            translation: { type: Type.STRING, description: "The phrase in the local language." },
                            pronunciation: { type: Type.STRING, description: "A simple phonetic pronunciation." }
                        },
                        required: ['phrase', 'translation']
                    }
                }
            },
            required: ['etiquette', 'helpfulPhrases']
        },
        muslimTravelerInfo: {
            type: Type.OBJECT,
            properties: {
                prayerTimesLink: { type: Type.STRING, description: "A reliable website link for local prayer times." },
                halalFoodAvailability: { type: Type.STRING, description: "A summary of how easy it is to find Halal food." },
                nearbyMosquesSuggestion: { type: Type.STRING, description: "A suggestion on how to find nearby mosques (e.g., 'Use Google Maps and search for 'مسجد'')." }
            },
            required: ['halalFoodAvailability', 'nearbyMosquesSuggestion']
        },
        practicalInfo: {
            type: Type.OBJECT,
            properties: {
                powerPlugs: { type: Type.STRING, description: "Description of the power plug type and voltage (e.g., 'Type J, 230V')." },
                drinkingWater: { type: Type.STRING, description: "Information on whether tap water is safe to drink." }
            },
            required: ['powerPlugs', 'drinkingWater']
        }
    },
    required: ['locationInfo', 'gettingAround', 'connectivity', 'money', 'healthAndSafety', 'localCulture', 'muslimTravelerInfo', 'practicalInfo']
};
// --- END: Traveler's Guide Schema ---

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