import React, { useState } from 'react';
import { AppIcon } from './icons/AppIcon';
import { KeyIcon } from './icons/KeyIcon';

interface HeaderProps {
    onClearApiKey: () => void;
    onReplaceApiKey: (key: string) => void;
    hasApiKey: boolean;
}

const Header: React.FC<HeaderProps> = ({ onClearApiKey, onReplaceApiKey, hasApiKey }) => {
  const [modalState, setModalState] = useState<'closed' | 'confirm' | 'replace'>('closed');
  const [newKey, setNewKey] = useState('');

  const handleConfirmDelete = () => {
    onClearApiKey();
    setModalState('closed');
  };
  
  const handleConfirmReplace = (e: React.FormEvent) => {
      e.preventDefault();
      if(newKey.trim()){
          onReplaceApiKey(newKey.trim());
          setNewKey('');
          setModalState('closed');
      }
  }

  const openModal = () => setModalState('confirm');
  const closeModal = () => {
      setModalState('closed');
      setNewKey(''); // Reset input if modal is closed
  };

  const renderModalContent = () => {
      if (modalState === 'confirm') {
          return (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">إدارة مفتاح API</h2>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                    ماذا تريد أن تفعل بمفتاحك المحفوظ؟
                </p>
                <div className="mt-6 flex flex-col gap-3">
                    <button 
                        onClick={() => setModalState('replace')}
                        className="w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
                    >
                        استبدال المفتاح
                    </button>
                    <button 
                        onClick={handleConfirmDelete}
                        className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                    >
                        حذف المفتاح
                    </button>
                    <button 
                        onClick={closeModal}
                        className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        إلغاء
                    </button>
                </div>
              </>
          );
      }
      if (modalState === 'replace') {
          return (
               <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">استبدال مفتاح API</h2>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                    أدخل مفتاح Gemini API الجديد الخاص بك.
                </p>
                <form onSubmit={handleConfirmReplace} className="mt-6">
                    <input
                        type="password"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="w-full p-3 text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="أدخل المفتاح الجديد هنا"
                        required
                        autoFocus
                    />
                    <div className="mt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setModalState('confirm')}
                            className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            رجوع
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:bg-emerald-300"
                            disabled={!newKey.trim()}
                        >
                            حفظ الجديد
                        </button>
                    </div>
                </form>
              </>
          );
      }
      return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <AppIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">زاد</span>
        </div>
        {hasApiKey && (
             <button 
                onClick={openModal}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="إدارة مفتاح API"
             >
                <KeyIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
        )}
      </div>
      
       {modalState !== 'closed' && (
        <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                  {renderModalContent()}
              </div>
            </div>
             <style>{`
              @keyframes fade-in {
                  from { opacity: 0; transform: scale(0.95); }
                  to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in {
                  animation: fade-in 0.2s ease-out forwards;
              }
            `}</style>
        </>
      )}
    </header>
  );
};

export default Header;