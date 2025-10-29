import React, { useState, useRef } from 'react';
import { analyzeMenuImage } from '../services/geminiService';
import { HalalHaramListResponse } from '../types';
import MenuResultCard from './MenuResultCard';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CameraIcon } from './icons/CameraIcon';
import { MenuIcon } from './icons/MenuIcon';

const MenuAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HalalHaramListResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResult(null);
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!imageFile || !image) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = image.split(',')[1];
      const analysisResult = await analyzeMenuImage(base64Data, imageFile.type);
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">تحليل قائمة الطعام</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">صوّر قائمة الطعام وسأساعدك في تحديد الخيارات الحلال.</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center text-center">
          <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
          />
          {image ? (
              <div className="relative">
              <img src={image} alt="Preview" className="max-h-60 rounded-lg shadow-md" />
              <button 
                  onClick={() => {
                      setImage(null);
                      setImageFile(null);
                      setResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                  }} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center h-48">
                  <MenuIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">اسحب وأفلت صورة القائمة هنا، أو انقر للبحث</p>
              </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
                <CameraIcon className="w-5 h-5" />
                <span>{image ? 'تغيير الصورة' : 'تحميل صورة'}</span>
            </button>
        </div>
        
        {image && (
          <button
              onClick={handleAnalyzeClick}
              disabled={isLoading}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
          >
              {isLoading ? <LoadingSpinner /> : '🔍'}
              <span className="ml-2">{isLoading ? 'جاري التحليل...' : 'تحليل القائمة'}</span>
          </button>
        )}
      </div>

      <div className="mt-8 w-full max-w-2xl">
        {isLoading && (
            <div className="text-center text-gray-600 dark:text-gray-400">
                <p>...يتم تحليل القائمة، يرجى الانتظار</p>
            </div>
        )}
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
        {result && <MenuResultCard result={result} />}
      </div>
    </div>
  );
};

export default MenuAnalyzer;