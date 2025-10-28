import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';

// --- Start: Audio Helper Functions (as per Gemini SDK guidelines) ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End: Audio Helper Functions ---

const languages = [
  { code: 'ar-SA', name: 'العربية' },
  { code: 'en-US', name: 'English' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'es-ES', name: 'Español' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'zh-CN', name: '中文 (简体)' },
];

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const LiveTranslator: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [sourceLang, setSourceLang] = useState('ar-SA');
    const [targetLang, setTargetLang] = useState('en-US');
    const [conversation, setConversation] = useState<{ transcript: string, translation: string }[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [currentTranslation, setCurrentTranslation] = useState('');
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);


    const translateTextStream = useCallback(async (text: string, source: string, target: string) => {
        if (!text.trim()) return;

        abortControllerRef.current = new AbortController();
        const sourceLangName = languages.find(l => l.code === source)?.name || source;
        const targetLangName = languages.find(l => l.code === target)?.name || target;
        const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}:\n\n${text}`;
        
        try {
            const response = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            for await (const chunk of response) {
                 if (abortControllerRef.current?.signal.aborted) {
                    console.log("Translation aborted");
                    break;
                }
                setCurrentTranslation(prev => prev + chunk.text);
            }
        } catch (e) {
            console.error("Translation error:", e);
            setError("حدث خطأ أثناء الترجمة.");
        }
    }, []);

    const stopListening = useCallback(() => {
        setIsListening(false);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());

        if (currentTranscript) {
            setConversation(prev => [...prev, { transcript: currentTranscript, translation: currentTranslation }]);
            setCurrentTranscript('');
            setCurrentTranslation('');
        }
    }, [currentTranscript, currentTranslation]);

    const startListening = async () => {
        setIsListening(true);
        setError(null);
        setCurrentTranscript('');
        setCurrentTranslation('');

        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setCurrentTranscript(prev => prev + text);
                            // Debounce or chunk translation calls if needed, for now streaming translation on every update
                            if (abortControllerRef.current) abortControllerRef.current.abort();
                            translateTextStream(currentTranscript + text, sourceLang, targetLang);
                        }
                        if (message.serverContent?.turnComplete) {
                            setConversation(prev => [...prev, { transcript: currentTranscript, translation: currentTranslation }]);
                            setCurrentTranscript('');
                            setCurrentTranslation('');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
                        stopListening();
                    },
                    onclose: () => {
                        console.log('Session closed.');
                    },
                }
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error(err);
            setError("لم نتمكن من الوصول إلى الميكروفون. يرجى منح الإذن والمحاولة مرة أخرى.");
            setIsListening(false);
        }
    };
    
    useEffect(() => {
        return () => stopListening(); // Cleanup on unmount
    }, [stopListening]);

    return (
        <div className="flex flex-col items-center p-4 h-full" dir="rtl">
            <div className="w-full max-w-4xl flex flex-col h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">المترجم الفوري</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">تحدث مباشرة واحصل على ترجمة فورية.</p>
                </div>

                <div className="my-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="source-lang" className="font-semibold">من:</label>
                        <select id="source-lang" value={sourceLang} onChange={e => setSourceLang(e.target.value)} disabled={isListening} className="p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                            {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="target-lang" className="font-semibold">إلى:</label>
                        <select id="target-lang" value={targetLang} onChange={e => setTargetLang(e.target.value)} disabled={isListening} className="p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                            {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="text-center my-4">
                    <button onClick={isListening ? stopListening : startListening} className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {isListening && <div className="w-8 h-8 bg-white rounded-md animate-pulse" />}
                        {!isListening && <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                    </button>
                </div>

                {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="font-bold text-lg mb-2 flex-shrink-0">النص الأصلي</h3>
                        <div className="overflow-y-auto flex-grow space-y-2">
                            {conversation.map((turn, index) => (
                                <p key={`t-${index}`} className="pb-2 border-b border-gray-200 dark:border-gray-700">{turn.transcript}</p>
                            ))}
                             <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentTranscript}</p>
                        </div>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="font-bold text-lg mb-2 flex-shrink-0">الترجمة</h3>
                         <div className="overflow-y-auto flex-grow space-y-2">
                            {conversation.map((turn, index) => (
                                <p key={`tr-${index}`} className="pb-2 border-b border-gray-200 dark:border-gray-700">{turn.translation}</p>
                            ))}
                             <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentTranslation}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTranslator;
