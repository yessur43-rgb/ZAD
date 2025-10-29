import React from 'react';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { UserLocation } from '../types';

interface LocationDisplayProps {
  location: UserLocation | null;
  permissionStatus: 'idle' | 'loading' | 'granted' | 'denied';
  error: string | null;
  onRequest: () => void;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ location, permissionStatus, error, onRequest }) => {
  if (permissionStatus === 'loading') {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-2 text-center text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
        <LoadingSpinner />
        <span>جاري تحديد موقعك...</span>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 p-2 text-center text-sm">
        <p className="text-red-700 dark:text-red-300">{error || 'فشل تحديد الموقع.'}</p>
        <button onClick={onRequest} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          المحاولة مرة أخرى
        </button>
      </div>
    );
  }

  if (permissionStatus === 'granted' && location) {
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/40 p-2 text-center text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2 flex-wrap">
        <LocationMarkerIcon className="w-4 h-4" />
        <span className="font-semibold">موقعك الحالي:</span>
        <span>{location.name || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</span>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-emerald-600 dark:text-emerald-300">
          (عرض على الخريطة)
        </a>
      </div>
    );
  }

  // idle state before anything has happened
  return (
       <div className="bg-gray-100 dark:bg-gray-800 p-2 text-center text-sm">
           <button onClick={onRequest} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
             تحديد الموقع الحالي لتحسين النتائج
           </button>
       </div>
  );
};

export default LocationDisplay;
