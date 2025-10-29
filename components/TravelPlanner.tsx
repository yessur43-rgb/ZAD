import React, { useState } from 'react';
import { generateTripFramework, getSuggestionsForStep } from '../services/geminiService';
import { ItineraryPlan, TripFrameworkStep, Suggestion, ActivityType } from '../types';
import { TravelIcon } from './icons/TravelIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import SuggestionCard from './SuggestionCard';
import { RestaurantIcon } from './icons/RestaurantIcon';
import { SightseeingIcon } from './icons/SightseeingIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { CarIcon } from './icons/CarIcon';
import { MosqueIcon } from './icons/MosqueIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { MapPinIcon } from './icons/MapPinIcon';

const activityIconMap: Record<ActivityType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    EAT: RestaurantIcon,
    SIGHTSEEING: SightseeingIcon,
    SHOPPING: ShoppingBagIcon,
    ACTIVITY: SightseeingIcon,
    TRAVEL: CarIcon,
    PRAYER: MosqueIcon,
};

const TravelPlanner: React.FC = () => {
    const [destination, setDestination] = useState<string>('');
    const [plan, setPlan] = useState<ItineraryPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateFramework = async () => {
        if (!destination.trim()) return;
        setIsLoading(true);
        setError(null);
        setPlan(null);
        try {
            const result = await generateTripFramework(destination);
            setPlan(result);
        } catch (err) {
            setError('حدث خطأ أثناء إنشاء إطار الرحلة. يرجى المحاولة مرة أخرى باسم مدينة واضح.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindSuggestions = async (stepIndex: number) => {
        if (!plan) return;
        const step = plan.framework[stepIndex];
        setLoadingStep(step.timeOfDay);
        try {
            const suggestions = await getSuggestionsForStep(plan.locationName, step);
            setPlan(prevPlan => {
                if (!prevPlan) return null;
                const newFramework = [...prevPlan.framework];
                newFramework[stepIndex] = { ...newFramework[stepIndex], suggestions };
                return { ...prevPlan, framework: newFramework };
            });
        } catch (e) {
            console.error(e);
            // Optionally set an error state for this specific step
        } finally {
            setLoadingStep(null);
        }
    };

    const handleSelectSuggestion = (stepIndex: number, suggestion: Suggestion) => {
        if (!plan) return;
        setPlan(prevPlan => {
            if (!prevPlan) return null;
            const newFramework = [...prevPlan.framework];
            // Set the chosen suggestion and clear other suggestions for a cleaner UI
            newFramework[stepIndex] = { ...newFramework[stepIndex], chosenSuggestion: suggestion, suggestions: undefined };
            return { ...prevPlan, framework: newFramework };
        });
    };
    
    const handleResetStep = (stepIndex: number) => {
        if (!plan) return;
        setPlan(prevPlan => {
            if (!prevPlan) return null;
            const newFramework = [...prevPlan.framework];
            // Destructure to remove chosenSuggestion and suggestions
            const { chosenSuggestion, suggestions, ...restOfStep } = newFramework[stepIndex];
            newFramework[stepIndex] = restOfStep; // Assign back the step without the choices
            return { ...prevPlan, framework: newFramework };
        });
    };

    const renderFrameworkStep = (step: TripFrameworkStep, index: number) => {
        const Icon = activityIconMap[step.activityType] || TravelIcon;

        return (
            <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                        <Icon className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-gray-500 dark:text-gray-400">{step.timeOfDay}</p>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{step.description}</h4>
                    </div>
                </div>
                
                <div className="mt-4 pl-16">
                    {step.chosenSuggestion ? (
                        <div className="animate-fade-in">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg border-l-4 border-emerald-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-xs text-emerald-800 dark:text-emerald-200">الخيار المختار:</p>
                                        <h4 className="font-bold text-lg text-emerald-900 dark:text-emerald-100">{step.chosenSuggestion.name}</h4>
                                    </div>
                                    <button
                                        onClick={() => handleResetStep(index)}
                                        className="text-xs font-semibold text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50"
                                    >
                                        تغيير
                                    </button>
                                </div>
                                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{step.chosenSuggestion.suggestionDescription}</p>
                                {step.chosenSuggestion.address && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                                        <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                                        <span>{step.chosenSuggestion.address}</span>
                                    </div>
                                )}
                                {step.chosenSuggestion.halalAssurance && (
                                    <div className="mt-2 p-2 bg-emerald-100 dark:bg-emerald-800/60 rounded-md text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                                        <CheckBadgeIcon className="h-4 w-4 flex-shrink-0" />
                                        <span>{step.chosenSuggestion.halalAssurance}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {step.suggestions ? (
                                <div className="space-y-3">
                                    <h5 className="font-semibold">الاقتراحات:</h5>
                                    {step.suggestions.map((s, sIndex) => (
                                        <SuggestionCard 
                                            key={sIndex} 
                                            suggestion={s} 
                                            onSelect={() => handleSelectSuggestion(index, s)}
                                        />
                                    ))}
                                    {step.suggestions.length === 0 && <p className="text-sm text-gray-500">لم يتم العثور على اقتراحات محددة لهذه الخطوة.</p>}
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleFindSuggestions(index)}
                                    disabled={loadingStep === step.timeOfDay}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition"
                                >
                                    {loadingStep === step.timeOfDay ? <LoadingSpinner /> : <ChevronDownIcon className="w-5 h-5" />}
                                    <span>{loadingStep === step.timeOfDay ? 'جاري البحث...' : 'ابحث عن خيارات'}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">مساعد السفر التفاعلي</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">أدخل وجهتك، وسنساعدك في بناء خطة سفر حلال خطوة بخطوة.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerateFramework()}
                        placeholder="مثال: إنترلاكن، سويسرا"
                        className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerateFramework}
                        disabled={isLoading || !destination.trim()}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : <TravelIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? 'جاري الإعداد...' : 'ابدأ التخطيط'}</span>
                    </button>
                </div>

                <div className="w-full mt-8">
                    {isLoading && <div className="text-center text-gray-500"><p>...نضع إطار رحلتك، لحظات من فضلك</p></div>}
                    {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
                    
                    {plan && (
                        <div className="animate-fade-in">
                            <h3 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
                                إطار رحلتك إلى <span className="text-emerald-500">{plan.locationName}</span>
                            </h3>
                            <div className="space-y-4">
                                {plan.framework.map(renderFrameworkStep)}
                            </div>
                        </div>
                    )}
                    
                    {!isLoading && !plan && !error && (
                        <div className="text-center text-gray-400 dark:text-gray-500 pt-12">
                            <TravelIcon className="w-20 h-20 mx-auto mb-4" />
                            <p>أين ستكون وجهتك القادمة؟</p>
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

export default TravelPlanner;
