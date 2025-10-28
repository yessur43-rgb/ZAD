// FIX: Completed the truncated App component and added the missing default export.
import React, { useState, useRef, useEffect } from 'react';
import ImageAnalyzer from './components/ImageAnalyzer';
import ChatBot from './components/ChatBot';
import Header from './Header';
import { ImageIcon } from './components/icons/ImageIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import HistoryView from './components/HistoryView';
import IngredientGuide from './components/IngredientGuide';
import { IngredientIcon } from './components/icons/IngredientIcon';
import { FindItIcon } from './components/icons/FindItIcon';
import FindIt from './components/FindIt';
import { MenuIcon } from './components/icons/MenuIcon';
import MenuAnalyzer from './components/MenuAnalyzer';
import PermissionGate from './components/PermissionGate';
import { ActivityIcon } from './components/icons/ActivityIcon';
import ActivitiesFinder from './components/ActivitiesFinder';
import { AppIcon } from './components/icons/AppIcon';

type View = 'tools' | 'history';
const views: View[] = ['tools', 'history'];

type ToolView = 'image' | 'chat' | 'findit' | 'menu' | 'ingredient' | 'activities';


const App: React.FC = () => {
  const [view, setView] = useState<View>('tools');
  const [selectedTool, setSelectedTool] = useState<ToolView | null>(null);

  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [arePermissionsHandled, setArePermissionsHandled] = useState<boolean>(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const currentViewIndex = views.indexOf(view);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingApp(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoadingApp || !arePermissionsHandled) return;

    // Set initial view on load if the current one is invalid
    if (currentViewIndex === -1) {
        setView('tools');
        return;
    }

    const activeTab = tabRefs.current[currentViewIndex];
    if (activeTab) {
      setIndicatorStyle({
        width: `${activeTab.offsetWidth}px`,
        transform: `translateX(${activeTab.offsetLeft}px)`,
      });
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [view, currentViewIndex, isLoadingApp, arePermissionsHandled]);

  useEffect(() => {
    // Reset the selected tool when the main view changes
    setSelectedTool(null);
  }, [view]);

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
        <AppIcon className="w-24 h-24 text-emerald-500 animate-pulse mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">زاد</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">zad</p>
      </div>
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
          menu: <MenuAnalyzer />,
          activities: <ActivitiesFinder />,
          ingredient: <IngredientGuide />,
      };
      const toolLabelMap: Record<ToolView, string> = {
          image: 'تحليل المنتج',
          chat: 'ابحث عن أماكن',
          findit: 'أوجدها لي',
          menu: 'تحليل القائمة',
          activities: 'الأنشطة',
          ingredient: 'دليل المكونات',
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
                  {toolComponentMap[selectedTool]}
              </div>
          </div>
      );
    }

    const toolButtons: { id: ToolView, label: string, Icon: React.FC<any> }[] = [
      { id: 'image', label: 'تحليل المنتج', Icon: ImageIcon },
      { id: 'chat', label: 'ابحث عن أماكن', Icon: ChatIcon },
      { id: 'findit', label: 'أوجدها لي', Icon: FindItIcon },
      { id: 'menu', label: 'تحليل القائمة', Icon: MenuIcon },
      { id: 'activities', label: 'الأنشطة', Icon: ActivityIcon },
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
  
  const renderContent = () => {
    switch (view) {
      case 'tools': return renderToolsContent();
      case 'history': return <HistoryView />;
      default: return null;
    }
  };
  
  const iconMap: Record<View, React.ReactElement> = {
    tools: <ImageIcon />,
    history: <HistoryIcon />,
  };

  const labelMap: Record<View, string> = {
    tools: 'الأدوات',
    history: 'السجل',
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow container mx-auto flex flex-col">
        <div className="relative w-full border-b border-gray-200 dark:border-gray-700 px-4">
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

        <div className={`flex-grow ${view === 'tools' && selectedTool ? '' : 'p-4'}`}>
          {renderContent()}
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

export default App;