
import { useState, useEffect, useRef } from 'react';

// Coordinates of the Kaaba in Mecca
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

function toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

export const useQibla = () => {
    const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
    const [heading, setHeading] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAligned, setIsAligned] = useState<boolean>(false);
    const isAlignedRef = useRef(false);

    useEffect(() => {
        let watchId: number | null = null;
        
        const handleOrientation = (event: DeviceOrientationEvent) => {
            // 'webkitCompassHeading' is for iOS compatibility
            const compassHeading = (event as any).webkitCompassHeading || event.alpha;
            if (compassHeading !== null) {
                setHeading(compassHeading);

                if (qiblaDirection !== null) {
                    const difference = Math.abs(compassHeading - qiblaDirection);
                    const isNowAligned = Math.min(difference, 360 - difference) < 5; // 5 degrees tolerance

                    if (isNowAligned && !isAlignedRef.current) {
                        if (navigator.vibrate) {
                            navigator.vibrate(100); // Vibrate for 100ms
                        }
                    }
                    isAlignedRef.current = isNowAligned;
                    setIsAligned(isNowAligned);
                }
            }
        };

        const calculateQibla = (latitude: number, longitude: number) => {
            const userLatRad = toRadians(latitude);
            const userLonRad = toRadians(longitude);
            const kaabaLatRad = toRadians(KAABA_LAT);
            const kaabaLonRad = toRadians(KAABA_LON);

            const lonDiff = kaabaLonRad - userLonRad;

            const y = Math.sin(lonDiff) * Math.cos(kaabaLatRad);
            const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) - Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(lonDiff);

            let bearingRad = Math.atan2(y, x);
            let bearingDeg = toDegrees(bearingRad);
            
            // Normalize to 0-360
            bearingDeg = (bearingDeg + 360) % 360;
            
            setQiblaDirection(bearingDeg);

            // Calculate distance (Haversine formula)
            const R = 6371; // Earth radius in km
            const dLat = kaabaLatRad - userLatRad;
            const dLon = kaabaLonRad - userLonRad;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(userLatRad) * Math.cos(kaabaLatRad) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            setDistance(R * c);
        };
        
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setError(null);
                    calculateQibla(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.error(err);
                    setError('Geolocation error: لم نتمكن من الوصول إلى موقعك.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
        }

        if ('DeviceOrientationEvent' in window) {
            // Check for iOS 13+ permission model
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                 (DeviceOrientationEvent as any).requestPermission()
                    .then((permissionState: string) => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        } else {
                            setError('DeviceOrientation: تم رفض إذن الوصول إلى مستشعرات الحركة.');
                        }
                    })
                    .catch((err: any) => {
                        console.error(err);
                        setError('DeviceOrientation: فشل طلب إذن الوصول إلى مستشعرات الحركة.');
                    });
            } else {
                // For non-iOS 13+ devices
                window.addEventListener('deviceorientation', handleOrientation);
            }
        } else {
            setError('DeviceOrientation: مستشعرات الحركة غير مدعومة في هذا الجهاز أو المتصفح.');
        }


        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [qiblaDirection]);

    return { qiblaDirection, heading, error, distance, isAligned };
};
