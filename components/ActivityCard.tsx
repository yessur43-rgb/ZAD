import React, { useState, useEffect } from 'react';
import { Activity, ActivityStatus, Place } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PriceTagIcon } from './icons/PriceTagIcon';
import { HeartIcon } from './icons/HeartIcon';
import { addToFavorites, removeFromFavorites, isFavorite } from '../services/favoritesService';

interface ActivityCardProps {
  activity: Activity;
}

const getStatusStyles = (status: ActivityStatus) => {
    switch (status) {
        case 'مفتوح':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200';
        case 'يغلق قريباً':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200';
        case 'مغلق':
            return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const formatOperatingHours = (hours: Record<string, string> | string): string => {
    if (typeof hours === 'string') {
        return hours;
    }
    if (typeof hours !== 'object' || hours === null || Object.keys(hours).length === 0) {
        return 'ساعات العمل غير متوفرة';
    }
    try {
        // Get today's day name in Arabic (Saudi Arabia locale)
        const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
        
        // Find a key in the hours object that matches today's name.
        const matchingKey = Object.keys(hours).find(day => today.includes(day));

        if (matchingKey && hours[matchingKey]) {
            return `اليوم (${matchingKey}): ${hours[matchingKey]}`;
        }

        // If today not found, just show the first available day as a fallback
        const firstDay = Object.keys(hours)[0];
        if (firstDay) {
              return `${firstDay}: ${hours[firstDay]}`;
        }

        return 'تحقق من ساعات العمل للموقع'; // Fallback if object is empty or no match
    } catch (e) {
        console.error("Error formatting operating hours:", e);
        return 'خطأ في عرض ساعات العمل';
    }
};


const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [isFav, setIsFav] = useState(false);

  // Check favorite status on mount and when activity changes
  useEffect(() => {
    const checkFavoriteStatus = () => {
      const status = isFavorite(activity.name, activity.address);
      setIsFav(status);
    };

    checkFavoriteStatus();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zad_favorites') {
        checkFavoriteStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activity.name, activity.address]);

  const handleToggleFavorite = () => {
    if (isFav) {
      removeFromFavorites(activity.name, activity.address);
      setIsFav(false);
    } else {
      // Convert Activity to Place format for favorites
      const activityAsPlace: Place = {
        name: activity.name,
        address: activity.address,
        description: activity.description,
        url: activity.url,
        rating: 0, // Activities don't have ratings
        distance: 0, // Activities don't have distance
      };
      addToFavorites(activityAsPlace, 'activities');
      setIsFav(true);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {activity.category}
          </span>
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{activity.name}</h3>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full transition-colors ${
              isFav
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
            }`}
            title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <HeartIcon className="w-6 h-6" />
          </button>
          {activity.status && (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyles(activity.status)}`}>
              {activity.status}
            </span>
          )}
          {activity.statusNote && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-right">{activity.statusNote}</p>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
        <div className="flex items-start gap-2 text-gray-800 dark:text-gray-300">
          <PriceTagIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
          <span>{activity.price}</span>
        </div>
        <div className="flex items-start gap-2 text-gray-800 dark:text-gray-300">
          <ClockIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
          <span>{formatOperatingHours(activity.operatingHours)}</span>
        </div>
        <div className="flex items-start gap-2 text-gray-800 dark:text-gray-300">
          <MapPinIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
          <span>{activity.address}</span>
        </div>
      </div>
      
      {activity.url && (
        <a href={activity.url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-3">
            عرض على الخرائط &rarr;
        </a>
      )}
    </div>
  );
};

export default ActivityCard;