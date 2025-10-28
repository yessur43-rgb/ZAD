import React, { useState, Fragment } from 'react';
import { generateCommonPhrasesForTravel, translateCustomPhrase } from '../services/geminiService';
import { CommonPhrasesResponse, Phrase } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { TranslatorIcon } from './icons/TranslatorIcon';

const PhraseTranslator: React.FC = () => {
    const [destination, setDestination] = useState<string>('');
    const [commonPhrases, setCommonPhrases] = useState<CommonPhrasesResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [customText, setCustomText] = useState('');
    const [customTranslation, setCustomTranslation] = useState<Phrase | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleSearch = async () => {
        if (!destination.trim()) return;
        setIsLoading(true);
        setError(null);
        setCommonPhrases(null);
        setCustomTranslation(null);
        setCustomText('');

        try {
            const result = await generateCommonPhrasesForTravel(destination);
            setCommonPhrases(result);
        } catch (err) {
            console.error(err);
            setError(`حدث خطأ أثناء جلب العبارات لـ "${destination}". يرجى المحاولة مرة أخرى.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranslateCustom = async () => {
        if (!customText.trim() || !commonPhrases) return;
        setIsTranslating(true);
        setCustomTranslation(null);
        try {
            const result = await translateCustomPhrase(customText, commonPhrases.languageName);
            setCustomTranslation({ original: customText, ...result });
        } catch (e) {
            console.error(e);
            // Handle error specifically for custom translation if needed
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSpeak = (text: string, langCode: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode;
            utterance.rate = 0.9;
            window.speechSynthesis.cancel(); // Cancel any previous speech
            window.speechSynthesis.speak(utterance);
        } else {
            alert('متصفحك لا يدعم خاصية النطق الصوتي.');
        }
    };

    const renderPhraseRow = (phrase: Phrase) => (
        <div key={phrase.original} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between gap-4">
            <div className="flex-grow">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{phrase.translated}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{phrase.phonetic}"</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{phrase.original}</p>
            </div>
            <button
                onClick={() => handleSpeak(phrase.translated, commonPhrases!.langCode)}
                className="p-3 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition"
                aria-label={`انطق "${phrase.translated}"`}
            >
                <SpeakerWaveIcon className="w-6 h-6" />
            </button>
        </div>
    );
    
    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">مترجم العبارات الذكي</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">احصل على ترجمة ونطق للعبارات الأساسية في أي وجهة.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="أدخل وجهة السفر (مثال: طوكيو، اليابان)"
                        className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !destination.trim()}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : <TranslatorIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? 'جاري البحث...' : 'ابحث'}</span>
                    </button>
                </div>

                <div className="w-full mt-8">
                    {isLoading && <div className="text-center text-gray-500"><p>...جاري تحديد اللغة وإعداد العبارات</p></div>}
                    {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
                    
                    {commonPhrases && (
                        <div className="animate-fade-in space-y-8">
                             <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">ترجمة مخصصة ({commonPhrases.languageName})</h3>
                                <div className="flex flex-col sm:flex-row gap-2">
                                     <input
                                        type="text"
                                        value={customText}
                                        onChange={(e) => setCustomText(e.target.value)}
                                        placeholder="اكتب العبارة التي تريد ترجمتها هنا"
                                        className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        disabled={isTranslating}
                                    />
                                    <button
                                        onClick={handleTranslateCustom}
                                        disabled={isTranslating || !customText.trim()}
                                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
                                    >
                                        {isTranslating ? <LoadingSpinner /> : 'ترجم'}
                                    </button>
                                </div>
                                {customTranslation && <div className="mt-4">{renderPhraseRow(customTranslation)}</div>}
                            </div>
                            
                            {commonPhrases.categories.map(category => (
                                <div key={category.categoryName}>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{category.categoryName}</h3>
                                    <div className="space-y-3">
                                        {category.phrases.map(renderPhraseRow)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!isLoading && !commonPhrases && !error && (
                        <div className="text-center text-gray-400 dark:text-gray-500 pt-12">
                            <TranslatorIcon className="w-20 h-20 mx-auto mb-4" />
                            <p>أدخل وجهتك أعلاه لتبدأ.</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PhraseTranslator;