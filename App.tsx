
import React, { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import Header from './components/Header';
import { ImageIcon } from './components/icons/ImageIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { IngredientIcon } from './components/icons/IngredientIcon';
import { FindItIcon } from './components/icons/FindItIcon';
import { MenuIcon } from './components/icons/MenuIcon';
import { ActivityIcon } from './components/icons/ActivityIcon';
import { AppIcon } from './components/icons/AppIcon';
import { OnMyWayIcon } from './components/icons/OnMyWayIcon';
import ErrorBoundary from './components/ErrorBoundary';
import { saveApiKey, getApiKey, clearApiKey } from './services/apiKeyService';
import ApiKeyInput from './components/ApiKeyInput';
import { UserLocation } from './types';
import { reverseGeocode } from './services/geminiService';
import LocationDisplay from './components/LocationDisplay';
import { UsersIcon } from './components/icons/UsersIcon';
import { HeartIcon } from './components/icons/HeartIcon';

const ImageAnalyzer = lazy(() => import('./components/ImageAnalyzer'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const FindIt = lazy(() => import('./components/FindIt'));
const OnMyWay = lazy(() => import('./components/OnMyWay'));
const MenuAnalyzer = lazy(() => import('./components/MenuAnalyzer'));
const ActivitiesFinder = lazy(() => import('./components/ActivitiesFinder'));
const IngredientGuide = lazy(() => import('./components/IngredientGuide'));
const CommunityHub = lazy(() => import('./components/CommunityHub'));
const Favorites = lazy(() => import('./components/Favorites'));


type ToolView = 'image' | 'chat' | 'findit' | 'menu' | 'ingredient' | 'activities' | 'onmyway' | 'community' | 'favorites';

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolView | null>(null);
  const [splashComplete, setSplashComplete] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);


  useEffect(() => {
    const key = getApiKey();
    setApiKey(key);
    setIsLoading(false);
  }, []);
  
  const requestAndSetLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setLocationError('خاصية تحديد الموقع الجغرافي غير مدعومة في هذا المتصفح.');
      return;
    }
    setLocationPermission('loading');
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let locationName = '';
        try {
          // Use a Gemini call for reverse geocoding
          locationName = await reverseGeocode(latitude, longitude);
        } catch (e) {
          console.warn("Reverse geocoding failed", e);
          // Fallback to coordinates if name resolution fails
          locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        }
        setUserLocation({ latitude, longitude, name: locationName });
        setLocationPermission('granted');
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationPermission('denied');
        if (err.code === 1) { // PERMISSION_DENIED
          setLocationError('تم رفض إذن الوصول إلى الموقع. بعض الميزات قد تكون محدودة.');
        } else {
          setLocationError('لم نتمكن من الوصول إلى موقعك. حاول مرة أخرى.');
        }
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    // Request location only after the app is ready (splash screen done, API key present)
    if (splashComplete && apiKey && locationPermission === 'idle') {
      requestAndSetLocation();
    }
  }, [splashComplete, apiKey, locationPermission, requestAndSetLocation]);

  const handleApiKeySubmit = (key: string) => {
    saveApiKey(key);
    setApiKey(key);
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setApiKey(null);
  }

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
             <AppIcon className="w-24 h-24 text-emerald-500 animate-pulse" />
        </div>
    );
  }

  if (!apiKey) {
    return <ApiKeyInput onKeySubmit={handleApiKeySubmit} />;
  }

  if (!splashComplete) {
    return (
      <SplashScreen onComplete={() => {
        setSplashComplete(true);
      }} />
    );
  }

  const renderToolsContent = () => {
    if (selectedTool) {
      const toolComponentMap: Record<ToolView, React.ReactElement> = {
          image: <ImageAnalyzer />,
          chat: <ChatBot location={userLocation} />,
          findit: <FindIt location={userLocation} />,
          onmyway: <OnMyWay location={userLocation} />,
          menu: <MenuAnalyzer />,
          activities: <ActivitiesFinder location={userLocation} />,
          ingredient: <IngredientGuide />,
          community: <CommunityHub />,
          favorites: <Favorites />,
      };
      const toolLabelMap: Record<ToolView, string> = {
          image: 'تحليل المنتج',
          chat: 'ابحث عن أماكن',
          findit: 'أوجدها لي',
          onmyway: 'على طريقي',
          menu: 'تحليل القائمة',
          activities: 'الأنشطة',
          ingredient: 'دليل المكونات',
          community: 'مركز المجتمع',
          favorites: 'المفضلة',
      };
      
      return (
          <div className="flex flex-col h-full animate-fade-in">
              <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                  <button 
                      onClick={() => setSelectedTool(null)}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      aria-label="العودة إلى الأدوات"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{toolLabelMap[selectedTool]}</h2>
              </div>
              <div className="flex-grow overflow-y-auto">
                <ErrorBoundary>
                    <Suspense fallback={
                        <div className="flex justify-center items-center h-full p-4">
                            <div className="text-center">
                                <svg className="animate-spin h-8 w-8 text-emerald-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">جاري تحميل الأداة...</p>
                            </div>
                        </div>
                    }>
                        {toolComponentMap[selectedTool]}
                    </Suspense>
                </ErrorBoundary>
              </div>
          </div>
      );
    }

    const toolButtons: { id: ToolView, label: string, Icon: React.FC<any> }[] = [
      { id: 'chat', label: 'ابحث عن أماكن', Icon: ChatIcon },
      { id: 'favorites', label: 'المفضلة', Icon: HeartIcon },
      { id: 'onmyway', label: 'على طريقي', Icon: OnMyWayIcon },
      { id: 'activities', label: 'الأنشطة', Icon: ActivityIcon },
      { id: 'community', label: 'مركز المجتمع', Icon: UsersIcon },
      { id: 'image', label: 'تحليل المنتج', Icon: ImageIcon },
      { id: 'menu', label: 'تحليل القائمة', Icon: MenuIcon },
      { id: 'findit', label: 'أوجدها لي', Icon: FindItIcon },
      { id: 'ingredient', label: 'دليل المكونات', Icon: IngredientIcon },
    ];

    return (
      <div className="p-4 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">صندوق الأدوات</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {toolButtons.map(({ id, label, Icon }) => (
                  <button 
                    key={id} 
                    onClick={() => setSelectedTool(id)}
                    className="p-4 text-right bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <Icon className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
                  </button>
              ))}
          </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col" dir="rtl">
      <Header onClearApiKey={handleClearApiKey} onReplaceApiKey={handleApiKeySubmit} hasApiKey={!!apiKey} />
      {/* Location Display will only show on the main tools screen */}
      {selectedTool === null && (
          <LocationDisplay 
              location={userLocation} 
              permissionStatus={locationPermission} 
              error={locationError} 
              onRequest={requestAndSetLocation} 
          />
      )}
      <main className="flex-grow container mx-auto flex flex-col">
        <div className={`flex-grow ${selectedTool ? '' : 'p-4'}`}>
          {renderToolsContent()}
        </div>
      </main>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const SplashScreen: React.FC<{onComplete: () => void}> = ({ onComplete }) => {
   useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-4">
        <AppIcon className="w-24 h-24 text-emerald-500 animate-pulse mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">زاد</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2">zad</p>
      </div>
  );
}


export default App;