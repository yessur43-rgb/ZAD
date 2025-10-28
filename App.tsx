
import React, { useState, lazy, Suspense, useEffect } from 'react';
import Header from './Header';
import { ImageIcon } from './components/icons/ImageIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { IngredientIcon } from './components/icons/IngredientIcon';
import { FindItIcon } from './components/icons/FindItIcon';
import { MenuIcon } from './components/icons/MenuIcon';
import PermissionGate from './components/PermissionGate';
import { ActivityIcon } from './components/icons/ActivityIcon';
import { AppIcon } from './components/icons/AppIcon';
import { OnMyWayIcon } from './components/icons/OnMyWayIcon';
import { TravelIcon } from './components/icons/TravelIcon';
import { GuideIcon } from './components/icons/GuideIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { TranslatorIcon } from './components/icons/TranslatorIcon';
import { CompassIcon } from './components/icons/CompassIcon';
import { LiveTranslateIcon } from './components/icons/LiveTranslateIcon';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all tool components for code splitting to improve initial load time.
const ImageAnalyzer = lazy(() => import('./components/ImageAnalyzer'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const FindIt = lazy(() => import('./components/FindIt'));
const OnMyWay = lazy(() => import('./components/OnMyWay'));
const MenuAnalyzer = lazy(() => import('./components/MenuAnalyzer'));
const ActivitiesFinder = lazy(() => import('./components/ActivitiesFinder'));
const IngredientGuide = lazy(() => import('./components/IngredientGuide'));
const TravelPlanner = lazy(() => import('./TravelGuide')); // From TravelGuide.tsx which exports TravelPlanner
const TravelerGuide = lazy(() => import('./components/MuslimGuide')); // From components/MuslimGuide.tsx which exports TravelerGuide
const CommunityHub = lazy(() => import('./components/CommunityHub'));
const PhraseTranslator = lazy(() => import('./components/RecipeGenerator')); // from components/RecipeGenerator.tsx which exports PhraseTranslator
const QiblaFinder = lazy(() => import('./components/QiblaFinder'));
const LiveTranslator = lazy(() => import('./components/LiveTranslator'));


type ToolView = 'image' | 'chat' | 'findit' | 'menu' | 'ingredient' | 'activities' | 'onmyway' | 'planner' | 'guide' | 'community' | 'phrases' | 'qibla' | 'live';


const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolView | null>(null);
  const [arePermissionsHandled, setArePermissionsHandled] = useState<boolean>(false);

  // Simple check to avoid splash screen on every tool close
  const hasShownSplash = React.useRef(false);

  if (!hasShownSplash.current) {
    return (
      <SplashScreen onComplete={() => {
        hasShownSplash.current = true;
        setArePermissionsHandled(false); // Trigger permission gate after splash
      }} />
    );
  }

  if (!arePermissionsHandled) {
    return <PermissionGate onComplete={() => setArePermissionsHandled(true)} />;
  }

  const renderToolsContent = () => {
    if (selectedTool) {
      const toolComponentMap: Record<ToolView, React.ReactElement> = {
          image: <ImageAnalyzer />,
          chat: <ChatBot />,
          findit: <FindIt />,
          onmyway: <OnMyWay />,
          menu: <MenuAnalyzer />,
          activities: <ActivitiesFinder />,
          ingredient: <IngredientGuide />,
          planner: <TravelPlanner />,
          guide: <TravelerGuide />,
          community: <CommunityHub />,
          phrases: <PhraseTranslator />,
          qibla: <QiblaFinder />,
          live: <LiveTranslator />
      };
      const toolLabelMap: Record<ToolView, string> = {
          image: 'تحليل المنتج',
          chat: 'ابحث عن أماكن',
          findit: 'أوجدها لي',
          onmyway: 'على طريقي',
          menu: 'تحليل القائمة',
          activities: 'الأنشطة',
          ingredient: 'دليل المكونات',
          planner: 'مخطط الرحلات',
          guide: 'دليل المسافر',
          community: 'مركز المجتمع',
          phrases: 'مترجم العبارات',
          qibla: 'محدد القبلة',
          live: 'المترجم الفوري'
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
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{toolLabelMap[selectedTool]}</h2>
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
                                <p className="mt-2 text-gray-500 dark:text-gray-400">جاري تحميل الأداة...</p>
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
      { id: 'image', label: 'تحليل المنتج', Icon: ImageIcon },
      { id: 'chat', label: 'ابحث عن أماكن', Icon: ChatIcon },
      { id: 'onmyway', label: 'على طريقي', Icon: OnMyWayIcon },
      { id: 'qibla', label: 'محدد القبلة', Icon: CompassIcon },
      { id: 'findit', label: 'أوجدها لي', Icon: FindItIcon },
      { id: 'menu', label: 'تحليل القائمة', Icon: MenuIcon },
      { id: 'activities', label: 'الأنشطة', Icon: ActivityIcon },
      { id: 'phrases', label: 'مترجم العبارات', Icon: TranslatorIcon },
      { id: 'live', label: 'المترجم الفوري', Icon: LiveTranslateIcon },
      { id: 'planner', label: 'مخطط الرحلات', Icon: TravelIcon },
      { id: 'guide', label: 'دليل المسافر', Icon: GuideIcon },
      { id: 'community', label: 'مركز المجتمع', Icon: UsersIcon },
      { id: 'ingredient', label: 'دليل المكونات', Icon: IngredientIcon },
    ];

    return (
      <div className="p-4 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">صندوق الأدوات</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {toolButtons.map(({ id, label, Icon }) => (
                  <button 
                    key={id} 
                    onClick={() => setSelectedTool(id)}
                    className="p-4 text-right bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <Icon className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
                  </button>
              ))}
          </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col" dir="rtl">
      <Header />
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
        <p className="text-gray-600 dark:text-gray-400 mt-2">zad</p>
      </div>
  );
}


export default App;
