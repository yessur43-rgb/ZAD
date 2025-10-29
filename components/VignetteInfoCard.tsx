import React from 'react';
import { VignetteDetailsResponse } from '../types';
import { InfoIcon } from './icons/InfoIcon';
import { PriceTagIcon } from './icons/PriceTagIcon';
import { StoreIcon } from './icons/StoreIcon';
import { WarningIcon } from './icons/WarningIcon';
import { LinkIcon } from './icons/LinkIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { MapPinIcon } from './icons/MapPinIcon';

interface VignetteInfoCardProps {
  result: VignetteDetailsResponse;
}

const VignetteInfoCard: React.FC<VignetteInfoCardProps> = ({ result }) => {
  const { details, sources } = result;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
      <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
        استيكر العبور لـ <span className="text-emerald-500">{details.country}</span>
      </h3>
      
      {/* General Description */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          <InfoIcon className="w-6 h-6 text-sky-500" />
          <span>نظرة عامة</span>
        </h4>
        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          {details.generalDescription}
        </p>
      </div>

      {/* Prices */}
      {details.prices && details.prices.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            <PriceTagIcon className="w-6 h-6 text-amber-500" />
            <span>الأسعار والصلاحية</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {details.prices.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{item.price}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.validity}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.vehicleType}</p>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Locations */}
       <div className="mb-6">
            <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                <StoreIcon className="w-6 h-6 text-emerald-500" />
                <span>أماكن الشراء</span>
            </h4>
            <div className="space-y-3">
                {details.officialWebsite && (
                    <a href={details.officialWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors">
                        <CheckBadgeIcon className="w-6 h-6 flex-shrink-0" />
                        <div className="flex-grow">
                            <span className="font-bold">الموقع الرسمي للشراء عبر الإنترنت</span>
                            <span className="block text-xs opacity-80 truncate">{details.officialWebsite}</span>
                        </div>
                    </a>
                )}
                {details.purchaseLocations && details.purchaseLocations.length > 0 && (
                    <ul className="space-y-2 pt-2">
                        {details.purchaseLocations.map((location, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="flex-shrink-0 text-emerald-500 mt-1">&#10003;</span>
                                <span className="text-gray-700 dark:text-gray-300">{location}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

      {/* Entry Point Examples */}
      {details.entryPointExamples && details.entryPointExamples.length > 0 && (
        <div className="mb-6">
            <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                <MapPinIcon className="w-6 h-6 text-fuchsia-500" />
                <span>نقاط شراء للمسافرين</span>
            </h4>
            <div className="space-y-4">
            {details.entryPointExamples.map((entry, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">للقادمين من {entry.comingFrom}:</p>
                    <ul className="space-y-2 list-disc list-inside">
                        {entry.locations && entry.locations.map((locationInstruction, idx) => (
                            <li key={idx} className="text-gray-700 dark:text-gray-300">
                                {locationInstruction}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            </div>
        </div>
      )}


      {/* Important Notes */}
      {details.importantNotes && details.importantNotes.length > 0 && (
         <div className="mb-6">
            <h4 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                <WarningIcon className="w-6 h-6 text-red-500" />
                <span>معلومات هامة</span>
            </h4>
            <ul className="space-y-2 list-inside">
                {details.importantNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/40 rounded-lg border-l-4 border-red-500">
                        <span className="flex-shrink-0 text-red-500 font-bold mt-0.5">!</span>
                         <span className="text-gray-700 dark:text-gray-300">{note}</span>
                    </li>
                ))}
            </ul>
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3">المصادر</h4>
            <ul className="space-y-2">
                {sources.map((source, index) => (
                    <li key={index}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm break-all">
                            <LinkIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{source.title || source.uri}</span>
                        </a>
                    </li>
                ))}
            </ul>
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

export default VignetteInfoCard;