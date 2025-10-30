import React, { useState, useRef, lazy, Suspense } from 'react';
import { analyzeImage, analyzeBarcode } from '../services/geminiService';
import { GeminiResponse } from '../types';
import ResultCard from './ResultCard';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CameraIcon } from './icons/CameraIcon';
import { BarcodeIcon } from './icons/BarcodeIcon';
import BarcodeScanner from './BarcodeScanner';
import { saveScanHistoryItem } from '../utils/storage';
import { ImageIcon } from './icons/ImageIcon';

const CameraCapture = lazy(() => import('./LiveAnalysis')); // The file is renamed conceptually, but we are overwriting LiveAnalysis.tsx

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiResponse | null>(null);
  const [isScannerOpen, setScannerOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCapture = async (dataUrl: string) => {
    setIsCameraOpen(false);
    setResult(null);
    setError(null);

    try {
        const file = dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
        setImageFile(file);

        // Compress the captured image
        const compressed = await compressImage(file);
        setImage(compressed);
        console.log('✅ Camera image compressed. Original:', file.size, 'bytes, Compressed:', compressed.length, 'chars');
    } catch(e) {
        console.error("Failed to process captured image", e);
        setError("فشل معالجة الصورة الملتقطة.");
    }
  };


  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large (max 1600px for product analysis quality)
          const maxSize = 1600;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.85 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResult(null);
      setError(null);
      setImageFile(file);

      try {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          setImage(compressed);
          console.log('✅ Image compressed. Original:', file.size, 'bytes, Compressed:', compressed.length, 'chars');
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error('❌ Error compressing image:', error);
        setError('حدث خطأ في معالجة الصورة. حاول مرة أخرى.');
      }
    }
  };

  const handleAnalyzeClick = async () => {
    if (!imageFile || !image) return;

    console.log('🔍 Starting product analysis...');
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = image.split(',')[1];
      console.log('📤 Sending image to API. Size:', base64Data.length, 'characters');

      const analysisResult = await analyzeImage(base64Data, 'image/jpeg');

      console.log('✅ Product analysis complete:', analysisResult);
      setResult(analysisResult);

      // Save successful image analysis to history
      saveScanHistoryItem({
        type: 'image',
        identifier: imageFile.name,
        result: analysisResult,
      });
    } catch (err) {
      console.error('❌ Product analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('✅ Analysis complete, loading stopped');
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
  
  if (isCameraOpen) {
    return (
      <Suspense fallback={<div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}>
        <CameraCapture onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />
      </Suspense>
    );
  }

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
                    <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">اسحب وأفلت صورة المنتج هنا، أو انقر للبحث</p>
                </div>
            )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                    <ImageIcon className="w-5 h-5" />
                    <span>{image ? 'تغيير الصورة' : 'تحميل صورة'}</span>
                </button>
                <button
                    onClick={() => setScannerOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                    <BarcodeIcon className="w-5 h-5" />
                    <span>باركود</span>
                </button>
                 <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                    <CameraIcon className="w-5 h-5" />
                    <span>الكاميرا</span>
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
            <div className="text-center text-gray-600 dark:text-gray-400">
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