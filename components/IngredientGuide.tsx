
import React, { useState } from 'react';
import { getIngredientInfo } from '../services/geminiService';
import { IngredientIcon } from './icons/IngredientIcon';

const IngredientGuide: React.FC = () => {
  const [ingredient, setIngredient] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedTerm, setSearchedTerm] = useState<string>('');

  const handleSearch = async () => {
    if (!ingredient.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSearchedTerm(ingredient);
    try {
      const info = await getIngredientInfo(ingredient);
      setResult(info);
    } catch (err) {
      setError('حدث خطأ أثناء البحث عن المكون. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">دليل المكونات الحلال</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">ابحث عن أي مكون غذائي لمعرفة مصدره وحكمه الشرعي.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="مثال: جيلاتين، E471، ليسيثين الصويا"
            className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !ingredient.trim()}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center"
          >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            <span>{isLoading ? 'بحث...' : 'ابحث'}</span>
          </button>
        </div>

        <div className="mt-8 w-full">
          {isLoading && (
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>...يتم البحث، يرجى الانتظار</p>
            </div>
          )}
          {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
          {result && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">نتائج البحث عن: "{searchedTerm}"</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{result}</p>
            </div>
          )}
          {!isLoading && !result && !error && (
             <div className="text-center text-gray-500 dark:text-gray-500 pt-8">
                <IngredientIcon className="w-16 h-16 mx-auto mb-4" />
                <p>أدخل اسم المكون أعلاه لبدء البحث.</p>
             </div>
          )}
        </div>
      </div>
       <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default IngredientGuide;