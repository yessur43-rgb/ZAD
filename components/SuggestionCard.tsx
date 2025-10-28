import React from 'react';
import { Suggestion } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';
import StarRating from './StarRating';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onSelect: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onSelect }) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
    <div className="flex justify-between items-start">
        <div>
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{suggestion.name}</h4>
             {suggestion.rating && (
                <div className="mt-1 flex items-center gap-1.5">
                    <StarRating rating={suggestion.rating} />
                    {suggestion.userRatingsTotal && (
                        <span className="text-xs text-gray-400">({suggestion.userRatingsTotal.toLocaleString('ar-SA')} تقييم)</span>
                    )}
                </div>
            )}
        </div>
        <button 
            onClick={onSelect}
            className="px-3 py-1.5 text-xs bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-transform active:scale-95 flex-shrink-0"
        >
            أضف للخطة
        </button>
    </div>

    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{suggestion.suggestionDescription}</p>
    
    {suggestion.address && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <MapPinIcon className="h-3 w-3 flex-shrink-0" />
            <span>{suggestion.address}</span>
        </div>
    )}

    {suggestion.halalAssurance && (
        <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-md">
            <div className="flex items-start gap-2">
                 <CheckBadgeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                 <div>
                    <h5 className="font-semibold text-xs text-emerald-800 dark:text-emerald-200">تأكيد حلال</h5>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">{suggestion.halalAssurance}</p>
                 </div>
            </div>
        </div>
    )}
    
    {suggestion.url && (
        <a
          href={suggestion.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
        >
          عرض على الخرائط &rarr;
        </a>
    )}
  </div>
);

export default SuggestionCard;