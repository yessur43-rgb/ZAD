import React from 'react';
import { HalalHaramListResponse } from '../types';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { WarningIcon } from './icons/WarningIcon';

interface MenuResultCardProps {
  result: HalalHaramListResponse;
}

const MenuResultCard: React.FC<MenuResultCardProps> = ({ result }) => {
  const { halalItems, haramOrMushboohItems, source_description } = result;

  return (
    <div className="w-full max-w-2xl p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">تحليل القائمة</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{source_description}</p>
        
        {/* Halal Items */}
        {halalItems.length > 0 && (
            <div className="mb-6">
                <h4 className="flex items-center gap-2 font-semibold text-lg text-emerald-800 dark:text-emerald-200 mb-3">
                    <ThumbsUpIcon className="w-6 h-6" /> 
                    <span>أصناف حلال غالباً</span>
                </h4>
                <div className="space-y-2">
                    {halalItems.map(item => (
                        <div key={item.name} className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <p className="font-semibold text-md text-emerald-900 dark:text-emerald-100">{item.name}</p>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">{item.note}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Haram/Mushbooh Items */}
        {haramOrMushboohItems.length > 0 && (
            <div>
                <h4 className="flex items-center gap-2 font-semibold text-lg text-red-800 dark:text-red-200 mb-3">
                    <WarningIcon className="w-6 h-6" /> 
                    <span>أصناف تتطلب الحذر (حرام أو مشبوه)</span>
                </h4>
                <div className="space-y-2">
                    {haramOrMushboohItems.map(item => (
                        <div key={item.name} className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border-l-4 border-red-500">
                            <p className="font-semibold text-md text-red-900 dark:text-red-100">{item.name}</p>
                            <p className="text-sm text-red-700 dark:text-red-300">{item.note}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {(halalItems.length === 0 && haramOrMushboohItems.length === 0) && (
             <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                <p>لم نتمكن من تحديد أي عناصر من القائمة. يرجى التأكد من أن الصورة واضحة ومقروءة.</p>
            </div>
        )}
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

export default MenuResultCard;