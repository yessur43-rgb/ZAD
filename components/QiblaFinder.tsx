import React, { useState } from 'react';
import { useQibla } from '../hooks/useQibla';
import { QiblaIcon } from './icons/QiblaIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';

const QiblaFinder: React.FC = () => {
    const { qiblaDirection, heading, error, distance, isAligned } = useQibla();
    const [permissionError, setPermissionError] = useState<string | null>(null);

    // Request permissions for iOS 13+ devices
    const requestPermissions = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                if (permission === 'granted') {
                    setPermissionError(null);
                    // The hook will automatically start listening after permission is granted
                    window.location.reload(); // Easiest way to re-initiate the hook
                } else {
                    setPermissionError('تم رفض إذن الوصول إلى مستشعرات الحركة. لا يمكن تحديد اتجاه القبلة.');
                }
            } catch (err) {
                 setPermissionError('فشل طلب إذن الوصول إلى مستشعرات الحركة.');
            }
        }
    };

    const compassRotation = 360 - (heading ?? 0);
    const qiblaPointerRotation = (qiblaDirection ?? 0) - (heading ?? 0);

    const renderContent = () => {
        if (error) {
             if (error.includes("Geolocation")) {
                 return <div className="text-center text-red-500">
                     <p>{error}</p>
                     <p className="mt-2">يرجى تمكين الوصول إلى الموقع من إعدادات المتصفح.</p>
                 </div>
             }
             if (error.includes("DeviceOrientation")) {
                 const isIOS = typeof (DeviceOrientationEvent as any).requestPermission === 'function';
                 if (isIOS) {
                     return <div className="text-center">
                         <p className="text-amber-600 dark:text-amber-400">لعرض اتجاه القبلة، يحتاج التطبيق إلى الوصول إلى مستشعرات الحركة في جهازك.</p>
                         <button onClick={requestPermissions} className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg">
                             منح الإذن
                         </button>
                     </div>
                 }
                 return <p className="text-center text-red-500">{error}</p>
             }
        }

        if (permissionError) {
            return <p className="text-center text-red-500">{permissionError}</p>
        }

        if (qiblaDirection === null || heading === null) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg className="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>جاري تحديد اتجاه القبلة...</p>
                    <p className="text-xs mt-2">قم بتحريك هاتفك بشكل بسيط للمساعدة في معايرة البوصلة.</p>
                </div>
            );
        }

        return (
            <>
                <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
                    {/* Compass Background */}
                    <div
                        className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full transition-transform duration-200 ease-linear"
                        style={{ transform: `rotate(${compassRotation}deg)` }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-bold text-2xl text-red-500">ش</span>
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-xs">0</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 text-xs">180</div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 text-xs">270</div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-xs">90</div>
                    </div>
                    
                    {/* Qibla Pointer */}
                    <div
                        className="absolute inset-0 flex justify-center transition-transform duration-200 ease-linear"
                        style={{ transform: `rotate(${qiblaPointerRotation}deg)` }}
                    >
                        <div className={`w-8 h-full flex flex-col items-center transition-opacity duration-300 ${isAligned ? 'opacity-100' : 'opacity-60'}`}>
                           <QiblaIcon className={`w-10 h-10 transition-colors duration-300 ${isAligned ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-500'}`} />
                        </div>
                    </div>

                    {/* Phone Top Indicator */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-800 dark:bg-gray-200 rounded-full" />
                     <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 transition-colors duration-300 ${isAligned ? 'border-emerald-400' : 'border-transparent'}`} />
                </div>
                <div className="text-center mt-6">
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        {isAligned ? "أنت الآن في اتجاه القبلة" : "قم بتوجيه هاتفك حتى يتطابق المؤشر مع الخط العلوي"}
                    </p>
                    <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                        {qiblaDirection.toFixed(0)}°
                    </div>
                     {distance !== null && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            تبعد عن الكعبة حوالي {Math.round(distance).toLocaleString('ar-SA')} كم
                        </p>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 h-full">
            {renderContent()}
        </div>
    );
};

export default QiblaFinder;