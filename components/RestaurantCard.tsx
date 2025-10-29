import React, { useState, useEffect } from 'react';
import { Place, SearchCategory, DishSuggestionResponse, ParkingSuggestionResponse, ParkingInfo, HalalHaramListResponse } from '../types';
import { getHalalDishes, findParkingForPlace, getHalalHaramList } from '../services/geminiService';
import { addToFavorites, removeFromFavorites, isFavorite } from '../services/favoritesService';
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
  const [isFav, setIsFav] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  useEffect(() => {
    setIsFav(isFavorite(place.name, place.address));
  }, [place.name, place.address]);

  const handleToggleFavorite = () => {
    if (isFav) {
      removeFromFavorites(place.name, place.address);
      setIsFav(false);
    } else {
      addToFavorites(place, category);
      setIsFav(true);
    }
  };

  const handleShare = (type: 'copy' | 'whatsapp' | 'twitter') => {
    const placeUrl = place.url || '';
    const text = `${place.name}${place.address ? ' - ' + place.address : ''}${place.rating ? ` ⭐ ${place.rating}` : ''}`;

    switch (type) {
      case 'copy':
        navigator.clipboard.writeText(`${text}\n${placeUrl}`);
        alert('تم نسخ الرابط!');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + placeUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(placeUrl)}`, '_blank');
        break;
    }
    setShowShareMenu(false);
  };

  const getGoogleMapsUrl = () => {
    // Ensure Google Maps link is properly formatted
    if (place.location) {
      return `https://www.google.com/maps/search/?api=1&query=${place.location.latitude},${place.location.longitude}`;
    }
    if (place.url && place.url.includes('google.com/maps')) {
      return place.url;
    }
    // Fallback: search by name and address
    const query = encodeURIComponent(`${place.name} ${place.address || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

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
  
  const renderParkingInfo = (p: ParkingInfo) => {
    // Helper to get Google Maps URL for parking
    const getParkingMapUrl = () => {
      if (p.url) return p.url;
      if (p.address) {
        const query = encodeURIComponent(`${p.name} ${p.address}`);
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
      }
      const query = encodeURIComponent(p.name);
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    return (
      <div key={p.name} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-start mb-2">
              <h5 className="font-bold text-gray-800 dark:text-gray-200">{p.name}</h5>
          </div>
          {p.address && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.address}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1"><WalkIcon className="w-3 h-3"/> {p.distance_to_restaurant}</span>
              <span className="flex items-center gap-1"><PriceIcon className="w-3 h-3"/> {p.pricing_details}</span>
              <span className="flex items-center gap-1"><CarIcon className="w-3 h-3"/> {p.parking_type}</span>
          </div>
          {p.notes && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">ملاحظة: {p.notes}</p>}

          {/* Map Button */}
          <div className="mt-3">
              <a
                  href={getParkingMapUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                  <MapPinIcon className="w-3.5 h-3.5" />
                  <span>عرض على الخريطة</span>
              </a>
          </div>
      </div>
    );
  };

  const hasDetails = place.detailedHours?.length || place.phoneNumber;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header: Name + Action Icons */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex-grow pr-2">{place.name}</h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={`p-1 transition-colors ${
              isFav
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-red-500'
            }`}
            title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="مشاركة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-10 min-w-[150px]">
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  📋 نسخ الرابط
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  📱 WhatsApp
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  🐦 Twitter
                </button>
              </div>
            )}
          </div>

          {/* Map Icon */}
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="عرض على الخريطة"
          >
            <MapPinIcon className="w-5 h-5" />
          </a>
        </div>
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

        {/* More Info Button */}
        <button
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          className={`flex-1 min-w-[100px] text-sm flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all ${
            showMoreInfo
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800 border border-purple-200 dark:border-purple-800'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>معلومات أكثر</span>
        </button>
      </div>

      {/* More Info Section */}
      {showMoreInfo && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 animate-fade-in">
          <h5 className="font-bold text-purple-900 dark:text-purple-100 mb-3">التفاصيل الكاملة</h5>

          <div className="space-y-3 text-sm">
            {place.rating && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">التقييم:</span>
                <span>⭐ {place.rating.toFixed(1)} {place.userRatingsTotal && `(${place.userRatingsTotal.toLocaleString('ar-SA')} تقييم)`}</span>
              </div>
            )}

            {place.distance && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">المسافة:</span>
                <span>{place.distance} من موقعك</span>
              </div>
            )}

            {place.address && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">العنوان:</span>
                <span className="flex-1">{place.address}</span>
              </div>
            )}

            {place.closingTime && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">الساعات:</span>
                <span>{place.closingTime}</span>
              </div>
            )}

            {place.priceLevel && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">المستوى السعري:</span>
                <span>{place.priceLevel}</span>
              </div>
            )}

            {place.phoneNumber && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">الهاتف:</span>
                <a href={`tel:${place.phoneNumber}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                  {place.phoneNumber}
                </a>
              </div>
            )}

            {place.overview && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">الوصف:</span>
                <span className="flex-1 italic">"{place.overview}"</span>
              </div>
            )}

            <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <MapPinIcon className="w-4 h-4" />
                <span>عرض على خرائط Google</span>
              </a>
            </div>

            <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
              💡 نصيحة: يمكنك أيضاً قراءة تقييمات الزوار على خرائط Google بالضغط على الزر أعلاه
            </p>
          </div>
        </div>
      )}
        
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