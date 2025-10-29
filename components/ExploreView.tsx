import React from 'react';
import { TravelIcon } from './icons/TravelIcon';
import { UsersIcon } from './icons/UsersIcon';

type View = 'explore' | 'travel' | 'community' | 'tools' | 'history';

interface ExploreViewProps {
    setView: (view: View) => void;
}

const destinations = [
    { name: 'إسطنبول', country: 'تركيا', image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?q=80&w=1892&auto=format&fit=crop' },
    { name: 'كوالالمبور', country: 'ماليزيا', image: 'https://images.unsplash.com/photo-1589448324112-de4e59312607?q=80&w=1974&auto=format&fit=crop' },
    { name: 'مراكش', country: 'المغرب', image: 'https://images.unsplash.com/photo-1559922099-0a3c79a54483?q=80&w=1964&auto=format&fit=crop' },
    { name: 'لندن', country: 'بريطانيا', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop' },
    { name: 'البوسنة', country: 'والهرسك', image: 'https://images.unsplash.com/photo-1603289946953-339233644f1c?q=80&w=1964&auto=format&fit=crop' },
    { name: 'دبي', country: 'الإمارات', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1974&auto=format&fit=crop' },
];

const ExploreView: React.FC<ExploreViewProps> = ({ setView }) => {
    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">أين ستكون وجهتك القادمة؟</h1>
                <p className="mt-2 text-gray-700 dark:text-gray-300">استكشف وجهات ملهمة وابدأ التخطيط لرحلتك القادمة.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {destinations.map((dest) => (
                    <div 
                        key={dest.name}
                        className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300"
                        onClick={() => setView('travel')}
                    >
                        <img src={dest.image} alt={dest.name} className="w-full h-48 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                            <h3 className="font-bold text-lg md:text-xl">{dest.name}</h3>
                            <p className="text-sm opacity-90">{dest.country}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => setView('travel')} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                        <TravelIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">خطط لرحلتك</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">أنشئ خطة سفر مخصصة أو تصفح الخطط الجاهزة.</p>
                    </div>
                </div>
                 <div onClick={() => setView('community')} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-sky-100 dark:bg-sky-900/50 rounded-lg">
                        <UsersIcon className="w-7 h-7 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">نصائح المجتمع</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">اكتشف أفضل النصائح من المسافرين الآخرين.</p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ExploreView;