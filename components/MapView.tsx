import React, { useEffect, useRef } from 'react';
import { Place } from '../types';

interface MapViewProps {
  places: Place[];
  userLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

const MapView: React.FC<MapViewProps> = ({ places, userLocation, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null); // Using 'any' for Leaflet map instance

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet is not loaded");
      return;
    }

    const map = L.map(mapContainerRef.current);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const points: [number, number][] = [];

    places.forEach(place => {
      if (place.location) {
        const { latitude, longitude } = place.location;
        points.push([latitude, longitude]);
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup(`<b>${place.name}</b><br>${place.address || ''}`);
      }
    });

    if (userLocation) {
        points.push([userLocation.latitude, userLocation.longitude]);
        const userIcon = L.divIcon({
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>',
            className: '', // important to clear default styling
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('<b>موقعك الحالي</b>');
    }
    
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        // Default view if no points (e.g., center of a major city)
        map.setView([24.7136, 46.6753], 10); // Riyadh
    }


    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [places, userLocation]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] p-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">النتائج على الخريطة</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div ref={mapContainerRef} className="w-full h-full rounded-lg flex-grow" style={{ zIndex: 0 }}></div>
      </div>
    </div>
  );
};

export default MapView;