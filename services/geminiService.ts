import { GoogleGenAI, GenerateContentResponse, Place as GeminiPlace } from '@google/genai';
import { 
    GeminiResponse, 
    ChatMessage, 
    Place, 
    DishSuggestionResponse, 
    ParkingSuggestionResponse,
    FindItResponse, 
    VignetteDetailsResponse,
    ItineraryPlan,
    TripFrameworkStep,
    Suggestion,
    HalalHaramListResponse,
    TravelGuideResponse,
    CommonPhrasesResponse,
    Phrase,
    ActivityResponse,
    Activity
} from '../types';
import { 
    PRODUCT_ANALYSIS_SCHEMA, 
    DISH_SUGGESTION_SCHEMA, 
    PARKING_INFO_SCHEMA,
    FIND_PRODUCT_SCHEMA, 
    VIGNETTE_INFO_SCHEMA,
    TRIP_FRAMEWORK_SCHEMA,
    SUGGESTIONS_SCHEMA,
    FRAMEWORK_PROMPT,
    SUGGESTION_PROMPT,
    HALAL_HARAM_LIST_SCHEMA,
    TRAVEL_GUIDE_SCHEMA,
    PHRASES_SCHEMA,
    TRANSLATED_PHRASE_SCHEMA,
    ACTIVITY_SCHEMA
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

// --- START: Interactive Travel Planner Functions ---

export const generateTripFramework = async (destination: string): Promise<ItineraryPlan> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: FRAMEWORK_PROMPT(destination),
        config: {
            responseMimeType: "application/json",
            responseSchema: TRIP_FRAMEWORK_SCHEMA,
        },
        systemInstruction: 'أنت مساعد تخطيط رحلات للمسلمين. قم بإنشاء إطار عمل مرن وقابل للتخصيص.'
    });

    return parseJsonResponse<ItineraryPlan>(response.text, 'TripFramework');
};

export const getSuggestionsForStep = async (locationName: string, step: TripFrameworkStep): Promise<Suggestion[]> => {
    const prompt = SUGGESTION_PROMPT(locationName, step.description);

    // Step 1: Use Google Maps/Search to find places
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {}, googleSearch: {} }],
        },
        systemInstruction: 'أنت خبير سفر للمسلمين، استخدم الأدوات للعثور على أفضل الاقتراحات العملية.'
    });

    const context = searchResponse.text;
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    let groundingContext = '';
    if (groundingChunks) {
        groundingContext = groundingChunks.map(chunk => {
            if (chunk.maps) return `Map Result: ${chunk.maps.title} at ${chunk.maps.placeAnswerSources?.[0]?.address || 'address unknown'}. Rating: ${chunk.maps.placeAnswerSources?.[0]?.rating || 'N/A'}.`;
            if (chunk.web) return `Web Result: ${chunk.web.title} - ${chunk.web.snippet || 'No snippet'}`;
            return '';
        }).join('\n');
    }

    const fullContext = `Search results text: ${context}\n\nGrounding Data:\n${groundingContext}`;

    // Step 2: Format the results into structured JSON
    const formatPrompt = `بناءً على معلومات البحث التالية لـ"${step.description}" في "${locationName}":\n\n${fullContext}\n\nقدم 2-3 اقتراحات مفصلة بتنسيق JSON. ركز على توفير وصف مقنع وتأكيد حالة الحلال.`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: SUGGESTIONS_SCHEMA
        },
        systemInstruction: 'أنت مساعد سفر يقوم بتنسيق بيانات الاقتراحات إلى JSON منظم.'
    });

    // FIX: Corrected the type to ensure the 'name' property is not omitted from the parsed suggestions.
    // The original `Omit<Suggestion, keyof Place>` incorrectly removed 'name', but the AI schema provides it.
    const suggestions = parseJsonResponse<Omit<Suggestion, Exclude<keyof Place, 'name'>>[]>(jsonResponse.text, 'Suggestions');
    
    // Attempt to enrich suggestions with place data from grounding
    const enrichedSuggestions: Suggestion[] = suggestions.map(sugg => {
        // Find the most relevant place from grounding chunks
        const relevantPlaceChunk = groundingChunks?.find(chunk => 
            chunk.maps && chunk.maps.title.toLowerCase().includes(sugg.name.toLowerCase())
        )?.maps;
        
        const placeDetails = relevantPlaceChunk ? mapGeminiPlaceToPlace(relevantPlaceChunk) : {};

        return {
            ...sugg,
            ...placeDetails,
            name: sugg.name, // ensure the AI-generated name is preserved
        };
    });

    return enrichedSuggestions;
};

// --- END: Interactive Travel Planner Functions ---

// --- START: Traveler's Guide Function ---
export const generateTravelGuide = async (location: string): Promise<TravelGuideResponse> => {
    const prompt = `أنت خبير سفر عالمي. قم بإنشاء دليل سفر شامل ومفصل باللغة العربية لـ "${location}".
يجب أن يكون الدليل عمليًا ومفيدًا للمسافرين من جميع الخلفيات، مع قسم خاص للمسافرين المسلمين.
قم بتغطية جميع الجوانب من الوصول إلى المغادرة.
يجب أن تكون الإجابة بتنسيق JSON حصرياً.
العبارات المفيدة يجب أن تكون خمس عبارات أساسية: مرحباً، شكراً لك، بكم هذا؟، أين هو ...؟، وداعاً.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: TRAVEL_GUIDE_SCHEMA,
        },
        systemInstruction: 'أنت مساعد سفر عالمي يقوم بإنشاء أدلة مفصلة ومنظمة بتنسيق JSON باللغة العربية.'
    });

    return parseJsonResponse<TravelGuideResponse>(response.text, 'TravelGuide');
};
// --- END: Traveler's Guide Function ---

// --- START: Phrase Translator Functions ---

export const generateCommonPhrasesForTravel = async (destination: string): Promise<CommonPhrasesResponse> => {
    const prompt = `أنت خبير لغات للمسافرين. قم بإنشاء قائمة من العبارات الشائعة والمفيدة باللغة العربية وترجمتها إلى اللغة المحلية لمدينة "${destination}".
    قم بتضمين:
    1.  اسم اللغة (languageName).
    2.  رمز اللغة BCP-47 (langCode) لاستخدامه في النطق الصوتي.
    3.  قم بتصنيف العبارات إلى فئات مثل "التحيات", "الطعام والمطاعم", "التسوق", "الطوارئ".
    4.  لكل عبارة، قدم النص الأصلي بالعربية، الترجمة، والنطق الصوتي المبسط.
    
    يجب أن تكون الإجابة بتنسيق JSON حصرياً.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: PHRASES_SCHEMA,
        },
        systemInstruction: 'أنت مساعد لغوي للمسافرين، قم بإنشاء قوائم عبارات منظمة بتنسيق JSON.'
    });

    return parseJsonResponse<CommonPhrasesResponse>(response.text, 'CommonPhrases');
};

export const translateCustomPhrase = async (text: string, languageName: string): Promise<Omit<Phrase, 'original'>> => {
    const prompt = `Translate the following Arabic phrase to ${languageName}. Provide the translation and a simple phonetic pronunciation.
    Phrase: "${text}"
    Respond in JSON format.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: TRANSLATED_PHRASE_SCHEMA,
        },
        systemInstruction: 'You are a highly accurate translator. Provide the translation and phonetics in JSON format.'
    });

    return parseJsonResponse<Omit<Phrase, 'original'>>(response.text, 'TranslateCustomPhrase');
};

// --- END: Phrase Translator Functions ---

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