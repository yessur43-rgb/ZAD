import React, { useState } from 'react';
import { Place, SearchCategory, DishSuggestionResponse, ParkingSuggestionResponse, ParkingInfo, HalalHaramListResponse } from '../types';
import { getHalalDishes, findParkingForPlace, getHalalHaramList } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { MapPinIcon } from './icons/MapPinIcon';
import { ClockIcon } from './icons/ClockIcon';
import StarRating from './StarRating';
import { PriceIcon } from './icons/PriceIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { DishIcon } from './icons/DishIcon';
import { CarIcon } from './icons/CarIcon';
import { WalkIcon } from './icons/WalkIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { WarningIcon } from './icons/WarningIcon';

interface PlaceCardProps {
  place: Place;
  category: SearchCategory;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, category }) => {
  const [dishes, setDishes] = useState<DishSuggestionResponse | null>(null);
  const [parking, setParking] = useState<ParkingSuggestionResponse | null>(null);
  const [halalHaramList, setHalalHaramList] = useState<HalalHaramListResponse | null>(null);
  const [isDishesLoading, setIsDishesLoading] = useState(false);
  const [isParkingLoading, setIsParkingLoading] = useState(false);
  const [isHalalHaramListLoading, setIsHalalHaramListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchDishes = async () => {
    if (dishes) { setDishes(null); return; }
    setIsDishesLoading(true);
    setError(null);
    try {
      const result = await getHalalDishes(place.name);
      setDishes(result);
    } catch (err) {
      setError('فشل في جلب الأطباق المقترحة.');
      console.error(err);
    } finally {
      setIsDishesLoading(false);
    }
  };

  const handleFetchParking = async () => {
    if (parking) { setParking(null); return; }
    setIsParkingLoading(true);
    setError(null);
    try {
      const result = await findParkingForPlace(place);
      setParking(result);
    } catch (err) {
      setError('فشل في العثور على مواقف قريبة.');
      console.error(err);
    } finally {
      setIsParkingLoading(false);
    }
  };

  const handleFetchHalalHaramList = async () => {
    if (halalHaramList) { setHalalHaramList(null); return; }
    setIsHalalHaramListLoading(true);
    setError(null);
    try {
      const result = await getHalalHaramList(place);
      setHalalHaramList(result);
    } catch (err) {
      setError('فشل في جلب قائمة الحلال/الحرام.');
      console.error(err);
    } finally {
      setIsHalalHaramListLoading(false);
    }
  };
  
  const renderParkingInfo = (p: ParkingInfo) => (
      <div key={p.name} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-start">
              <h5 className="font-bold text-gray-800 dark:text-gray-200">{p.name}</h5>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline text-xs font-semibold">
                  <MapPinIcon className="w-4 h-4" />
                </a>
              )}
          </div>
           {p.address && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.address}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1"><WalkIcon className="w-3 h-3"/> {p.distance_to_restaurant}</span>
              <span className="flex items-center gap-1"><PriceIcon className="w-3 h-3"/> {p.pricing_details}</span>
              <span className="flex items-center gap-1"><CarIcon className="w-3 h-3"/> {p.parking_type}</span>
          </div>
          {p.notes && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">ملاحظة: {p.notes}</p>}
      </div>
  );

  const hasDetails = place.detailedHours?.length || place.phoneNumber;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header: Name + Map Icon */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex-grow pr-2">{place.name}</h4>
        {place.url && (
            <a href={place.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex-shrink-0 transition-colors" title="عرض على الخريطة">
                <MapPinIcon className="w-5 h-5" />
            </a>
        )}
      </div>

      {/* Distance - prominent display */}
      {place.distance && (
        <div className="flex items-center gap-1.5 mb-3">
          <WalkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{place.distance} من موقعك</span>
        </div>
      )}

      {/* Description - clear and readable */}
      {place.overview && (
        <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
            "{place.overview}"
          </p>
        </div>
      )}

      {/* Info row: Rating, Address, Hours, Price */}
      <div className="space-y-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        {place.rating != null && place.rating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={place.rating} />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{place.rating.toFixed(1)}</span>
            {place.userRatingsTotal && (
              <span className="text-xs text-gray-500 dark:text-gray-400">({place.userRatingsTotal.toLocaleString('ar-SA')} تقييم)</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          {place.closingTime && (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3"/> {place.closingTime}
            </span>
          )}
          {place.priceLevel && (
            <span className="flex items-center gap-1">
              <PriceIcon className="w-3 h-3"/> {place.priceLevel}
            </span>
          )}
        </div>

        {place.address && (
          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
            <MapPinIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{place.address}</span>
          </p>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {(category === 'restaurants' || category === 'cafes') && (
          <button
            onClick={handleFetchDishes}
            disabled={isDishesLoading}
            className={`flex-1 min-w-[100px] text-sm flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all disabled:opacity-50 ${
              dishes
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {isDishesLoading ? <LoadingSpinner /> : <DishIcon className="w-4 h-4" />}
            <span>{category === 'cafes' ? 'قائمة' : 'أطباق'}</span>
          </button>
        )}

        {(category === 'restaurants' || category === 'cafes') && (
          <button
            onClick={handleFetchHalalHaramList}
            disabled={isHalalHaramListLoading}
            className={`flex-1 min-w-[100px] text-sm flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all disabled:opacity-50 ${
              halalHaramList
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800 border border-amber-200 dark:border-amber-800'
            }`}
          >
            {isHalalHaramListLoading ? <LoadingSpinner /> : <ChecklistIcon className="w-4 h-4" />}
            <span>تحليل</span>
          </button>
        )}

        {(category === 'restaurants' || category === 'cafes' || category === 'shopping' || category === 'attractions') && (
          <button
            onClick={handleFetchParking}
            disabled={isParkingLoading}
            className={`flex-1 min-w-[100px] text-sm flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all disabled:opacity-50 ${
              parking
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800 border border-sky-200 dark:border-sky-800'
            }`}
          >
            {isParkingLoading ? <LoadingSpinner /> : <CarIcon className="w-4 h-4" />}
            <span>مواقف</span>
          </button>
        )}
      </div>
        
        <div className="mt-3 space-y-4">
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            {/* Halal/Haram List */}
            {halalHaramList && (
                <div className="animate-fade-in">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{halalHaramList.source_description}</p>
                    {halalHaramList.halalItems.length > 0 && (
                        <div className="mt-3">
                            <h6 className="flex items-center gap-2 font-semibold text-sm text-emerald-800 dark:text-emerald-200"><ThumbsUpIcon className="w-4 h-4" /> أصناف حلال غالباً</h6>
                            <div className="mt-2 space-y-2">{halalHaramList.halalItems.map(item => (
                                <div key={item.name} className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-md"><p className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">{item.name}</p><p className="text-xs text-emerald-700 dark:text-emerald-300">{item.note}</p></div>))}
                            </div>
                        </div>
                    )}
                    {halalHaramList.haramOrMushboohItems.length > 0 && (
                        <div className="mt-4">
                            <h6 className="flex items-center gap-2 font-semibold text-sm text-red-800 dark:text-red-200"><WarningIcon className="w-4 h-4" /> أصناف تتطلب الحذر</h6>
                             <div className="mt-2 space-y-2">{halalHaramList.haramOrMushboohItems.map(item => (
                                <div key={item.name} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-md border-l-2 border-red-400"><p className="font-semibold text-sm text-red-900 dark:text-red-100">{item.name}</p><p className="text-xs text-red-700 dark:text-red-300">{item.note}</p></div>))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dish Suggestions */}
            {dishes && (
                <div className="animate-fade-in">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{dishes.source_description}</p>
                    {dishes.dishes.length > 0 ? (
                        <div className="space-y-2">{dishes.dishes.map(dish => (
                            <div key={dish.name} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"><p className="font-semibold text-sm">{dish.name}</p><p className="text-xs text-gray-600 dark:text-gray-400">{dish.description}</p></div>))}
                        </div>
                    ) : (<p className="text-xs text-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">لم نتمكن من العثور على أطباق مقترحة.</p>)}
                </div>
            )}

            {/* Parking Suggestions */}
            {parking && (
                <div className="animate-fade-in">
                    {parking.parkingSuggestions.length > 0 ? (
                        <div className="space-y-2">{parking.parkingSuggestions.map(renderParkingInfo)}</div>
                    ) : (<p className="text-xs text-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">لم نتمكن من العثور على مواقف قريبة.</p>)}
                </div>
            )}

            {hasDetails && (halalHaramList || dishes || parking) && (
                 <div className="text-sm space-y-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg animate-fade-in mt-4">
                    {place.phoneNumber && <p className="flex items-center gap-1.5"><PhoneIcon className="w-4 h-4" /> <a href={`tel:${place.phoneNumber}`} className="hover:underline">{place.phoneNumber}</a></p>}
                    {place.detailedHours && place.detailedHours.length > 0 && (
                        <div className="flex items-start gap-1.5">
                            <ClockIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div><ul className="space-y-1">{place.detailedHours.map((line, i) => <li key={i} className="text-xs text-gray-600 dark:text-gray-400">{line}</li>)}</ul></div>
                        </div>
                    )}
                </div>
            )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PlaceCard;