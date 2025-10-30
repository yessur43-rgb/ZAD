import React from 'react';
import { IdentificationResponse } from '../types';
import { InfoIcon } from './icons/InfoIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { LinkIcon } from './icons/LinkIcon';
import { FindItIcon } from './icons/FindItIcon';

interface IdentificationInfoCardProps {
  result: IdentificationResponse;
  onSearchForIt?: (itemName: string) => void;
}

const IdentificationInfoCard: React.FC<IdentificationInfoCardProps> = ({ result, onSearchForIt }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
      <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
        <span className="text-emerald-500">{result.name}</span>
      </h3>
      
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          <InfoIcon className="w-6 h-6 text-sky-500" />
          <span>معلومات</span>
        </h4>
        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
          {result.description}
        </p>
      </div>

      {(result.address || result.googleMapsUrl) && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            <MapPinIcon className="w-6 h-6 text-fuchsia-500" />
            <span>الموقع</span>
          </h4>
          <div className="space-y-3">
              {result.address && (
                <p className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-700 dark:text-gray-300">
                    {result.address}
                </p>
              )}
              {result.googleMapsUrl && (
                <a href={result.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors font-bold">
                    <LinkIcon className="w-5 h-5 flex-shrink-0" />
                    <span>عرض على خرائط جوجل</span>
                </a>
              )}
          </div>
        </div>
      )}

      {onSearchForIt && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onSearchForIt(result.name)}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <FindItIcon className="w-6 h-6" />
            <span>🔍 ابحث عن أماكن شرائه</span>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            ابحث عن المتاجر القريبة التي تبيع هذا المنتج
          </p>
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

export default IdentificationInfoCard;