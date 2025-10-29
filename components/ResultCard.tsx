import React, { useState } from 'react';
import { GeminiResponse, HalalStatusArabic, HealthPoint } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { QuestionIcon } from './icons/QuestionIcon';
import InfoModal from './InfoModal';
import { getIngredientInfo } from '../services/geminiService';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { InfoIcon } from './icons/InfoIcon';

interface ResultCardProps {
  result: GeminiResponse;
}

const getStatusDetails = (status: HalalStatusArabic) => {
    switch (status) {
        case 'حلال': return { text: 'حلال', color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/50', Icon: CheckIcon };
        case 'حرام': return { text: 'حرام', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/50', Icon: XIcon };
        case 'مجهول': return { text: 'مجهول', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/50', Icon: QuestionIcon };
        default: return { text: 'غير معلوم', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700/50', Icon: QuestionIcon };
    }
};

const HealthAssessment: React.FC<{ assessment?: GeminiResponse['التقييم_الصحي'] }> = ({ assessment }) => {
  if (!assessment || !assessment.ملخص || assessment.نقاط.length === 0) {
    // If there's a summary saying no info was found, but no points, show summary.
    if(assessment?.ملخص && assessment.نقاط.length === 0){
        return (
             <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">التقييم الصحي</h4>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{assessment.ملخص}</p>
            </div>
        )
    }
    return null;
  }

  const getPointDetails = (type: HealthPoint['النوع']) => {
    switch (type) {
      case 'إيجابي': return { color: 'text-green-600 dark:text-green-400', Icon: ThumbsUpIcon };
      case 'سلبي': return { color: 'text-red-600 dark:text-red-400', Icon: ThumbsDownIcon };
      default: return { color: 'text-blue-600 dark:text-blue-400', Icon: InfoIcon };
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">التقييم الصحي</h4>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{assessment.ملخص}</p>
      <ul className="mt-3 space-y-2">
        {assessment.نقاط.map((point, index) => {
          const { color, Icon } = getPointDetails(point.النوع);
          return (
            <li key={index} className={`flex items-start gap-2 ${color}`}>
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="font-semibold">{point.نقطة}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};


const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { text, color, bgColor, Icon } = getStatusDetails(result.الحالة);

  const handleEvidenceClick = async (evidence: string) => {
    setIsLoading(true);
    setModalTitle(`معلومات عن: ${evidence}`);
    setModalContent(null);
    const info = await getIngredientInfo(evidence);
    setModalContent(info);
    setIsLoading(false);
  };

  const isEvidenceClickable = result.الحالة === 'مجهول' || result.الحالة === 'حرام';

  return (
    <div className={`w-full max-w-md p-6 rounded-2xl shadow-lg border ${bgColor} border-opacity-50`}>
      { (modalContent || isLoading) && 
        <InfoModal 
          title={modalTitle} 
          content={modalContent} 
          isLoading={isLoading}
          onClose={() => setModalContent(null)} 
        />
      }
      
      <div className="flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${bgColor}`}>
            <Icon className={`w-12 h-12 ${color}`} />
        </div>
        <h3 className={`mt-4 text-3xl font-extrabold ${color}`}>{text}</h3>
        <p className="mt-2 text-gray-700 dark:text-gray-300 font-semibold">{result.السبب}</p>
      </div>

      {result.الأدلة && result.الأدلة.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">الأدلة:</h4>
          <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {result.الأدلة.map((evidence, index) => (
              <li key={index}>
                {isEvidenceClickable ? (
                    <button 
                      onClick={() => handleEvidenceClick(evidence)} 
                      className="text-left underline decoration-dotted hover:text-emerald-500 dark:hover:text-emerald-400"
                    >
                        {evidence}
                    </button>
                ) : (
                    <span>{evidence}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <HealthAssessment assessment={result.التقييم_الصحي} />

      {result.الحالة === 'مجهول' && (
          <p className="mt-4 text-xs text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
            نصيحة: عند الشك، يفضل ترك المنتج أو التواصل مع الشركة المصنعة للتأكد من مصدر المكونات.
          </p>
      )}
    </div>
  );
};

export default ResultCard;