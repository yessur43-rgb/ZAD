// FIX: Completed the truncated App component and added the missing default export.
import React, { useState, useRef, useEffect } from 'react';
import ImageAnalyzer from './components/ImageAnalyzer';
import ChatBot from './components/ChatBot';
import Header from './components/Header';
import { ImageIcon } from './components/icons/ImageIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import HistoryView from './components/HistoryView';
import IngredientGuide from './components/IngredientGuide';
import { IngredientIcon } from './components/icons/IngredientIcon';
import { FindItIcon } from './components/icons/FindItIcon';
import FindIt from './components/FindIt';
import { TravelIcon } from './components/icons/TravelIcon';
import TravelPlanner from './components/TravelGuide';
import { MenuIcon } from './components/icons/MenuIcon';
import MenuAnalyzer from './components/MenuAnalyzer';
import { HalalIcon } from './components/icons/HalalIcon';
import PermissionGate from './components/PermissionGate';
import { GuideIcon } from './components/icons/GuideIcon';
import TravelerGuide from './components/MuslimGuide';
import CommunityHub from './components/CommunityHub';
import { UsersIcon } from './components/icons/UsersIcon';
import { ActivityIcon } from './components/icons/ActivityIcon';
import ActivitiesFinder from './components/ActivitiesFinder';

type View = 'image' | 'chat' | 'guide' | 'findit' | 'travel' | 'menu' | 'ingredient' | 'community' | 'history' | 'activities';
const views: View[] = ['image', 'chat', 'guide', 'findit', 'travel', 'menu', 'ingredient', 'activities', 'community', 'history'];

const App: React.FC = () => {
  const [view, setView] = useState<View>('image');
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [arePermissionsHandled, setArePermissionsHandled] = useState<boolean>(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const currentViewIndex = views.indexOf(view);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingApp(false);
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  useEffect(() => {
    // Wait until the app is loaded and permissions are handled before calculating tab styles
    if (isLoadingApp || !arePermissionsHandled) return;

    const activeTab = tabRefs.current[currentViewIndex];
    if (activeTab) {
      setIndicatorStyle({
        width: `${activeTab.offsetWidth}px`,
        transform: `translateX(${activeTab.offsetLeft}px)`,
      });

      // Scroll the active tab to the center of the scrollable container.
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [view, currentViewIndex, isLoadingApp, arePermissionsHandled]);

  const getButtonClass = (buttonView: View) => {
    return `flex-shrink-0 px-5 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors duration-300 focus:outline-none whitespace-nowrap ${
      view === buttonView
        ? 'text-emerald-500'
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`;
  };

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-4">
        <HalalIcon className="w-24 h-24 text-emerald-500 animate-pulse mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Halal AI</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">مساعد الامتثال الحلال</p>
      </div>
    );
  }

  if (!arePermissionsHandled) {
    return <PermissionGate onComplete={() => setArePermissionsHandled(true)} />;
  }

  const renderContent = () => {
    switch (view) {
      case 'image': return <ImageAnalyzer />;
      case 'chat': return <ChatBot />;
      case 'guide': return <TravelerGuide />;
      case 'findit': return <FindIt />;
      case 'travel': return <TravelPlanner />;
      case 'menu': return <MenuAnalyzer />;
      case 'ingredient': return <IngredientGuide />;
      case 'history': return <HistoryView />;
      case 'community': return <CommunityHub />;
      case 'activities': return <ActivitiesFinder />;
      default: return null;
    }
  };
  
  const iconMap: Record<View, React.ReactElement> = {
    image: <ImageIcon />,
    chat: <ChatIcon />,
    guide: <GuideIcon />,
    findit: <FindItIcon />,
    travel: <TravelIcon />,
    menu: <MenuIcon />,
    ingredient: <IngredientIcon />,
    community: <UsersIcon />,
    history: <HistoryIcon />,
    activities: <ActivityIcon />,
  };

  const labelMap: Record<View, string> = {
    image: 'تحليل المنتج',
    chat: 'ابحث عن أماكن',
    guide: 'دليل المسافر',
    findit: 'أوجدها لي',
    travel: 'خطط لرحلتي',
    menu: 'تحليل القائمة',
    ingredient: 'دليل المكونات',
    community: 'المجتمع',
    history: 'السجل',
    activities: 'الأنشطة',
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <div className="relative w-full border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {views.map((v, index) => (
              <button
                key={v}
                ref={el => (tabRefs.current[index] = el)}
                onClick={() => setView(v)}
                className={getButtonClass(v)}
              >
                {iconMap[v]} {labelMap[v]}
              </button>
            ))}
          </div>
          <div className="absolute bottom-0 h-1 bg-emerald-500 rounded-full transition-all duration-300" style={indicatorStyle} />
        </div>

        <div className="flex-grow">
          {renderContent()}
        </div>
      </main>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default App;