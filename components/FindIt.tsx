import React, { useState, useRef } from 'react';
import { identifyObjectOrPlace, findProductInStores, findProductInStoresByText, findVignetteInfo } from '../services/geminiService';
import { FindItResponse, FindItCategory, VignetteDetailsResponse, IdentificationResponse, UserLocation } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { CameraIcon } from './icons/CameraIcon';
import PlaceCard from './RestaurantCard';
import { FindItIcon } from './icons/FindItIcon';
import { VignetteIcon } from './icons/VignetteIcon';
import VignetteInfoCard from './VignetteInfoCard';
import IdentificationInfoCard from './LandmarkInfoCard';
import { SightseeingIcon } from './icons/SightseeingIcon';

interface FindItProps {
  location: UserLocation | null;
}

const FindIt: React.FC<FindItProps> = ({ location }) => {
  const [category, setCategory] = useState<FindItCategory>('product');
  
  // Product state
  const [productName, setProductName] = useState<string>('');
  const [productResult, setProductResult] = useState<FindItResponse | null>(null);

  // Vignette state
  const [country, setCountry] = useState<string>('');
  const [vignetteResult, setVignetteResult] = useState<VignetteDetailsResponse | null>(null);
  
  // Identification state
  const [identificationResult, setIdentificationResult] = useState<IdentificationResponse | null>(null);

  // Common state
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setImage(null);
    setImageFile(null);
    setProductName('');
    setProductResult(null);
    setCountry('');
    setVignetteResult(null);
    setIdentificationResult(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCategoryChange = (newCategory: FindItCategory) => {
    if (newCategory !== category) {
      resetState();
      setCategory(newCategory);
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

          // Resize if too large (max 1600px on longest side for better quality analysis)
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

          // Compress to JPEG with 0.85 quality (better quality for product recognition)
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
      resetState();
      setImageFile(file);

      try {
        if (file.type.startsWith('image/')) {
          // Compress image before storing
          const compressed = await compressImage(file);
          setImage(compressed);
          console.log('✅ Image compressed. Original:', file.size, 'bytes, Compressed:', compressed.length, 'chars');
        } else {
          // Non-image files (shouldn't happen with accept="image/*" but just in case)
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error('❌ Error compressing image:', error);
        alert('حدث خطأ في معالجة الصورة. حاول مرة أخرى.');
        resetState();
      }
    }
  };

  const handleAnalyzeClick = async () => {
    if (!imageFile || !image) return;
    if (!location) {
        setError('الموقع مطلوب للعثور على المتاجر القريبة. يرجى تمكين الوصول إلى الموقع.');
        return;
    }

    console.log('🔍 Starting product analysis...');
    setIsLoading(true);
    setError(null);
    setProductResult(null);

    try {
      const base64Data = image.split(',')[1];
      console.log('📤 Sending image to API. Size:', base64Data.length, 'characters');

      const analysisResult = await findProductInStores(base64Data, 'image/jpeg', location);

      console.log('✅ Product analysis complete:', analysisResult);
      setProductResult(analysisResult);
    } catch (err) {
      console.error('❌ Product analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('✅ Analysis complete, loading stopped');
    }
  };
  
  const handleTextSearchClick = async () => {
    if (!productName.trim()) return;
    if (!location) {
      setError('الموقع مطلوب للعثور على المتاجر القريبة. يرجى تمكين الوصول إلى الموقع.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProductResult(null);
    setImage(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const searchResult = await findProductInStoresByText(productName, location);
      setProductResult(searchResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVignetteSearchClick = async () => {
    if (!country.trim()) return;
    setIsLoading(true);
    setError(null);
    setVignetteResult(null);

    try {
        const result = await findVignetteInfo(country);
        setVignetteResult(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        setError(errorMessage);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleIdentificationAnalyzeClick = async () => {
    if (!imageFile || !image) return;

    console.log('🔍 Starting object identification...');
    setIsLoading(true);
    setError(null);
    setIdentificationResult(null);

    try {
      const base64Data = image.split(',')[1];
      console.log('📤 Sending image to API. Size:', base64Data.length, 'characters');

      const analysisResult = await identifyObjectOrPlace(base64Data, 'image/jpeg');

      console.log('✅ Identification complete:', analysisResult);
      setIdentificationResult(analysisResult);
    } catch (err) {
      console.error('❌ Identification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('✅ Identification complete, loading stopped');
    }
  };

  const handleSearchForItem = async (itemName: string) => {
    if (!location) {
      setError('الموقع مطلوب للبحث عن المتاجر. يرجى تمكين الوصول إلى الموقع.');
      return;
    }

    console.log('🔍 Searching for item:', itemName);
    setCategory('product');
    setIsLoading(true);
    setError(null);
    setProductResult(null);
    setIdentificationResult(null);

    try {
      const searchResult = await findProductInStoresByText(itemName, location);
      setProductResult(searchResult);
      console.log('✅ Search complete:', searchResult);
    } catch (err) {
      console.error('❌ Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLocationPermissionMessage = () => {
      if (category !== 'product' || location) return null;
      
      return (
          <div className="p-4 my-4 text-center border border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                  للبحث عن المنتجات، يرجى تمكين الوصول إلى الموقع من الشاشة الرئيسية.
              </p>
          </div>
      )
  }

  const renderProductSearch = () => (
    <>
      <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6 text-center">صوّر أي منتج أو اكتب اسمه وسأبحث لك عن أماكن تبيعه بالقرب منك.</p>
      {renderLocationPermissionMessage()}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleTextSearchClick()}
          placeholder="مثال: حليب شوكولاتة KDD"
          className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isLoading}
        />
        <button
          onClick={handleTextSearchClick}
          disabled={isLoading || !productName.trim() || !location}
          className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition flex items-center justify-center"
        >
          {isLoading && productName ? <LoadingSpinner /> : <FindItIcon className="w-5 h-5" />}
          <span className="ml-2">ابحث بالاسم</span>
        </button>
      </div>
      
      <div className="flex items-center text-center my-6">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="flex-shrink-0 mx-4 text-gray-600 dark:text-gray-400 font-semibold">أو</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
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
                setProductResult(null);
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
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">اسحب وأفلت صورة المنتج هنا، أو انقر للبحث</p>
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
          disabled={isLoading || !image || !location}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition"
        >
          {isLoading && image ? <LoadingSpinner /> : <CameraIcon className="w-5 h-5" />}
          <span className="ml-2">{isLoading ? 'جاري البحث...' : 'أوجد بالصورة'}</span>
        </button>
      )}
    </>
  );

  const renderVignetteSearch = () => (
    <>
      <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6 text-center">مسافر بالسيارة؟ أدخل اسم الدولة للحصول على معلومات مفصلة عن استيكر العبور.</p>
      <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleVignetteSearchClick()}
            placeholder="أدخل اسم الدولة (مثال: النمسا، سويسرا)"
            className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
          <button
            onClick={handleVignetteSearchClick}
            disabled={isLoading || !country.trim()}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner /> : <VignetteIcon className="w-5 h-5" />}
            <span className="ml-2">ابحث عن استيكر</span>
          </button>
        </div>
    </>
  );
  
    const renderIdentificationSearch = () => (
    <>
      <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6 text-center">صوّر أي شيء وسأبحث لك عن معلومات مفصلة عنه وكيفية الوصول إليه إن كان مكاناً.</p>
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
                setIdentificationResult(null);
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
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">اسحب وأفلت صورة الشيء هنا، أو انقر للبحث</p>
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
          onClick={handleIdentificationAnalyzeClick}
          disabled={isLoading || !image}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
        >
          {isLoading ? <LoadingSpinner /> : <SightseeingIcon className="w-5 h-5" />}
          <span className="ml-2">{isLoading ? 'جاري التعرف...' : 'تعرف على ما في الصورة'}</span>
        </button>
      )}
    </>
  );


  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">أوجدها لي</h2>
        </div>

        <div className="flex items-center justify-center gap-1 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-gray-100 dark:bg-gray-700">
            <button onClick={() => handleCategoryChange('product')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${category === 'product' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                <FindItIcon className="w-5 h-5" /> المنتجات
            </button>
            <button onClick={() => handleCategoryChange('vignette')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${category === 'vignette' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                <VignetteIcon className="w-5 h-5" /> استيكر العبور
            </button>
            <button onClick={() => handleCategoryChange('identify')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 whitespace-nowrap ${category === 'identify' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                <SightseeingIcon className="w-5 h-5" /> ما هذا؟
            </button>
        </div>

        {category === 'product' ? renderProductSearch() : category === 'vignette' ? renderVignetteSearch() : renderIdentificationSearch()}

      </div>

      <div className="mt-8 w-full max-w-3xl">
        {isLoading && (
            <div className="text-center text-gray-500">
                <p>...جاري البحث، يرجى الانتظار</p>
            </div>
        )}
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
        
        {productResult && category === 'product' && (
            <div className="space-y-4">
                 <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">نتائج البحث لـ:</p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{productResult.identifiedProduct}</h3>
                 </div>
                 <p className="text-gray-700 dark:text-gray-300">{productResult.aiResponseText}</p>
                 {productResult.places && productResult.places.length > 0 ? (
                    <div className="space-y-3">
                        {productResult.places.map((place, index) => (
                            <PlaceCard key={index} place={place} category="supermarkets" />
                        ))}
                    </div>
                 ) : (
                    !isLoading && <p className="text-center text-gray-600 dark:text-gray-400 p-4">لم يتم العثور على متاجر قريبة تبيع هذا المنتج.</p>
                 )}
            </div>
        )}

        {vignetteResult && category === 'vignette' && (
             <VignetteInfoCard result={vignetteResult} />
        )}
        
        {identificationResult && category === 'identify' && (
             <IdentificationInfoCard
               result={identificationResult}
               onSearchForIt={handleSearchForItem}
             />
        )}
      </div>
    </div>
  );
};

export default FindIt;