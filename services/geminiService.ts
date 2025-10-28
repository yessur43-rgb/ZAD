import { GoogleGenAI, GenerateContentResponse, Place as GeminiPlace } from '@google/genai';
import { 
    GeminiResponse, 
    ChatMessage, 
    Place, 
    DishSuggestionResponse, 
    ParkingSuggestionResponse,
    FindItResponse, 
    VignetteDetailsResponse,
    HalalHaramListResponse,
    ActivityResponse,
    Activity,
    IdentificationResponse,
    ItineraryPlan,
    TripFrameworkStep,
    Suggestion,
    NearbyPlacesResponse,
    CommonPhrasesResponse,
    Phrase,
    TravelGuideResponse
} from '../types';
import { 
    PRODUCT_ANALYSIS_SCHEMA, 
    DISH_SUGGESTION_SCHEMA, 
    PARKING_INFO_SCHEMA,
    FIND_PRODUCT_SCHEMA, 
    VIGNETTE_INFO_SCHEMA,
    HALAL_HARAM_LIST_SCHEMA,
    ACTIVITY_SCHEMA,
    IDENTIFICATION_SCHEMA,
    TRIP_FRAMEWORK_SCHEMA,
    SUGGESTIONS_SCHEMA,
    NEARBY_PLACES_SCHEMA,
    PHRASES_SCHEMA,
    TRANSLATE_PHRASE_SCHEMA,
    TRAVEL_GUIDE_SCHEMA
} from '../constants';

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to safely parse JSON responses from the model
const parseJsonResponse = <T>(jsonString: string, schemaName: string): T => {
    try {
        // The model sometimes wraps the JSON in ```json ... ```, so we remove it.
        const cleanedJson = jsonString.replace(/^```json\s*|```$/g, '').trim();
        return JSON.parse(cleanedJson) as T;
    } catch (error) {
        console.error(`Error parsing JSON for ${schemaName}:`, error);
        console.error('Original string:', jsonString);
        throw new Error(`فشل في تحليل الاستجابة من Gemini لـ ${schemaName}.`);
    }
};

// Helper to convert grounding chunk data into our Place type
const mapGeminiPlaceToPlace = (geminiPlace: GeminiPlace): Place => {
    const placeAnswer = geminiPlace.placeAnswerSources?.[0];
    return {
        name: geminiPlace.title,
        url: geminiPlace.uri,
        address: placeAnswer?.address,
        rating: placeAnswer?.rating,
        userRatingsTotal: placeAnswer?.userRatingsTotal,
        location: placeAnswer?.latLng ? { latitude: placeAnswer.latLng.latitude, longitude: placeAnswer.latLng.longitude } : undefined,
        phoneNumber: placeAnswer?.phoneNumber,
        priceLevel: placeAnswer?.priceLevel,
        detailedHours: placeAnswer?.hours?.flatMap(h => h.weekdayDescriptions || []),
        closingTime: placeAnswer?.hours?.find(h => h.status)?.status
    };
};

const productSystemInstruction = 'أنت خبير في الشريعة الإسلامية ومختص في تحليل المنتجات الغذائية لتحديد مدى توافقها مع أحكام الحلال. قم بتحليل المكونات بدقة وقدم إجابة واضحة وموجزة مع الأدلة. كن محايداً ومبنياً على الحقائق.';

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<GeminiResponse> => {
  const imagePart = { inlineData: { data: base64Data, mimeType } };
  const textPart = { text: 'حلل صورة هذا المنتج الغذائي. ركز على قائمة المكونات لتحديد ما إذا كان حلالاً أم حراماً أم مشبوهاً. قدم تقييماً صحياً موجزاً. يجب أن تكون الإجابة بتنسيق JSON حصرياً باللغة العربية.' };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: PRODUCT_ANALYSIS_SCHEMA,
    },
    systemInstruction: productSystemInstruction,
  });

  return parseJsonResponse<GeminiResponse>(response.text, 'ProductAnalysis');
};

export const analyzeBarcode = async (barcode: string): Promise<GeminiResponse> => {
    const initialPrompt = `ابحث عن معلومات حول المنتج المرتبط بالباركود التالي: ${barcode}. ركز على العثور على قائمة المكونات الكاملة وأي معلومات حول شهادات الحلال.`;
    
    // Step 1: Get information using Google Search
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: initialPrompt,
        config: {
            tools: [{ googleSearch: {} }]
        },
        systemInstruction: 'أنت مساعد بحث فعال يجمع معلومات المنتج من الويب.'
    });

    const context = searchResponse.text;

    // Step 2: Analyze the gathered information and format as JSON
    const analysisPrompt = `بناءً على المعلومات التالية: "${context}"، قم بتحليل المنتج. حلل مكوناته لتحديد ما إذا كان حلالاً أم حراماً أم مشبوهاً. قدم تقييماً صحياً موجزاً. يجب أن تكون الإجابة بتنسيق JSON حصرياً باللغة العربية.`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: PRODUCT_ANALYSIS_SCHEMA,
        },
        systemInstruction: productSystemInstruction
    });

    return parseJsonResponse<GeminiResponse>(jsonResponse.text, 'BarcodeAnalysis');
};

const menuSystemInstruction = "أنت خبير في الطعام الحلال ومحلل قوائم طعام ذكي. مهمتك هي تحليل صورة قائمة الطعام بعمق، مع التركيز الشديد على الأطباق الرئيسية والمقبلات والحلويات. تجاهل المشروبات البسيطة والواضحة مثل الماء، الشاي، القهوة، والمشروبات الغازية ما لم تكن تحتوي على إضافات مشبوهة. هدفك هو مساعدة المستخدم المسلم على اتخاذ قرارات مستنيرة بشأن الوجبات المعقدة. لكل طبق، قدم تقييمًا واضحًا: 'حلال'، 'مشكوك فيه'، أو 'حرام'. للعناصر المشكوك فيها، قدم نصيحة عملية (مثال: 'اسأل عن مصدر اللحم' أو 'تأكد من خلو الصلصة من الكحول').";

export const analyzeMenuImage = async (base64Data: string, mimeType: string): Promise<HalalHaramListResponse> => {
  const imagePart = { inlineData: { data: base64Data, mimeType } };
  const textPart = { text: 'حلل صورة قائمة الطعام هذه. تجاهل المشروبات البديهية مثل الماء والشاي والقهوة. ركز على الأطباق الرئيسية والمقبلات والحلويات. حدد العناصر الحلال بشكل واضح، والعناصر التي قد تكون حراماً أو مشبوهة. لكل عنصر مشبوه، اشرح السبب وقدم سؤالاً محدداً يمكن للمستخدم طرحه على النادل. يجب أن تكون الإجابة بتنسيق JSON حصرياً باللغة العربية.' };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: HALAL_HARAM_LIST_SCHEMA,
    },
    systemInstruction: menuSystemInstruction,
  });

  const result = parseJsonResponse<HalalHaramListResponse>(response.text, 'MenuAnalysis');
  if (!result.source_description) {
      result.source_description = "تم التحليل بناءً على صورة قائمة الطعام المقدمة.";
  }
  return result;
};


export const findPlaces = async (
    chatHistory: ChatMessage[],
    query: string,
    location: { latitude: number; longitude: number } | null
): Promise<{ text: string; places: Place[] }> => {
    const history = chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(p => ({text: p.text}))
    }));
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [...history, { role: 'user', parts: [{text: query}]}],
        config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
              retrievalConfig: location ? {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              } : undefined
            }
        },
        systemInstruction: 'أنت مساعد جغرافي متخصص في إيجاد الأماكن. عند البحث عن أماكن عبادة إسلامية مثل "مساجد"، تأكد من استبعاد الكنائس والمعابد الأخرى. أجب على المستخدم بإيجاز ثم اعتمد على أداة الخرائط لتوفير النتائج. إذا لم يتم تحديد موقع، اطلب من المستخدم تحديد مدينة. قم دائمًا بتضمين معلومات المسافة إن أمكن.'
    });

    const places: Place[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        for (const chunk of groundingChunks) {
            if (chunk.maps) {
                places.push(mapGeminiPlaceToPlace(chunk.maps));
            }
        }
    }
    
    return { text: response.text, places };
};

export const findPlacesOnRoute = async (
    start: string,
    destination: string,
    query: string
): Promise<{ text: string; places: Place[] }> => {
    const fullQuery = `اعرض لي ${query} في الطريق من "${start}" إلى "${destination}".`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{text: fullQuery}]}],
        config: {
            tools: [{googleMaps: {}}],
        },
        systemInstruction: 'أنت مساعد سفر متخصص في إيجاد محطات توقف مناسبة على طول طريق القيادة. عند البحث عن أماكن عبادة إسلامية مثل "مساجد"، تأكد من استبعاد الكنائس والمعابد الأخرى. أنت تستخدم أداة الخرائط للعثور على مواقع حقيقية. أعط الأولوية للمواقع التي تتطلب الحد الأدنى من الانحراف عن المسار، والتي يمكن الوصول إليها مباشرة بالسيارة دون الحاجة إلى وسائل نقل خاصة مثل التلفريك أو القطارات الجبلية. قدم ردًا موجزًا متبوعًا بقائمة الأماكن من الأداة.'
    });

    const places: Place[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        for (const chunk of groundingChunks) {
            if (chunk.maps) {
                places.push(mapGeminiPlaceToPlace(chunk.maps));
            }
        }
    }
    
    return { text: response.text, places };
};


export const getIngredientInfo = async (ingredient: string): Promise<string> => {
    const prompt = `قدم شرحاً مفصلاً عن المكون التالي: "${ingredient}". وضح مصدره الشائع (حيواني، نباتي، صناعي)، استخداماته، وحكمه الشرعي في الإسلام مع ذكر أي خلافات بين الفقهاء إن وجدت. اجعل الإجابة واضحة ومباشرة.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        systemInstruction: 'أنت باحث متخصص في علوم الأغذية والشريعة الإسلامية. قدم إجابات دقيقة ومفصلة حول المكونات الغذائية.'
    });

    return response.text;
};

export const getHalalDishes = async (restaurantName: string): Promise<DishSuggestionResponse> => {
    const searchPrompt = `ابحث عن قائمة الطعام أو آراء العملاء حول الأطباق الشعبية في مطعم "${restaurantName}".`;

    // Step 1: Get information using Google Search
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: searchPrompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const context = searchResponse.text;
    const sources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(c => c.web)
        .map(c => c.web!.title) || [];
    const sourceDescription = sources.length > 0 
        ? `بناءً على معلومات من: ${sources.slice(0, 2).join(', ')}`
        : 'لم يتم العثور على قائمة طعام رسمية، الاقتراحات مبنية على معلومات عامة.';


    // Step 2: Format the gathered information as JSON
    const formatPrompt = `بناءً على المعلومات التالية عن مطعم "${restaurantName}": "${context}", اقترح 5 أطباق حلال شائعة أو محتملة. قدم وصفاً موجزاً لكل طبق. إذا لم تكن المعلومات كافية، قدم قائمة فارغة. أجب بتنسيق JSON.`;
    
    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: DISH_SUGGESTION_SCHEMA
        }
    });
    
    const result = parseJsonResponse<DishSuggestionResponse>(jsonResponse.text, 'DishSuggestion');
    // Override the source description with a more accurate one from grounding
    result.source_description = result.dishes.length > 0 ? sourceDescription : 'لم نتمكن من العثور على قائمة طعام أو أطباق مقترحة لهذا المطعم.';
    
    return result;
};

export const getHalalHaramList = async (place: Place): Promise<HalalHaramListResponse> => {
    const searchPrompt = `ابحث عن قائمة الطعام أو المأكولات والمشروبات المعتادة في "${place.name}" الموجود في "${place.address || ''}".`;

    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: searchPrompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const context = searchResponse.text;
    const sources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(c => c.web)
        .map(c => c.web!.title) || [];
    const sourceDescription = sources.length > 0
        ? `بناءً على معلومات من: ${sources.slice(0, 2).join(', ')}`
        : 'لم يتم العثور على قائمة طعام رسمية، الاقتراحات مبنية على تحليل عام.';

    const formatPrompt = `بناءً على المعلومات التالية حول "${place.name}": "${context}", قم بتحليل قائمته.
    أنشئ قائمتين بتنسيق JSON:
    1. 'halalItems': قائمة بالعناصر التي تعتبر حلال بشكل عام.
    2. 'haramOrMushboohItems': قائمة بالعناصر التي قد تكون حرامًا أو مشبوهة. لكل عنصر، قدم 'ملاحظة' واضحة تشرح المشكلة المحتملة وتقدم سؤالاً لطرحه (مثال: "تيراميسو: غالبًا ما يحتوي على كحول، اسأل: هل التيراميسو خالٍ من الكحول؟").
    إذا لم يتم العثور على قائمة محددة، فابنِ تحليلك على العروض المعتادة لهذا النوع من المنشآت.`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: HALAL_HARAM_LIST_SCHEMA
        },
        systemInstruction: "أنت محقق دقيق في الأطعمة الحلال. مهمتك هي تحليل قائمة الطعام أو المنتجات الشائعة لمؤسسة غذائية. ركز على الأطباق الرئيسية والمكونات المعقدة. تجاهل المشروبات البسيطة والواضحة مثل الماء، الشاي، والقهوة. هدفك هو تصنيف العناصر لمستخدم مسلم وتقديم نصائح واضحة وعملية."
    });

    const result = parseJsonResponse<HalalHaramListResponse>(jsonResponse.text, 'HalalHaramList');
    result.source_description = sourceDescription;
    
    return result;
};

export const findParkingForPlace = async (place: Place): Promise<ParkingSuggestionResponse> => {
    const searchPrompt = `ابحث عن أفضل 2-3 خيارات لمواقف السيارات بالقرب من "${place.name}" في "${place.address || ''}". اذكر اسم الموقف، عنوانه الكامل، رابط خرائط جوجل، المسافة، تفاصيل الأسعار، وأي ملاحظات. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط PARKING_INFO_SCHEMA.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: searchPrompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });

    return parseJsonResponse<ParkingSuggestionResponse>(response.text, 'ParkingInfo');
};

export const findProductInStores = async (base64Data: string, mimeType: string, location: { latitude: number; longitude: number }): Promise<FindItResponse> => {
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart1 = { text: 'ما هو اسم المنتج في هذه الصورة؟ أجب باسم المنتج فقط.' };
    
    const nameResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart1] }
    });
    
    const productName = nameResponse.text.trim();

    if (!productName) {
        throw new Error('لم نتمكن من التعرف على المنتج في الصورة.');
    }
    
    const searchResult = await findProductInStoresByText(productName, location);

    return { ...searchResult, identifiedProduct: productName };
};

export const findProductInStoresByText = async (productName: string, location: { latitude: number; longitude: number }): Promise<FindItResponse> => {
    const searchPrompt = `ابحث عن متاجر أو محلات سوبر ماركت بالقرب مني تبيع المنتج التالي: "${productName}".`;
    
    const placesResponse = await findPlaces([], searchPrompt, location);
    
    const responseText = `وجدت لك هذا المنتج "${productName}" وقد يكون متوفراً في الأماكن التالية:`;
    
    return {
        identifiedProduct: productName,
        aiResponseText: responseText,
        places: placesResponse.places
    };
};

export const findVignetteInfo = async (country: string): Promise<VignetteDetailsResponse> => {
    const prompt = `أحتاج معلومات مفصلة حول استيكر العبور (Vignette) لدولة "${country}". أريد معرفة الأسعار، فترات الصلاحية، أماكن الشراء، ملاحظات هامة، والموقع الرسمي للشراء إن وجد. قدم نصائح محددة للمسافرين القادمين بالسيارة من الدول المجاورة. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط VIGNETTE_INFO_SCHEMA.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
        ?.filter(c => c.web)
        .map(c => ({ title: c.web!.title, uri: c.web!.uri })) || [];

    const result = parseJsonResponse<VignetteDetailsResponse>(response.text, 'VignetteInfo');
    result.sources = sources;
    return result;
};


export const identifyObjectOrPlace = async (base64Data: string, mimeType: string): Promise<IdentificationResponse> => {
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart = { text: 'تعرف على هذا الشيء أو المكان في الصورة. قدم اسمًا، وصفًا تفصيليًا، وإذا كان مكانًا ثابتًا، فاذكر العنوان ورابط خرائط جوجل. يجب أن تكون الإجابة بتنسيق JSON حصريًا باللغة العربية بناءً على مخطط IDENTIFICATION_SCHEMA.' };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            tools: [{googleSearch: {}}]
        },
        systemInstruction: 'أنت خبير في التعرف على الصور، قادر على تحديد المعالم، المباني، النباتات، الحيوانات، أو أي شيء آخر بدقة عالية وتقديم معلومات مفيدة عنه.'
    });

    return parseJsonResponse<IdentificationResponse>(response.text, 'Identification');
};


export const findActivities = async (location: { latitude: number; longitude: number } | string, query?: string): Promise<Activity[]> => {
    const locationString = typeof location === 'string'
        ? `في ${location}`
        : `بالقرب مني`;

    const fullQuery = `ابحث عن أنشطة عائلية وترفيهية ${query ? `متعلقة بـ "${query}"` : ''} ${locationString}. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط ACTIVITY_SCHEMA. يجب أن تكون أسماء الأيام بالعربية.`;

    const now = new Date();
    const localTime = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
    const localDay = now.toLocaleDateString('ar-SA', { weekday: 'long' });

    const systemInstruction = `أنت مساعد سفر خبير في إيجاد الأنشطة. مهمتك هي العثور على أنشطة بناءً على طلب المستخدم. عند البحث عن أماكن عبادة إسلامية مثل "مساجد"، تأكد من استبعاد الكنائس والمعابد الأخرى. قم بتضمين الحالة التشغيلية الحالية (مفتوح، يغلق قريباً، مغلق) بناءً على ساعات العمل والوقت الحالي المفترض: ${localDay}، ${localTime}. استخدم دائمًا أداة خرائط جوجل للعثور على أماكن حقيقية.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: fullQuery,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: typeof location !== 'string' ? {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                }
            } : undefined
        },
        systemInstruction: systemInstruction,
    });
    
    const result = parseJsonResponse<ActivityResponse>(response.text, 'Activities');

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        result.activities.forEach(activity => {
            const match = groundingChunks.find(c => c.maps?.title.includes(activity.name.split(' ')[0]));
            if (match?.maps) {
                const place = mapGeminiPlaceToPlace(match.maps);
                activity.url = place.url;
                activity.location = place.location;
            }
        });
    }

    return result.activities;
};


// --- Travel Planner Functions ---
export const generateTripFramework = async (destination: string): Promise<ItineraryPlan> => {
    const prompt = `أنشئ إطارًا مقترحًا لرحلة سياحية عائلية لمدة 3 أيام إلى "${destination}". يجب أن يكون الإطار مقسمًا إلى فترات (صباح، بعد الظهر، مساء) لكل يوم، مع وصف من سطر واحد لكل نشاط، وتحديد نوع النشاط (EAT, SIGHTSEEING, SHOPPING, ACTIVITY, TRAVEL, PRAYER).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: TRIP_FRAMEWORK_SCHEMA
        },
        systemInstruction: 'أنت خبير في تخطيط الرحلات السياحية للمسلمين. قم بإنشاء خطط منطقية ومناسبة للعائلات.'
    });

    return parseJsonResponse<ItineraryPlan>(response.text, 'TripFramework');
};

export const getSuggestionsForStep = async (locationName: string, step: TripFrameworkStep): Promise<Suggestion[]> => {
    const prompt = `بناءً على خطة السفر إلى "${locationName}"، اقترح 2-3 خيارات محددة للنشاط التالي: "${step.description}".
    إذا كان نوع النشاط "EAT"، فركز على المطاعم الحلال أو التي تقدم خيارات حلال.
    لكل اقتراح، قدم الاسم، وصفًا موجزًا، العنوان، رابط خرائط جوجل، وتقييم جوجل إن وجد.
    أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط SUGGESTIONS_SCHEMA.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{googleMaps: {}}],
        },
        systemInstruction: 'أنت مساعد سفر ذكي. ابحث عن أفضل الاقتراحات العملية والمناسبة للمسلمين بناءً على خطة الرحلة.'
    });

    const result = parseJsonResponse<{ suggestions: Suggestion[] }>(response.text, 'Suggestions');
    
    // Enhance with grounding data
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        result.suggestions.forEach(suggestion => {
            const match = groundingChunks.find(c => c.maps?.title.includes(suggestion.name));
            if (match?.maps) {
                const place = mapGeminiPlaceToPlace(match.maps);
                suggestion.url = suggestion.url || place.url;
                suggestion.address = suggestion.address || place.address;
                suggestion.rating = suggestion.rating || place.rating;
                suggestion.userRatingsTotal = suggestion.userRatingsTotal || place.userRatingsTotal;
            }
        });
    }

    return result.suggestions;
};


export const getNearbyPlacesForMap = async (latitude: number, longitude: number): Promise<NearbyPlacesResponse> => {
    const prompt = `ابحث عن أماكن مثيرة للاهتمام بالقرب مني، بما في ذلك مطاعم، مقاهي، معالم سياحية، ومتاجر. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط NEARBY_PLACES_SCHEMA.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: { latitude, longitude }
                }
            }
        },
        systemInstruction: 'أنت دليل سياحي محلي، مهمتك هي إيجاد مجموعة متنوعة من الأماكن القريبة والمثيرة للاهتمام.'
    });

    return parseJsonResponse<NearbyPlacesResponse>(response.text, 'NearbyPlaces');
};


export const generateCommonPhrasesForTravel = async (destination: string): Promise<CommonPhrasesResponse> => {
    const prompt = `أنا مسافر إلى "${destination}". قم بإنشاء قائمة بالعبارات الشائعة والمفيدة للمسافرين باللغة المحلية. يجب أن تتضمن القائمة فئات مثل "التحيات"، "في المطعم"، "التسوق"، و"الطوارئ". لكل عبارة، قدم النص الأصلي باللغة العربية، الترجمة، وطريقة النطق المبسطة. حدد اسم اللغة ورمز اللغة BCP-47.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: PHRASES_SCHEMA
        },
        systemInstruction: 'أنت لغوي وخبير سفر، متخصص في تزويد المسافرين بالعبارات الأساسية للتواصل.'
    });
    return parseJsonResponse<CommonPhrasesResponse>(response.text, 'CommonPhrases');
};

export const translateCustomPhrase = async (phrase: string, language: string): Promise<Omit<Phrase, 'original'>> => {
    const prompt = `ترجم العبارة العربية التالية: "${phrase}" إلى لغة ${language}. قدم الترجمة والنطق المبسط فقط.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: TRANSLATE_PHRASE_SCHEMA
        }
    });
    return parseJsonResponse<Omit<Phrase, 'original'>>(response.text, 'TranslatePhrase');
};


export const generateTravelGuide = async (location: string): Promise<TravelGuideResponse> => {
    const prompt = `أنشئ دليل سفر شامل ومفصل للمسافر المسلم إلى "${location}". يجب أن يغطي الدليل جميع الجوانب المهمة مثل متطلبات الدخول، المواصلات، العملة، الاتصالات، الصحة والسلامة، الثقافة المحلية، معلومات خاصة بالمسلمين (طعام حلال، مساجد)، ومعلومات عملية. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط TRAVEL_GUIDE_SCHEMA.`;
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
        systemInstruction: 'أنت خبير سفر متخصص في إنشاء أدلة شاملة وموثوقة للمسافرين المسلمين، مع التركيز على الدقة والتفاصيل العملية.'
    });
    return parseJsonResponse<TravelGuideResponse>(response.text, 'TravelGuide');
};