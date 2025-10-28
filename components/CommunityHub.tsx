import React, { useState, useEffect } from 'react';
import { CommunityTip, TipCategory } from '../types';
import { getCommunityTips, saveCommunityTip, upvoteCommunityTip } from '../utils/storage';
import { UsersIcon } from './icons/UsersIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';

const categoryTranslations: Record<TipCategory, string> = {
    food: 'طعام',
    sights: 'معالم',
    transport: 'مواصلات',
    general: 'نصائح عامة'
};

const categoryColors: Record<TipCategory, string> = {
    food: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    sights: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
    transport: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200',
    general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

const CommunityHub: React.FC = () => {
    const [location, setLocation] = useState<string>('');
    const [searchedLocation, setSearchedLocation] = useState<string>('');
    const [tips, setTips] = useState<CommunityTip[]>([]);
    
    const [newTipContent, setNewTipContent] = useState('');
    const [newTipCategory, setNewTipCategory] = useState<TipCategory>('general');
    const [isAdding, setIsAdding] = useState(false);
    
    useEffect(() => {
        if (searchedLocation) {
            const loadedTips = getCommunityTips(searchedLocation);
            setTips(loadedTips);
        }
    }, [searchedLocation]);

    const handleSearch = () => {
        if (!location.trim()) return;
        setSearchedLocation(location);
    };

    const handleAddTip = () => {
        if (!newTipContent.trim() || !searchedLocation) return;
        const updatedTips = saveCommunityTip(searchedLocation, newTipContent, newTipCategory);
        setTips(updatedTips);
        setNewTipContent('');
        setNewTipCategory('general');
        setIsAdding(false);
    };

    const handleUpvote = (tipId: string) => {
        const updatedTips = upvoteCommunityTip(searchedLocation, tipId);
        setTips(updatedTips);
    };

    const TipCard: React.FC<{ tip: CommunityTip }> = ({ tip }) => (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[tip.category]}`}>
                    {categoryTranslations[tip.category]}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(tip.timestamp).toLocaleDateString('ar-SA')}
                </span>
            </div>
            <p className="my-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tip.content}</p>
            <div className="flex justify-end">
                <button
                    onClick={() => handleUpvote(tip.id)}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/50 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
                >
                    <ArrowUpIcon className="w-4 h-4" />
                    <span>{tip.upvotes}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">مركز المجتمع</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">شارك واستكشف نصائح السفر من المسافرين الآخرين.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="أدخل مدينة أو دولة (مثال: لندن، بريطانيا)"
                        className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!location.trim()}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center justify-center"
                    >
                        <UsersIcon className="w-5 h-5" />
                        <span className="ml-2">ابحث أو أنشئ</span>
                    </button>
                </div>

                <div className="w-full mt-8">
                    {searchedLocation ? (
                        <div className="animate-fade-in">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                                نصائح المسافرين لـ <span className="text-emerald-500">{searchedLocation}</span>
                            </h3>

                            {isAdding ? (
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
                                    <textarea
                                        value={newTipContent}
                                        onChange={(e) => setNewTipContent(e.target.value)}
                                        placeholder="اكتب نصيحتك هنا..."
                                        rows={4}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <div className="mt-2 flex flex-col sm:flex-row items-center gap-3">
                                        <select
                                            value={newTipCategory}
                                            onChange={(e) => setNewTipCategory(e.target.value as TipCategory)}
                                            className="w-full sm:w-auto p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                                        >
                                            <option value="general">نصائح عامة</option>
                                            <option value="food">طعام</option>
                                            <option value="sights">معالم</option>
                                            <option value="transport">مواصلات</option>
                                        </select>
                                        <div className="flex-grow flex gap-2 w-full sm:w-auto">
                                            <button onClick={handleAddTip} className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700">أضف</button>
                                            <button onClick={() => setIsAdding(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">إلغاء</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-lg hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span>أضف نصيحتك لهذه الوجهة</span>
                                </button>
                            )}
                            
                            {tips.length > 0 ? (
                                <div className="space-y-4">
                                    {tips.map(tip => <TipCard key={tip.id} tip={tip} />)}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <p>كن أول من يضيف نصيحة لهذه الوجهة!</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 dark:text-gray-500 pt-12">
                            <UsersIcon className="w-20 h-20 mx-auto mb-4" />
                            <p>ابحث عن وجهة لبدء استكشاف نصائح المجتمع.</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default CommunityHub;