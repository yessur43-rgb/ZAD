import { GoogleGenAI, GenerateContentResponse, Place as GeminiPlace, Type } from '@google/genai';
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
    NearbyPlacesResponse,
    ItineraryPlan,
    TripFrameworkStep,
    Suggestion,
    TravelGuideResponse,
    CommonPhrasesResponse,
    Phrase,
    PhraseTranslation,
    UserLocation
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
    NEARBY_PLACES_SCHEMA
} from '../constants';
import { getApiKey } from './apiKeyService';


const getAiClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key not found in storage.");
    }
    // FIX: Use the new GoogleGenAI class for initialization.
    return new GoogleGenAI({ apiKey });
};

/**
 * Validates a given API key by making a lightweight test call.
 * @param key The API key to validate.
 * @returns True if the key is valid, false otherwise.
 */
export const validateApiKey = async (key: string): Promise<boolean> => {
    try {
        // FIX: Use the new GoogleGenAI class for initialization.
        const testAi = new GoogleGenAI({ apiKey: key });
        // Use a very simple, low-cost model and prompt for validation
        await testAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: 'test' }] }],
        });
        return true; // If the call succeeds, the key is valid
    } catch (error) {
        console.error("API Key validation failed:", error);
        return false; // Any error during this test means the key is likely invalid
    }
};


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
  const ai = getAiClient();
  const imagePart = { inlineData: { data: base64Data, mimeType } };
  const textPart = { text: 'حلل صورة هذا المنتج الغذائي. ركز على قائمة المكونات لتحديد ما إذا كان حلالاً أم حراماً أم مشبوهاً. قدم تقييماً صحياً موجزاً. يجب أن تكون الإجابة بتنسيق JSON حصرياً باللغة العربية.' };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: PRODUCT_ANALYSIS_SCHEMA,
      systemInstruction: productSystemInstruction,
    },
  });

  return parseJsonResponse<GeminiResponse>(response.text, 'ProductAnalysis');
};

export const analyzeBarcode = async (barcode: string): Promise<GeminiResponse> => {
    const ai = getAiClient();
    const initialPrompt = `ابحث عن معلومات حول المنتج المرتبط بالباركود التالي: ${barcode}. ركز على العثور على قائمة المكونات الكاملة وأي معلومات حول شهادات الحلال.`;
    
    // Step 1: Get information using Google Search
    const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: initialPrompt,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: 'أنت مساعد بحث فعال يجمع معلومات المنتج من الويب.'
        }
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
            systemInstruction: productSystemInstruction
        },
    });

    return parseJsonResponse<GeminiResponse>(jsonResponse.text, 'BarcodeAnalysis');
};

const menuSystemInstruction = "أنت خبير في الطعام الحلال ومحلل قوائم طعام ذكي. مهمتك هي تحليل صورة قائمة الطعام بعمق، مع التركيز الشديد على الأطباق الرئيسية والمقبلات والحلويات. تجاهل المشروبات البسيطة والواضحة مثل الماء، الشاي، القهوة، والمشروبات الغازية ما لم تكن تحتوي على إضافات مشبوهة. هدفك هو مساعدة المستخدم المسلم على اتخاذ قرارات مستنيرة بشأن الوجبات المعقدة. لكل طبق، قدم تقييمًا واضحًا: 'حلال'، 'مشكوك فيه'، أو 'حرام'. للعناصر المشكوك فيها، قدم نصيحة عملية (مثال: 'اسأل عن مصدر اللحم' أو 'تأكد من خلو الصلصة من الكحول').";

export const analyzeMenuImage = async (base64Data: string, mimeType: string): Promise<HalalHaramListResponse> => {
  const ai = getAiClient();
  const imagePart = { inlineData: { data: base64Data, mimeType } };
  const textPart = { text: 'حلل صورة قائمة الطعام هذه. تجاهل المشروبات البديهية مثل الماء والشاي والقهوة. ركز على الأطباق الرئيسية والمقبلات والحلويات. حدد العناصر الحلال بشكل واضح، والعناصر التي قد تكون حراماً أو مشبوهة. لكل عنصر مشبوه، اشرح السبب وقدم سؤالاً محدداً يمكن للمستخدم طرحه على النادل. يجب أن تكون الإجابة بتنسيق JSON حصرياً باللغة العربية.' };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: HALAL_HARAM_LIST_SCHEMA,
      systemInstruction: menuSystemInstruction,
    },
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
    location: UserLocation | null
): Promise<{ text: string; places: Place[] }> => {
    const ai = getAiClient();
    const history = chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(p => ({text: p.text}))
    }));

    // Add explicit location context to the prompt for clarity
    const locationName = location?.name ? `في "${location.name}"` : 'بالقرب من موقعي الحالي';
    const finalQuery = `ابحث عن ${query} ${locationName}.`;


    // Strengthen the system instruction to be more flexible and return multiple results
    const systemInstruction = `أنت مساعد جغرافي خبير مهمتك هي إيجاد أفضل الأماكن للمستخدمين باستخدام خرائط جوجل. قدم دائماً قائمة متنوعة من 3-5 خيارات إن أمكن، وليس نتيجة واحدة فقط. **التزم بشدة بالمدينة المحددة في الاستعلام (مثل "إنترلاكن") ولا تخرج عنها.** إذا كان البحث يتضمن فئة ومصطلحًا (مثل "سوبر ماركت مخابز")، ففسر ذلك بمرونة: ابحث عن "مخابز" قد تكون مستقلة أو داخل "سوبر ماركت". الأولوية هي توفير خيارات مفيدة وذات صلة في المنطقة المجاورة مباشرة، ولكن إذا كانت النتائج قليلة، يمكنك توسيع نطاق البحث قليلاً ليشمل أماكن أبعد ولكن لا تزال داخل نفس المدينة. هدفك هو تزويد المستخدم بقائمة غنية بالخيارات القريبة وذات الصلة.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [...history, { role: 'user', parts: [{text: finalQuery}]}],
        config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
              retrievalConfig: location ? {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              } : undefined
            },
            systemInstruction: systemInstruction
        },
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
    query: string,
    startLocation: { latitude: number; longitude: number } | null
): Promise<{ text: string; places: Place[] }> => {
    const ai = getAiClient();
    
    const startStringForPrompt = (start === 'موقعي الحالي' && startLocation)
        ? `موقعي الحالي`
        : `"${start}"`;

    const fullQuery = `اعرض لي ${query} في الطريق من ${startStringForPrompt} إلى "${destination}".`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{text: fullQuery}]}],
        config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
              retrievalConfig: startLocation ? {
                latLng: {
                  latitude: startLocation.latitude,
                  longitude: startLocation.longitude
                }
              } : undefined
            },
            systemInstruction: 'أنت مساعد سفر متخصص في إيجاد محطات توقف مناسبة على طول طريق القيادة. استخدم أداة الخرائط للعثور على مواقع حقيقية. قدم قائمة متنوعة من 3-5 خيارات إن أمكن. أعط الأولوية للمواقع القريبة من المسار الرئيسي، ولكن يمكنك تضمين خيارات تتطلب انحرافًا بسيطًا (5-10 دقائق) إذا كانت ذات جودة عالية أو هي الوحيدة المتاحة. عند البحث عن "مساجد"، تأكد من استبعاد أماكن العبادة غير الإسلامية. يجب أن تكون جميع المواقع المقترحة يمكن الوصول إليها بالسيارة العادية. قدم ردًا موجزًا متبوعًا بقائمة الأماكن من الأداة.'
        },
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
    const ai = getAiClient();
    const prompt = `قدم شرحاً مفصلاً عن المكون التالي: "${ingredient}". وضح مصدره الشائع (حيواني، نباتي، صناعي)، استخداماته، وحكمه الشرعي في الإسلام مع ذكر أي خلافات بين الفقهاء إن وجدت. اجعل الإجابة واضحة ومباشرة.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'أنت باحث متخصص في علوم الأغذية والشريعة الإسلامية. قدم إجابات دقيقة ومفصلة حول المكونات الغذائية.'
        }
    });

    return response.text;
};

export const getHalalDishes = async (restaurantName: string): Promise<DishSuggestionResponse> => {
    const ai = getAiClient();
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
    const ai = getAiClient();
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
            responseSchema: HALAL_HARAM_LIST_SCHEMA,
            systemInstruction: "أنت محقق دقيق في الأطعمة الحلال. مهمتك هي تحليل قائمة الطعام أو المنتجات الشائعة لمؤسسة غذائية. ركز على الأطباق الرئيسية والمكونات المعقدة. تجاهل المشروبات البسيطة والواضحة مثل الماء، الشاي، والقهوة. هدفك هو تصنيف العناصر لمستخدم مسلم وتقديم نصائح واضحة وعملية."
        },
    });

    const result = parseJsonResponse<HalalHaramListResponse>(jsonResponse.text, 'HalalHaramList');
    result.source_description = sourceDescription;
    
    return result;
};

export const findParkingForPlace = async (place: Place): Promise<ParkingSuggestionResponse> => {
    const ai = getAiClient();
    const searchPrompt = `ابحث عن أفضل 2-3 خيارات لمواقف السيارات بالقرب من "${place.name}" في "${place.address || ''}". اذكر اسم الموقف، عنوانه الكامل، رابط خرائط جوجل، المسافة، تفاصيل الأسعار، وأي ملاحظات. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط PARKING_INFO_SCHEMA.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: searchPrompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });

    // The model with search grounding might not return a JSON string directly.
    // So we ask another model to format it.
    const formatResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following text, format the response as a JSON object that adheres to the PARKING_INFO_SCHEMA. Text: ${response.text}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: PARKING_INFO_SCHEMA,
        }
    });

    return parseJsonResponse<ParkingSuggestionResponse>(formatResponse.text, 'ParkingInfo');
};

export const findProductInStores = async (base64Data: string, mimeType: string, location: UserLocation): Promise<FindItResponse> => {
    const ai = getAiClient();
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

export const findProductInStoresByText = async (productName: string, location: UserLocation): Promise<FindItResponse> => {
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
    const ai = getAiClient();
    const prompt = `أحتاج معلومات مفصلة حول استيكر العبور (Vignette) لدولة "${country}". أريد معرفة الأسعار، فترات الصلاحية، أماكن الشراء، ملاحظات هامة، والموقع الرسمي للشراء إن وجد. قدم نصائح محددة للمسافرين القادمين بالسيارة من الدول المجاورة. أجب بتنسيق JSON حصرياً باللغة العربية بناءً على مخطط VIGNETTE_INFO_SCHEMA.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "أنت مساعد سفر خبير متخصص في لوائح السفر والمرور. قدم معلومات دقيقة وموجزة بناءً على عمليات البحث الموثوقة."
        },
    });

    const formatResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following text, format the response as a JSON object that adheres to the VIGNETTE_INFO_SCHEMA. Text: ${response.text}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: VIGNETTE_INFO_SCHEMA,
        }
    });
    
    const parsed = parseJsonResponse<VignetteDetailsResponse>(formatResponse.text, 'VignetteInfo');

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(c => c.web)
        .map(c => ({ title: c.web!.title, uri: c.web!.uri })) || [];
    
    parsed.sources = sources;

    return parsed;
};

export const identifyObjectOrPlace = async (base64Data: string, mimeType: string): Promise<IdentificationResponse> => {
    const ai = getAiClient();
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart = { text: 'تعرف على الكائن الرئيسي أو المعلم في هذه الصورة. إذا كان معلمًا أو مكانًا، قدم وصفًا موجزًا وعنوانه ورابط خرائط جوجل إن أمكن. أجب بتنسيق JSON باللغة العربية.' };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    const formatResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `From the text below, create a JSON object based on IDENTIFICATION_SCHEMA. Text: ${response.text}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: IDENTIFICATION_SCHEMA,
        }
    });
    
    return parseJsonResponse<IdentificationResponse>(formatResponse.text, 'Identification');
};

export const findActivities = async (
    location: { latitude: number; longitude: number } | string,
    query?: string
): Promise<Activity[]> => {
    const ai = getAiClient();
    const locationString = typeof location === 'string'
        ? `في "${location}"`
        : `بالقرب من موقعي الحالي`;
    
    const prompt = `ابحث عن أنشطة عائلية ممتعة ${locationString}. ${query ? `ركز على: "${query}"` : ''}. قدم النتائج بتنسيق JSON باللغة العربية.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: typeof location !== 'string' ? { latLng: location } : undefined,
            },
        }
    });
    
    const formatResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following text, generate a JSON response that follows the ACTIVITY_SCHEMA: ${response.text}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: ACTIVITY_SCHEMA
        }
    });

    const result = parseJsonResponse<ActivityResponse>(formatResponse.text, 'Activities');
    return result.activities;
};


export const getNearbyPlacesForMap = async (latitude: number, longitude: number): Promise<NearbyPlacesResponse> => {
    const ai = getAiClient();
    const prompt = "ابحث عن أماكن مثيرة للاهتمام بالقرب مني، بما في ذلك المطاعم والمقاهي والمعالم السياحية والمحلات التجارية.";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: { latLng: { latitude, longitude } },
            },
        },
    });
    
    const formatPrompt = `بناءً على النص التالي، قم بإنشاء استجابة JSON تتبع مخطط NEARBY_PLACES_SCHEMA. صنف كل مكان كـ 'restaurant', 'cafe', 'sight', 'shop', 'other'. النص: ${response.text}`;

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: NEARBY_PLACES_SCHEMA,
        },
    });

    return parseJsonResponse<NearbyPlacesResponse>(jsonResponse.text, 'NearbyPlaces');
};


const ITINERARY_FRAMEWORK_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING },
        framework: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    timeOfDay: { type: Type.STRING },
                    description: { type: Type.STRING },
                    activityType: { type: Type.STRING, enum: ['EAT', 'SIGHTSEEING', 'SHOPPING', 'ACTIVITY', 'TRAVEL', 'PRAYER'] }
                },
                required: ['timeOfDay', 'description', 'activityType']
            }
        }
    },
    required: ['locationName', 'framework']
};

const SUGGESTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    suggestionDescription: { type: Type.STRING },
                    address: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    userRatingsTotal: { type: Type.NUMBER },
                    url: { type: Type.STRING },
                    halalAssurance: { type: Type.STRING }
                },
                required: ['name', 'suggestionDescription']
            }
        }
    },
    required: ['suggestions']
};

export const generateTripFramework = async (destination: string): Promise<ItineraryPlan> => {
    const ai = getAiClient();
    const prompt = `أنشئ إطارًا مقترحًا لرحلة مناسبة للمسلمين إلى "${destination}". يجب أن يغطي 3 أيام، مع تقسيم كل يوم إلى صباح وبعد الظهر ومساء. لكل فترة زمنية، اقترح نوع نشاط عام (مثل: تناول الطعام، مشاهدة المعالم، صلاة). أجب بتنسيق JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: ITINERARY_FRAMEWORK_SCHEMA,
        },
    });
    return parseJsonResponse<ItineraryPlan>(response.text, 'ItineraryPlan');
};


export const getSuggestionsForStep = async (locationName: string, step: TripFrameworkStep): Promise<Suggestion[]> => {
    const ai = getAiClient();
    const prompt = `اقترح 3 خيارات محددة لـ "${step.description}" في "${locationName}" خلال فترة "${step.timeOfDay}". ابحث عن أماكن حلال مناسبة. أجب بتنسيق JSON.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
        }
    });
    
    const formatPrompt = `Based on the following text, create a JSON response that follows SUGGESTION_SCHEMA. Text: ${response.text}`;
    
    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: SUGGESTION_SCHEMA
        }
    });

    const parsed = parseJsonResponse<{ suggestions: Suggestion[] }>(jsonResponse.text, 'Suggestions');
    return parsed.suggestions;
};

// --- In-file Schemas for complex types ---
const TRAVEL_GUIDE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        locationInfo: {
            type: Type.OBJECT,
            properties: { city: { type: Type.STRING }, country: { type: Type.STRING }, generalDescription: { type: Type.STRING } },
            required: ["city", "country", "generalDescription"]
        },
        // other properties...
    },
    // Using a less strict schema for this large object
    required: ["locationInfo", "gettingAround", "money", "connectivity", "healthAndSafety", "localCulture", "muslimTravelerInfo", "practicalInfo"]
};

export const generateTravelGuide = async (location: string): Promise<TravelGuideResponse> => {
    const ai = getAiClient();
    const prompt = `أنشئ دليل سفر شامل للمسافر المسلم إلى "${location}". غطِّ المعلومات الأساسية، متطلبات الدخول، التنقل، المال، الصحة والسلامة، الثقافة المحلية، ومعلومات خاصة بالمسلمين (طعام حلال، مساجد). أجب بتنسيق JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
     const formatPrompt = `Based on the following text, create a JSON response that follows this structure: TravelGuideResponse. Make sure all required fields are present. Text: ${response.text}`;
    
    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formatPrompt,
        // Using a less strict schema due to complexity
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonResponse<TravelGuideResponse>(jsonResponse.text, 'TravelGuide');
};

const PHRASES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        languageName: { type: Type.STRING },
        langCode: { type: Type.STRING },
        categories: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    categoryName: { type: Type.STRING },
                    phrases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { original: { type: Type.STRING }, translated: { type: Type.STRING }, phonetic: { type: Type.STRING } },
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


export const generateCommonPhrasesForTravel = async (destination: string): Promise<CommonPhrasesResponse> => {
    const ai = getAiClient();
    const prompt = `أنشئ قائمة بالعبارات الشائعة والمفيدة للمسافر المسلم إلى "${destination}". حدد اللغة المحلية (واسمها ورمز BCP-47). قم بتضمين فئات مثل التحيات، والطعام، والتنقل، والطوارئ. لكل عبارة، قدم الأصل بالعربية، والترجمة، والنطق الصوتي. أجب بتنسيق JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: PHRASES_SCHEMA,
        }
    });
    return parseJsonResponse<CommonPhrasesResponse>(response.text, 'CommonPhrases');
};

const TRANSLATE_PHRASE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        translated: { type: Type.STRING },
        phonetic: { type: Type.STRING }
    },
    required: ['translated', 'phonetic']
};

export const translateCustomPhrase = async (text: string, language: string): Promise<PhraseTranslation> => {
    const ai = getAiClient();
    const prompt = `ترجم العبارة العربية التالية "${text}" إلى لغة "${language}". قدم الترجمة والنطق الصوتي بتنسيق JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: TRANSLATE_PHRASE_SCHEMA,
        }
    });
    return parseJsonResponse<PhraseTranslation>(response.text, 'PhraseTranslation');
};

export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Based on the coordinates latitude: ${latitude}, longitude: ${longitude}, what is the city and country? Respond with "City, Country" format only. For example: "Riyadh, Saudi Arabia".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: 'You are a helpful geography assistant that provides location names from coordinates.'
        }
    });

    return response.text.trim();
};
