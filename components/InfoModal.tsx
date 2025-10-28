import React from 'react';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface InfoModalProps {
  title: string;
  content: string | null;
  isLoading: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ title, content, isLoading, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8 relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex-shrink-0">{title}</h2>
        
        <div className="overflow-y-auto min-h-[100px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري جلب المعلومات...</span>
               </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;