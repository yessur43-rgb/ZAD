import React, { useEffect, useRef, useState } from 'react';

// This component uses @zxing/library for barcode scanning.
// Ensure it is installed in your project: `npm install @zxing/library`
import { BrowserMultiFormatReader, NotFoundException, IWebcamControls } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (result: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IWebcamControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !videoRef.current) {
      return;
    }

    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        const constraints = {
            video: { facingMode: 'environment' }
        };

        if (!videoRef.current) {
            setError('عنصر الفيديو غير متوفر.');
            return;
        };

        controlsRef.current = await codeReader.decodeFromConstraints(
            constraints,
            videoRef.current,
            (result, err) => {
              if (result) {
                onScanSuccess(result.getText());
              }
              if (err && !(err instanceof NotFoundException)) {
                console.error('Barcode scan error:', err);
                setError('تعذر مسح الباركود. يرجى المحاولة مرة أخرى.');
              }
            }
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                 setError('تم رفض إذن الكاميرا. يرجى منح الإذن وإعادة تحميل الصفحة.');
            } else {
                 setError('تعذر بدء تشغيل الماسح الضوئي. هل يوجد تطبيق آخر يستخدم الكاميرا؟');
            }
        } else {
            setError('تعذر بدء تشغيل الماسح الضوئي. يرجى منح إذن استخدام الكاميرا.');
        }
      }
    };

    startScanner();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">امسح الباركود</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold">&times;</button>
        </div>
        <div className="relative w-full aspect-square bg-gray-900 rounded-md overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-3/4 h-1/2 border-2 border-dashed border-red-500 rounded-lg"></div>
          </div>
        </div>
        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;