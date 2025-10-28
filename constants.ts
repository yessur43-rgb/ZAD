import { Type } from '@google/genai';

// Schema for analyzing food products (from image or barcode)
export const PRODUCT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    'الحالة': { 
      type: Type.STRING, 
      description: 'حالة المنتج من حيث الحلال: حلال، حرام، مجهول، أو غير معلوم.',
      enum: ['حلال', 'حرام', 'مجهول', 'غير معلوم'] 
    },
    'السبب': { 
      type: Type.STRING, 
      description: 'سبب موجز وواضح لحالة الحلال المحددة.' 
    },
    'الأدلة': { 
      type: Type.ARRAY, 
      description: 'قائمة بالمكونات أو الأدلة التي أدت إلى الاستنتاج. يمكن أن تكون فارغة.',
      items: { type: Type.STRING } 
    },
    'التقييم_الصحي': {
        type: Type.OBJECT,
        description: 'تقييم صحي للمنتج، يشمل ملخصًا ونقاطًا رئيسية.',
        properties: {
            'ملخص': { 
              type: Type.STRING, 
              description: 'ملخص موجز للتقييم الصحي.'
            },
            'نقاط': {
                type: Type.ARRAY,
                description: 'قائمة بالنقاط الصحية الإيجابية أو السلبية أو المعلوماتية.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        'النوع': { 
                          type: Type.STRING, 
                          description: 'نوع النقطة الصحية: إيجابي، سلبي، أو معلومة.',
                          enum: ['إيجابي', 'سلبي', 'معلومة'] 
                        },
                        'نقطة': { 
                          type: Type.STRING,
                          description: 'النقطة الصحية المحددة أو المعلومة.'
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
            description: 'قائمة بالأطباق الحلال المقترحة.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'اسم الطبق.' },
                    'description': { type: Type.STRING, description: 'وصف موجز للطبق.' }
                },
                required: ['name', 'description']
            }
        },
        'source_description': {
            type: Type.STRING,
            description: 'وصف لمصدر المعلومات (مثال: "بناءً على تقييمات المستخدمين" أو "لم يتم العثور على قائمة رسمية").'
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
            description: 'قائمة بالعناصر التي تعتبر حلال بشكل عام.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'اسم العنصر.' },
                    'note': { type: Type.STRING, description: 'ملاحظة موجزة، مثال: "قهوة عادية، بدون إضافات".' }
                },
                required: ['name', 'note']
            }
        },
        'haramOrMushboohItems': {
            type: Type.ARRAY,
            description: 'قائمة بالعناصر التي قد تكون حرامًا أو مشبوهة.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'اسم العنصر.' },
                    'note': { type: Type.STRING, description: 'شرح واضح للمشكلة المحتملة (مثال: "قد يحتوي على كحول"، "تأكد مما إذا كان يتم استخدام شحم الخنزير بدلاً من الزبدة").' }
                },
                required: ['name', 'note']
            }
        },
        'source_description': {
            type: Type.STRING,
            description: 'وصف لمصدر المعلومات (مثال: "بناءً على تحليل قائمة الطعام الرسمية على الإنترنت" أو "بناءً على العروض المعتادة لهذا النوع من المقاهي").'
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
            description: 'قائمة بـ 2-3 اقتراحات لمواقف سيارات قريبة.',
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: 'اسم موقف السيارات أو المرآب.' },
                    'address': { type: Type.STRING, description: 'عنوان الشارع الكامل لموقع الموقف.' },
                    'url': { type: Type.STRING, description: 'رابط خرائط جوجل لموقع الموقف.'},
                    'distance_to_restaurant': { type: Type.STRING, description: 'مسافة أو وقت المشي من الموقف إلى المطعم (مثال: "5 دقائق مشي"، "400 متر").' },
                    'pricing_details': { type: Type.STRING, description: 'معلومات عن تكلفة الموقف (مثال: "3 ريال/ساعة"، "مجاني للعملاء"، "سعر ثابت 10 ريال").' },
                    'parking_type': { type: Type.STRING, enum: ['Garage', 'Street', 'Lot', 'Unknown'], description: 'نوع الموقف.'},
                    'notes': { type: Type.STRING, description: 'أي ملاحظات هامة أخرى، مثل "عادة ما يكون مزدحمًا"، "الدفع نقدًا فقط"، أو "المدخل في الشارع الخلفي".'}
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
            description: 'اسم المنتج الذي تم التعرف عليه من الصورة أو النص.'
        },
        'aiResponseText': {
            type: Type.STRING,
            description: 'نص ترحيبي من الذكاء الاصطناعي، مثل "وجدت لك هذا المنتج وقد يكون متوفراً في الأماكن التالية:".'
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
                'country': { type: Type.STRING, description: 'الدولة التي يخصها استيكر العبور.'},
                'generalDescription': { type: Type.STRING, description: 'نظرة عامة على نظام استيكر العبور في هذه الدولة.' },
                'prices': {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            'validity': { type: Type.STRING, description: 'فترة الصلاحية (مثال: "10 أيام").' },
                            'price': { type: Type.STRING, description: 'السعر مع العملة (مثال: "9.90 يورو").' },
                            'vehicleType': { type: Type.STRING, description: 'نوع المركبة (مثال: "سيارة حتى 3.5 طن").' }
                        },
                        required: ['validity', 'price', 'vehicleType']
                    }
                },
                'purchaseLocations': { type: Type.ARRAY, items: { type: Type.STRING }, description: 'أماكن عامة يمكن شراء الاستيكر منها (مثال: "محطات الوقود الحدودية").' },
                'officialWebsite': { type: Type.STRING, description: 'الموقع الرسمي للشراء عبر الإنترنت، إذا كان متاحًا.' },
                'importantNotes': { type: Type.ARRAY, items: { type: Type.STRING }, description: 'ملاحظات أو تحذيرات هامة (مثال: "يجب لصقها قبل عبور الحدود").' },
                'entryPointExamples': {
                    type: Type.ARRAY,
                    description: "نصائح محددة للمسافرين القادمين من الدول المجاورة.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            'comingFrom': { type: Type.STRING, description: 'الدولة التي يأتي منها المسافر.'},
                            'locations': { type: Type.ARRAY, items: { type: Type.STRING}, description: 'قائمة بمواقع شراء محددة لذلك المسار.' }
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
    description: 'للتعرف على الكائن الرئيسي أو المبنى أو النبات أو الحيوان أو المكان في الصورة. يوفر اسمًا ووصفًا تفصيليًا، واختياريًا عنوانًا ورابط خرائط جوجل إذا كان موقعًا ثابتًا.',
    properties: {
        'name': { type: Type.STRING, description: 'اسم الموضوع الذي تم التعرف عليه.' },
        'description': { type: Type.STRING, description: 'وصف تفصيلي للموضوع، بما في ذلك حقائق مثيرة للاهتمام أو تاريخ أو خصائص.' },
        'address': { type: Type.STRING, description: 'عنوان الشارع الكامل، فقط إذا كان الموضوع موقعًا ثابتًا.' },
        'googleMapsUrl': { type: Type.STRING, description: 'رابط خرائط جوجل، فقط إذا كان الموضوع موقعًا ثابتًا.' }
    },
    required: ['name', 'description']
};

// --- START: Activities Finder Schema ---
export const ACTIVITY_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        'activities': {
            type: Type.ARRAY,
            description: "قائمة بأنشطة متنوعة ومناسبة للعائلة.",
            items: {
                type: Type.OBJECT,
                properties: {
                    'name': { type: Type.STRING, description: "اسم النشاط أو المكان." },
                    'description': { type: Type.STRING, description: "وصف موجز وجذاب للنشاط." },
                    'category': { type: Type.STRING, description: "فئة للنشاط، مثال: 'ترفيه'، 'ثقافة وتاريخ'، 'متعة عائلية'، 'رياضة'." },
                    'address': { type: Type.STRING, description: "عنوان الشارع الكامل." },
                    'price': { type: Type.STRING, description: "معلومات التسعير، مثال: '50 ريال للشخص'، 'دخول مجاني'، 'تبدأ من 100 ريال'." },
                    'operatingHours': { 
                        type: Type.OBJECT, 
                        description: "كائن يحتوي على أسماء الأيام العربية كمفاتيح (مثال: 'الاثنين') وساعات العمل كقيم نصية (مثال: '10:00 صباحًا - 10:00 مساءً' أو 'مغلق').",
                        properties: {
                            'الاثنين': { type: Type.STRING, description: "ساعات العمل ليوم الاثنين." },
                            'الثلاثاء': { type: Type.STRING, description: "ساعات العمل ليوم الثلاثاء." },
                            'الأربعاء': { type: Type.STRING, description: "ساعات العمل ليوم الأربعاء." },
                            'الخميس': { type: Type.STRING, description: "ساعات العمل ليوم الخميس." },
                            'الجمعة': { type: Type.STRING, description: "ساعات العمل ليوم الجمعة." },
                            'السبت': { type: Type.STRING, description: "ساعات العمل ليوم السبت." },
                            'الأحد': { type: Type.STRING, description: "ساعات العمل ليوم الأحد." },
                        }
                    },
                    'status': { type: Type.STRING, enum: ['مفتوح', 'يغلق قريباً', 'مغلق'], description: "الحالة التشغيلية الحالية بناءً على الوقت الحالي." },
                    'statusNote': { type: Type.STRING, description: "ملاحظة اختيارية للحالة، مثال: 'يغلق خلال ساعة'، 'مغلق اليوم للصيانة'." },
                    'url': { type: Type.STRING, description: "رابط خرائط جوجل لموقع النشاط." },
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
        locationName: { type: Type.STRING, description: 'المدينة والدولة للرحلة، مثال: "إنترلاكن، سويسرا".' },
        framework: {
            type: Type.ARRAY,
            description: "قائمة بخطوات لخط سير رحلة لمدة 3 أيام.",
            items: {
                type: Type.OBJECT,
                properties: {
                    timeOfDay: { type: Type.STRING, description: 'الوقت من اليوم للنشاط، مثال: "اليوم الأول: الصباح (9 صباحًا - 1 مساءً)".' },
                    description: { type: Type.STRING, description: 'وصف من جملة واحدة للنشاط المقترح.' },
                    activityType: { type: Type.STRING, enum: ['EAT', 'SIGHTSEEING', 'SHOPPING', 'ACTIVITY', 'TRAVEL', 'PRAYER'], description: 'الفئة العامة للنشاط.' }
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
            description: "قائمة بـ 2-3 اقتراحات محددة لخطوة رحلة المستخدم.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "اسم المكان أو النشاط." },
                    suggestionDescription: { type: Type.STRING, description: "وصف موجز ومقنع لسبب كون هذا اقتراحًا جيدًا." },
                    address: { type: Type.STRING, description: "العنوان الكامل للموقع." },
                    halalAssurance: { type: Type.STRING, description: "ملاحظة حول حالة الحلال إن وجدت (مثال: 'حلال معتمد'، 'يقدم خيارات حلال'، 'مملوك لمسلم'). يمكن حذفه إذا لم يكن ذا صلة." },
                    rating: { type: Type.NUMBER, description: "تقييم خرائط جوجل، إذا كان متاحًا." },
                    userRatingsTotal: { type: Type.NUMBER, description: "إجمالي عدد تقييمات المستخدمين، إذا كان متاحًا." },
                    url: { type: Type.STRING, description: "رابط خرائط جوجل للموقع." },
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
            description: "قائمة بالأماكن المثيرة للاهتمام بالقرب من موقع المستخدم.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'اسم المكان.' },
                    latitude: { type: Type.NUMBER, description: 'خط عرض المكان.' },
                    longitude: { type: Type.NUMBER, description: 'خط طول المكان.' },
                    category: { type: Type.STRING, enum: ['restaurant', 'cafe', 'sight', 'shop', 'other'], description: 'فئة المكان.' },
                    address: { type: Type.STRING, description: 'عنوان الشارع للمكان.' },
                    rating: { type: Type.NUMBER, description: 'تقييم خرائط جوجل.' },
                    url: { type: Type.STRING, description: 'رابط خرائط جوجل.' }
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
        languageName: { type: Type.STRING, description: 'اسم اللغة المحلية (مثال: "اليابانية").' },
        langCode: { type: Type.STRING, description: 'رمز اللغة BCP-47 للغة المحلية (مثال: "ja-JP").' },
        categories: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    categoryName: { type: Type.STRING, description: 'فئة العبارات (مثال: "التحيات"، "التسوق").' },
                    phrases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING, description: 'العبارة باللغة العربية.' },
                                translated: { type: Type.STRING, description: 'الترجمة باللغة المحلية.' },
                                phonetic: { type: Type.STRING, description: 'نطق صوتي بسيط.' }
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
        translated: { type: Type.STRING, description: 'الترجمة باللغة المحلية.' },
        phonetic: { type: Type.STRING, description: 'نطق صوتي بسيط.' }
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
                city: { type: Type.STRING, description: 'المدينة' },
                country: { type: Type.STRING, description: 'الدولة' },
                generalDescription: { type: Type.STRING, description: "نظرة عامة موجزة وجذابة عن الموقع." }
            },
            required: ['city', 'country', 'generalDescription']
        },
        entryRequirements: {
            type: Type.OBJECT,
            properties: {
                visaInfo: { type: Type.STRING, description: "متطلبات التأشيرة للسياح." },
                customsNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "إقرارات أو قواعد جمركية هامة." }
            },
            required: ['visaInfo']
        },
        gettingAround: {
            type: Type.OBJECT,
            properties: {
                publicTransport: { type: Type.STRING, description: "معلومات عن وسائل النقل العام المحلية." },
                taxisRideSharing: { type: Type.STRING, description: "تفاصيل حول سيارات الأجرة وخدمات مشاركة الركوب." },
                carRental: { type: Type.STRING, description: "نصائح حول استئجار سيارة." }
            },
            required: ['publicTransport']
        },
        money: {
            type: Type.OBJECT,
            properties: {
                currency: { type: Type.STRING, description: "العملة المحلية، أسعار الصرف، وتوفر أجهزة الصراف الآلي." },
                tippingCulture: { type: Type.STRING, description: "العادات المحلية المتعلقة بالبقشيش." },
                budgetTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نصائح لتوفير المال." }
            },
            required: ['currency', 'tippingCulture']
        },
        connectivity: {
            type: Type.OBJECT,
            properties: {
                simCards: { type: Type.STRING, description: "معلومات عن شراء شرائح SIM محلية." },
                wifi: { type: Type.STRING, description: "توفر شبكات Wi-Fi العامة." }
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
                            service: { type: Type.STRING, description: 'الخدمة' },
                            number: { type: Type.STRING, description: 'الرقم' },
                            note: { type: Type.STRING, description: 'ملاحظة' }
                        },
                        required: ['service', 'number']
                    }
                },
                healthTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'نصائح صحية' },
                safetyNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'ملاحظات للسلامة' }
            },
            required: ['emergencyContacts', 'healthTips']
        },
        localCulture: {
            type: Type.OBJECT,
            properties: {
                etiquette: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'آداب وسلوكيات' },
                helpfulPhrases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            phrase: { type: Type.STRING, description: 'العبارة' },
                            translation: { type: Type.STRING, description: 'الترجمة' },
                            pronunciation: { type: Type.STRING, description: 'النطق' }
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
                halalFoodAvailability: { type: Type.STRING, description: 'توفر الطعام الحلال' },
                nearbyMosquesSuggestion: { type: Type.STRING, description: 'اقتراح للمساجد القريبة' },
                prayerTimesLink: { type: Type.STRING, description: 'رابط أوقات الصلاة' }
            },
            required: ['halalFoodAvailability', 'nearbyMosquesSuggestion']
        },
        practicalInfo: {
            type: Type.OBJECT,
            properties: {
                powerPlugs: { type: Type.STRING, description: "نوع مقابس الكهرباء والجهد." },
                drinkingWater: { type: Type.STRING, description: "معلومات عن سلامة مياه الصنبور." }
            },
            required: ['powerPlugs', 'drinkingWater']
        }
    },
    required: ['locationInfo', 'gettingAround', 'money', 'connectivity', 'healthAndSafety', 'localCulture', 'muslimTravelerInfo', 'practicalInfo']
};
// --- END: Travel Guide Schema ---