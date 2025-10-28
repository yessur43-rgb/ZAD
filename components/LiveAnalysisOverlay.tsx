import React from 'react';
import { GeminiResponse, HalalStatusArabic } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { QuestionIcon } from './icons/QuestionIcon';

interface LiveAnalysisOverlayProps {
  result: GeminiResponse | null;
  isAnalyzing: boolean;
}

const getStatusDetails = (status: HalalStatusArabic) => {
    switch (status) {
        case 'حلال': return { text: 'حلال', color: 'text-emerald-500 dark:text-emerald-400', Icon: CheckIcon };
        case 'حرام': return { text: 'حرام', color: 'text-red-500 dark:text-red-400', Icon: XIcon };
        case 'مجهول': return { text: 'مجهول', color: 'text-amber-500 dark:text-amber-400', Icon: QuestionIcon };
        default: return { text: 'غير معلوم', color: 'text-gray-500 dark:text-gray-400', Icon: QuestionIcon };
    }
};

const LiveAnalysisOverlay: React.FC<LiveAnalysisOverlayProps> = ({ result, isAnalyzing }) => {
  if (!isAnalyzing && !result) {
    return null; // Don't show anything if not started
  }

  const { text, color, Icon } = result ? getStatusDetails(result.الحالة) : { text: 'جاري التحليل...', color: 'text-gray-500 dark:text-gray-400', Icon: null };

  return (
    <div className="w-full mt-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {result && Icon ? (
            <Icon className={`w-12 h-12 ${color}`} />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className={`text-2xl font-bold truncate ${color}`}>{text}</h3>
          <div className="mt-1">
            {result && result.الأدلة.length > 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                <span className="font-semibold">الأدلة: </span>
                {result.الأدلة.join(', ')}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isAnalyzing ? 'وجه الكاميرا نحو قائمة المكونات...' : 'لم يتم العثور على أدلة.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalysisOverlay;