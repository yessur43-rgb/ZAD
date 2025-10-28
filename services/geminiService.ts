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

const menuSystemInstruction = "أنت خبير دقيق في الطعام الحلال. مهمتك هي تحليل صورة قائمة الطعام وتصنيف العناصر. قدم ملاحظات واضحة وقابلة للتنفيذ للعناصر المشبوهة أو الحرام لمساعدة المستخدم المسلم على اتخاذ قرار مستنير. لا تدرج عناصر غير غذائية مثل 'ماء' أو 'بيبسي'.";

export const analyzeMenuImage = async (base64Data: string, mimeType: string): Promise<HalalHaramListResponse> => {
  const imagePart = { inlineData: { data: base64Data, mimeType } };
  const textPart = { text: 'حلل صورة قائمة الطعام هذه. حدد العناصر الحلال بشكل واضح والعناصر التي قد تكون حراماً أو مشبوهة. لكل عنصر مشبوه، قدم ملاحظة تشرح السبب (مثل "قد يحتوي على كحول" أو "تحقق مما إذا كان اللحم حلالاً"). استبعد المشروبات الغازية والمياه الواضحة. يجب أن تكون الإجابة بتنسيق JSON حصرياً باللغة العربية.' };
  
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
        systemInstruction: 'أنت مساعد جغرافي متخصص في إيجاد الأماكن. أجب على المستخدم بإيجاز ثم اعتمد على أداة الخرائط لتوفير النتائج. إذا لم يتم تحديد موقع، اطلب من المستخدم تحديد مدينة. قم دائمًا بتضمين معلومات المسافة إن أمكن.'
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
    const searchPrompt = `Find the menu or typical food and drink offerings for "${place.name}" located at "${place.address || ''}". Focus on ingredients that might be a concern for Muslims, like alcohol, pork derivatives, and non-halal meat.`;

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

    const formatPrompt = `Based on the following information about "${place.name}": "${context}", analyze its menu.
    Create two lists in JSON format:
    1. 'halalItems': A list of items that are generally considered Halal (e.g., coffee, tea, seafood). Include a brief note.
    2. 'haramOrMushboohItems': A list of items that are potentially Haram or Mushbooh (doubtful). For each item, provide a clear 'note' explaining the potential issue (e.g., "Croissants: May contain lard instead of butter", "Tiramisu: Often contains alcohol", "Vanilla Extract: May be alcohol-based").
    If no specific menu is found, base your analysis on typical offerings for that type of establishment (e.g., a European café).`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: HALAL_HARAM_LIST_SCHEMA
        },
        systemInstruction: "You are a meticulous Halal food investigator. Your task is to analyze the menu or common products of a food establishment and classify them for a Muslim user, providing clear, actionable advice."
    });

    const result = parseJsonResponse<HalalHaramListResponse>(jsonResponse.text, 'HalalHaramList');
    result.source_description = sourceDescription;
    
    return result;
};

export const findParkingForPlace = async (place: Place): Promise<ParkingSuggestionResponse> => {
    const searchPrompt = `ابحث عن أفضل 2-3 خيارات لمواقف السيارات بالقرب من "${place.name}" في "${place.address || ''}". اذكر اسم الموقف، عنوانه الكامل، رابط خرائط جوجل، المسافة، تفاصيل الأسعار، وأي ملاحظات.`;

    // Step 1: Get information using Google Maps
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: searchPrompt,
        config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
                retrievalConfig: place.location ? {
                    latLng: {
                        latitude: place.location.latitude,
                        longitude: place.location.longitude
                    }
                } : undefined
            }
        },
        systemInstruction: 'أنت مساعد متخصص في إيجاد مواقف السيارات باستخدام خرائط جوجل.'
    });

    const context = searchResponse.text;

    // Step 2: Format the gathered information as JSON
    const formatPrompt = `بناءً على معلومات الخرائط التالية: "${context}", استخرج 2-3 من أفضل خيارات المواقف. لكل خيار، قدم اسم الموقف، عنوانه الكامل، رابط خرائط جوجل، مسافة المشي إلى المطعم، تفاصيل الأسعار، نوع الموقف، وأي ملاحظات مفيدة. أجب بتنسيق JSON حصرياً باللغة العربية.`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: PARKING_INFO_SCHEMA,
        },
        systemInstruction: 'أنت مساعد مفيد يجد معلومات مواقف السيارات للمستخدمين. يجب عليك تقديم تفاصيل عملية ودقيقة باللغة العربية.'
    });

    return parseJsonResponse<ParkingSuggestionResponse>(jsonResponse.text, 'ParkingSuggestion');
};

const findProduct = async (
  content: GenerateContentResponse['request']['contents'],
  location: { latitude: number; longitude: number }
): Promise<FindItResponse> => {
    // Step 1: Identify product and find potential stores using Google Maps/Search.
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: content,
        config: {
            tools: [{ googleMaps: {}, googleSearch: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                }
            }
        },
        systemInstruction: 'أنت مساعد تسوق خبير. مهمتك الأولى هي تحديد المنتج بدقة من الصورة أو النص. مهمتك الثانية هي العثور على مواقع بيع بالتجزئة مثل السوبر ماركت أو البقالات أو المتاجر الصغيرة القريبة من موقع المستخدم والتي من المحتمل أن تبيع هذا المنتج. أعط الأولوية للنتائج المحلية وتجنب مقرات الشركات أو الموزعين.'
    });

    const contextText = searchResponse.text;
    const places: Place[] = [];
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        for (const chunk of groundingChunks) {
            if (chunk.maps) {
                places.push(mapGeminiPlaceToPlace(chunk.maps));
            }
        }
    }
    
    // Step 2: Format the gathered information into the required JSON structure.
    const formatPrompt = `بناءً على المحتوى الأصلي للمستخدم والمعلومات التي تم العثور عليها: "${contextText}", استخرج اسم المنتج المحدد بوضوح وأنشئ نصًا تمهيديًا ودودًا مثل "وجدت لك هذا المنتج وقد يكون متوفراً في الأماكن التالية:". أجب بتنسيق JSON.`;
    
    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: formatPrompt }]}],
        config: {
            responseMimeType: "application/json",
            responseSchema: FIND_PRODUCT_SCHEMA,
        },
        systemInstruction: 'أنت مساعد يقوم بتنسيق البيانات. استخرج اسم المنتج من السياق وأنشئ نصًا تمهيديًا.'
    });

    const result = parseJsonResponse<Omit<FindItResponse, 'places'>>(jsonResponse.text, 'FindProduct');

    return { ...result, places };
};

export const findProductInStores = async (
    base64Data: string, 
    mimeType: string, 
    location: { latitude: number; longitude: number }
): Promise<FindItResponse> => {
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart = { text: 'حدد هذا المنتج ثم ابحث عن أماكن مثل السوبر ماركت أو البقالات القريبة مني التي تبيعه. ركز على نتائج التجزئة المحلية.' };
    const content = [{ role: 'user', parts: [imagePart, textPart] }];
    return findProduct(content, location);
};

export const findProductInStoresByText = async (
    productName: string,
    location: { latitude: number; longitude: number }
): Promise<FindItResponse> => {
    const content = [{ role: 'user', parts: [{ text: `ابحث عن أماكن مثل السوبر ماركت أو البقالات القريبة مني التي تبيع منتج "${productName}". ركز على نتائج التجزئة المحلية.` }] }];
    return findProduct(content, location);
};

export const findVignetteInfo = async (country: string): Promise<VignetteDetailsResponse> => {
    const searchPrompt = `ابحث عن أحدث المعلومات حول استيكر العبور (vignette) لدولة "${country}" لعام ${new Date().getFullYear()}. أحتاج إلى تفاصيل حول الأسعار، الصلاحيات، أماكن الشراء (خاصة عند نقاط الحدود مع الدول المجاورة)، الموقع الرسمي للشراء عبر الإنترنت، وأي ملاحظات هامة للمسافرين بالسيارة.`;

    // Step 1: Get information using Google Search
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: searchPrompt,
        config: {
            tools: [{ googleSearch: {} }]
        },
        systemInstruction: 'أنت مساعد بحث متخصص في لوائح السفر بالسيارات في أوروبا.'
    });

    const context = searchResponse.text;
    const sources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(c => c.web && c.web.uri && c.web.title)
        .map(c => ({ title: c.web!.title!, uri: c.web!.uri! })) || [];

    // Step 2: Format the gathered information as JSON
    const formatPrompt = `بناءً على المعلومات التالية عن استيكر العبور في "${country}": "${context}", قم بتنظيم البيانات بتنسيق JSON. تأكد من أن جميع الحقول المطلوبة ممتلئة بمعلومات دقيقة ومفصلة.`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: VIGNETTE_INFO_SCHEMA
        },
        systemInstruction: 'أنت مساعد يقوم بتنسيق بيانات السفر إلى JSON منظم.'
    });

    const result = parseJsonResponse<{details: VignetteDetailsResponse['details']}>(jsonResponse.text, 'VignetteInfo');
    
    return { ...result, sources };
};

export const identifyObjectOrPlace = async (base64Data: string, mimeType: string): Promise<IdentificationResponse> => {
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart = { text: 'Identify the main subject (object, building, plant, animal, place, etc.) in this image. Provide its name and a detailed description. If the subject is a fixed location (like a building or park), provide its full address and a Google Maps URL. If it\'s not a fixed location (like a car or an animal), you can omit the address and URL. Respond in JSON format in Arabic.' };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: IDENTIFICATION_SCHEMA,
        },
        systemInstruction: 'You are a universal identification expert. Your task is to accurately identify the subject of an image—be it a place, an object, a plant, or an animal—and provide comprehensive, well-structured information about it in Arabic.',
    });

    return parseJsonResponse<IdentificationResponse>(response.text, 'Identification');
};

// --- START: Activities Finder Function ---
export const findActivities = async (location: { latitude: number; longitude: number } | string, query?: string): Promise<Activity[]> => {
    const searchInstruction = query 
        ? `ابحث عن أنشطة ومعالم سياحية تطابق "${query}"`
        : 'ابحث عن مجموعة متنوعة من الأنشطة والمعالم السياحية المناسبة للعائلات';

    const locationInstruction = typeof location === 'string'
        ? `في "${location}".`
        : 'بالقرب من هذا الموقع.';
        
    const searchPrompt = `${searchInstruction} ${locationInstruction}. ابحث عن تفاصيل كاملة لكل نشاط، بما في ذلك الاسم، الوصف، الفئة، العنوان، السعر، ساعات العمل للأسبوع بأكمله، الحالة الحالية (مفتوح/مغلق)، ورابط خرائط جوجل. استخدم بحث جوجل وخرائط جوجل لضمان دقة المعلومات وحداثتها.`;

    // Step 1: Gather information
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: searchPrompt,
        config: {
            tools: [{ googleMaps: {}, googleSearch: {} }],
            toolConfig: typeof location !== 'string' ? {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            } : undefined,
        },
        systemInstruction: 'أنت مساعد سفر متخصص في العثور على أنشطة محلية ممتعة. مهمتك هي توفير معلومات دقيقة ومحدثة بناءً على بحث المستخدم وموقعه.'
    });

    const context = searchResponse.text;
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

    // Step 2: Format into JSON
    const formatPrompt = `بناءً على المعلومات التالية:\n\n${context}\n\nقم بتنسيق هذه المعلومات في كائن JSON وفقًا للمخطط المقدم. يجب أن يكون JSON باللغة العربية. بالنسبة لـ operatingHours، قم بإنشاء كائن بأسماء أيام الأسبوع العربية كمفاتيح. تأكد من ملء جميع الحقول بدقة. قم بإرجاع قائمة متنوعة من الأنشطة حتى لو كانت مغلقة حالياً، مع توضيح ساعات عملها.`;
    
    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: ACTIVITY_SCHEMA,
        },
        systemInstruction: 'أنت مساعد يقوم بتنسيق بيانات الأنشطة السياحية إلى JSON منظم باللغة العربية.'
    });

    const result = parseJsonResponse<ActivityResponse>(jsonResponse.text, 'ActivitiesFinder');

    if (!result || !Array.isArray(result.activities)) {
        console.warn("ActivitiesFinder did not return a valid activities array.", result);
        return [];
    }
    
    // Enrich with location data from grounding chunks if available
    const enrichedActivities = result.activities.map(activity => {
        const relevantPlaceChunk = groundingChunks?.find(chunk => 
            chunk.maps && activity.name.toLowerCase().includes(chunk.maps.title.toLowerCase())
        )?.maps;
        
        if (relevantPlaceChunk && relevantPlaceChunk.placeAnswerSources?.[0]?.latLng) {
            return {
                ...activity,
                location: {
                    latitude: relevantPlaceChunk.placeAnswerSources[0].latLng.latitude,
                    longitude: relevantPlaceChunk.placeAnswerSources[0].latLng.longitude
                },
                url: activity.url || relevantPlaceChunk.uri // Prefer AI url but fallback to grounding
            };
        }
        return activity;
    });

    return enrichedActivities;
};
// --- END: Activities Finder Function ---

// --- START: Travel Planner Functions ---
export const generateTripFramework = async (destination: string): Promise<ItineraryPlan> => {
    const prompt = `Create a flexible 3-day travel itinerary framework for a Muslim family visiting "${destination}". The framework should include a mix of activities like sightseeing, eating, and prayer times. Focus on general activity types, not specific places. The response must be a JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: TRIP_FRAMEWORK_SCHEMA,
        },
        systemInstruction: "You are a helpful travel assistant for Muslim families. Create structured, high-level itinerary frameworks in JSON format."
    });

    return parseJsonResponse<ItineraryPlan>(response.text, 'TripFramework');
};

export const getSuggestionsForStep = async (locationName: string, step: TripFrameworkStep): Promise<Suggestion[]> => {
    const prompt = `Find 2-3 specific, Muslim-friendly suggestions for the following step in a trip to ${locationName}:
    - Time: ${step.timeOfDay}
    - Activity: ${step.description}
    - Type: ${step.activityType}
    For restaurants, prioritize places that are certified Halal or explicitly offer Halal options. Use Google Maps to find real places with details like address, rating, and URL. Format the response as a JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            responseMimeType: "application/json",
            responseSchema: SUGGESTIONS_SCHEMA,
        },
        systemInstruction: "You are a travel agent specializing in Halal tourism. You provide specific, real-world suggestions based on user requests, using mapping tools to ensure accuracy. Your output is always in JSON format."
    });

    const result = parseJsonResponse<{ suggestions: Suggestion[] }>(response.text, 'Suggestions');
    return result.suggestions || [];
};
// --- END: Travel Planner Functions ---

// --- START: Nearby Places Function ---
export const getNearbyPlacesForMap = async (latitude: number, longitude: number): Promise<NearbyPlacesResponse> => {
    const prompt = `Find a diverse mix of about 10-15 interesting places near the coordinates ${latitude}, ${longitude}. Include a mix of halal-friendly restaurants, cafes, significant sights, and interesting shops. For each place, provide its name, exact coordinates, category, address, rating, and Google Maps URL. The category must be one of: 'restaurant', 'cafe', 'sight', 'shop', or 'other'. Respond only with a JSON object.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: latitude,
                        longitude: longitude
                    }
                }
            },
            responseMimeType: "application/json",
            responseSchema: NEARBY_PLACES_SCHEMA
        },
        systemInstruction: "You are a location-aware assistant that finds interesting places for users. You use mapping tools to get accurate data and provide it in a structured JSON format."
    });

    return parseJsonResponse<NearbyPlacesResponse>(response.text, 'NearbyPlaces');
};
// --- END: Nearby Places Function ---

// --- START: Phrase Translator Functions ---
export const generateCommonPhrasesForTravel = async (destination: string): Promise<CommonPhrasesResponse> => {
    const prompt = `Generate a list of common, essential travel phrases for a tourist visiting "${destination}".
    The phrases should be translated from Arabic to the primary local language.
    Include phonetic pronunciations. Organize them into logical categories like "Greetings", "Basics", "Shopping", "Dining", and "Emergency".
    The response must be a JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: PHRASES_SCHEMA,
        },
        systemInstruction: "You are a travel assistant that provides language help. Your output must be a well-structured JSON object."
    });

    return parseJsonResponse<CommonPhrasesResponse>(response.text, 'CommonPhrases');
};

export const translateCustomPhrase = async (phrase: string, language: string): Promise<Omit<Phrase, 'original'>> => {
    const prompt = `Translate the following Arabic phrase to ${language}: "${phrase}".
    Provide the translation and a simple phonetic pronunciation.
    The response must be a JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: TRANSLATE_PHRASE_SCHEMA,
        },
        systemInstruction: "You are a helpful translator. Your output is always a well-structured JSON object."
    });

    return parseJsonResponse<Omit<Phrase, 'original'>>(response.text, 'TranslatePhrase');
};
// --- END: Phrase Translator Functions ---

// FIX: Add function to generate a comprehensive travel guide.
// --- START: Traveler Guide Function ---
export const generateTravelGuide = async (location: string): Promise<TravelGuideResponse> => {
    const prompt = `Create a comprehensive travel guide for a Muslim traveler visiting "${location}". The guide should be practical, culturally sensitive, and provide all the necessary information for a smooth trip. Ensure the response is in Arabic and formatted as a JSON object according to the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: TRAVEL_GUIDE_SCHEMA,
        },
        systemInstruction: "You are an expert travel writer who creates detailed, well-structured travel guides for Muslim tourists. Your output must be a JSON object in Arabic, strictly adhering to the user's requested schema."
    });

    return parseJsonResponse<TravelGuideResponse>(response.text, 'TravelGuide');
};
// --- END: Traveler Guide Function ---
