import React, { useState, useRef } from 'react';
import { analyzeImage, analyzeBarcode } from '../services/geminiService';
import { GeminiResponse } from '../types';
import ResultCard from './ResultCard';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CameraIcon } from './icons/CameraIcon';
import { BarcodeIcon } from './icons/BarcodeIcon';
import BarcodeScanner from './BarcodeScanner';
// FIX: Import function to save analysis results to history.
import { saveScanHistoryItem } from '../utils/storage';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiResponse | null>(null);
  const [isScannerOpen, setScannerOpen] = useState<boolean>(false);

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
      const analysisResult = await analyzeImage(base64Data, imageFile.type);
      setResult(analysisResult);
      // FIX: Save successful image analysis to history.
      saveScanHistoryItem({
        type: 'image',
        identifier: imageFile.name,
        result: analysisResult,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScannerOpen(false);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImage(null);
    setImageFile(null);

    try {
        const analysisResult = await analyzeBarcode(barcode);
        setResult(analysisResult);
        // FIX: Save successful barcode analysis to history.
        saveScanHistoryItem({
            type: 'barcode',
            identifier: barcode,
            result: analysisResult
        });
    } catch(err) {
        const errorMessage = err instanceof Error ? err.message : 'فشل تحليل الباركود. يرجى المحاولة مرة أخرى.';
        setError(errorMessage);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      {isScannerOpen && <BarcodeScanner onScanSuccess={handleBarcodeScan} onClose={() => setScannerOpen(false)} />}
      
        <div className="w-full max-w-md">
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
                    <CameraIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-500">اسحب وأفلت صورة المنتج هنا، أو انقر للبحث</p>
                </div>
            )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                    <CameraIcon className="w-5 h-5" />
                    <span>{image ? 'تغيير الصورة' : 'تحميل صورة'}</span>
                </button>
                <button
                    onClick={() => setScannerOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                    <BarcodeIcon className="w-5 h-5" />
                    <span>مسح باركود</span>
                </button>
            </div>
            
            {image && (
            <button
                onClick={handleAnalyzeClick}
                disabled={isLoading}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
            >
                {isLoading ? <LoadingSpinner /> : '🔍'}
                <span className="ml-2">{isLoading ? 'جاري التحليل...' : 'تحليل الصورة'}</span>
            </button>
            )}
        </div>


      <div className="mt-8 w-full max-w-md">
        {isLoading && (
            <div className="text-center text-gray-500">
                <p>...يتم تحليل الصورة، يرجى الانتظار</p>
            </div>
        )}
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
};

export default ImageAnalyzer;