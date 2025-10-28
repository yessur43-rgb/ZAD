import React, { useState } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { AppIcon } from './icons/AppIcon';

interface PermissionGateProps {
  onComplete: () => void;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ onComplete }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowClick = async () => {
    setIsRequesting(true);
    try {
      // Request camera permission. We don't need to store the stream, just trigger the prompt.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Immediately stop the tracks to turn off the camera light, as we don't need the stream here.
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn('Camera permission was not granted:', err);
      }

      // Request geolocation permission.
      try {
        await new Promise<void>((resolve, reject) => {
          // A simple getCurrentPosition is enough to trigger the prompt.
          // The actual location is fetched within the components that need it.
          navigator.geolocation.getCurrentPosition(
            () => resolve(), 
            (error) => reject(error)
          );
        });
      } catch (err) {
        console.warn('Geolocation permission was not granted:', err);
      }
    } finally {
      // Regardless of the outcome, we proceed to the app.
      // The features that need permissions will handle the granted/denied state internally.
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 text-center animate-fade-in">
        <AppIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">أذونات مطلوبة لتجربة أفضل</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          للاستفادة من جميع الميزات، يحتاج التطبيق إلى الوصول إلى الكاميرا والموقع الجغرافي.
        </p>

        <div className="text-right mt-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                <CameraIcon className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">الكاميرا</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                لمسح باركود المنتجات، تحليل صور قوائم الطعام، والبحث عن منتجات بالصورة.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                <LocationMarkerIcon className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">الموقع الجغرافي</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                للعثور على مطاعم، متاجر، ومساجد حلال بالقرب منك.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleAllowClick}
          disabled={isRequesting}
          className="mt-8 w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-wait transition flex items-center justify-center"
        >
          {isRequesting ? 'يرجى الاستجابة للطلب من المتصفح...' : 'السماح والمتابعة'}
        </button>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          لن نشارك بياناتك. يمكنك تغيير هذه الأذونات لاحقًا من إعدادات المتصفح.
        </p>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PermissionGate;