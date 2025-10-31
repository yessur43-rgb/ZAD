import React, { useState, useEffect } from 'react';
import { findNearbyCityCenters } from '../services/geminiService';
import { CityCenter, CityCentersResponse, UserLocation } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { MapPinIcon } from './icons/MapPinIcon';
import { CityCenterIcon } from './icons/CityCenterIcon';
import { ClockIcon } from './icons/ClockIcon';

interface CityCentersProps {
  location: UserLocation | null;
}

const CityCenters: React.FC<CityCentersProps> = ({ location }) => {
  const [result, setResult] = useState<CityCentersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    // البحث التلقائي عند توفر الموقع
    if (location && !hasSearched) {
      handleSearch();
    }
  }, [location]);

  const handleSearch = async () => {
    if (!location) {
      setError('الموقع مطلوب للبحث عن المدن المجاورة. يرجى تمكين الوصول إلى الموقع من الشاشة الرئيسية.');
      return;
    }

    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setResult(null);

    console.log('🏙️ Starting city centers search...');

    try {
      const response = await findNearbyCityCenters(location);
      console.log('✅ City centers found:', response);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      console.error('❌ Error finding city centers:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCityCard = (city: CityCenter) => {
    return (
      <div
        key={city.cityName}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 overflow-hidden transition-all hover:shadow-lg ${
          city.isCurrentCity
            ? 'border-emerald-500 dark:border-emerald-400'
            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 ${
            city.isCurrentCity
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
              : 'bg-gray-50 dark:bg-gray-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <CityCenterIcon className={`w-6 h-6 ${city.isCurrentCity ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <h3 className={`text-xl font-bold ${city.isCurrentCity ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                  {city.cityName}
                </h3>
                {city.isCurrentCity && (
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-semibold">
                    موقعك الحالي
                  </span>
                )}
              </div>
              {city.cityNameEnglish && (
                <p className={`text-sm ${city.isCurrentCity ? 'text-emerald-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {city.cityNameEnglish}
                </p>
              )}
              <p className={`text-sm ${city.isCurrentCity ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-500'}`}>
                {city.country}
              </p>
            </div>

            {!city.isCurrentCity && city.distance && (
              <div className="text-left">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{city.distance}</span>
                </div>
                {city.travelTime && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm mt-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{city.travelTime}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Center Name */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🏙️ مركز المدينة:
            </h4>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{city.centerName}</p>
          </div>

          {/* Description */}
          <div className="mb-3">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {city.description}
            </p>
          </div>

          {/* Highlights */}
          {city.highlights && city.highlights.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ✨ أبرز المعالم والمولات:
              </h4>
              <div className="flex flex-wrap gap-2">
                {city.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-medium"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Google Maps Button */}
          {city.googleMapsUrl && (
            <a
              href={city.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-semibold transition-colors"
            >
              🗺️ عرض على خرائط Google
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <CityCenterIcon className="w-8 h-8" />
          <h1 className="text-3xl font-bold">مراكز المدن المجاورة</h1>
        </div>
        <p className="text-emerald-100">اكتشف مراكز المدن القريبة منك وما فيها من مولات ومعالم</p>
      </div>

      {/* Location Info */}
      {location && (
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-gray-700 dark:text-gray-300">
                موقعك الحالي: <strong className="text-gray-900 dark:text-gray-100">{location.name}</strong>
              </span>
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>جاري البحث...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>تحديث</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {isLoading && (
          <div className="text-center py-10">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              جاري البحث عن المدن المجاورة ومراكزها...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">
            <p className="font-semibold mb-2">⚠️ خطأ:</p>
            <p>{error}</p>
            {!location && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                إعادة تحميل الصفحة
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Current City */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span>📍</span>
                <span>مدينتك الحالية</span>
              </h2>
              {renderCityCard(result.currentCity)}
            </div>

            {/* Nearby Cities */}
            {result.nearbyCities && result.nearbyCities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span>🏙️</span>
                  <span>المدن المجاورة ({result.nearbyCities.length})</span>
                </h2>
                <div className="space-y-3">
                  {result.nearbyCities.map(city => renderCityCard(city))}
                </div>
              </div>
            )}

            {/* No nearby cities */}
            {(!result.nearbyCities || result.nearbyCities.length === 0) && (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <CityCenterIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>لم يتم العثور على مدن مجاورة في نطاق 100 كم</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !result && !location && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <MapPinIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">الموقع غير متوفر</p>
            <p className="text-sm">يرجى تمكين الوصول إلى الموقع من الشاشة الرئيسية</p>
          </div>
        )}

        {!isLoading && !error && !result && location && !hasSearched && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <CityCenterIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">ابحث عن المدن المجاورة</p>
            <button
              onClick={handleSearch}
              className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-lg transition-colors"
            >
              🔍 ابدأ البحث
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityCenters;
