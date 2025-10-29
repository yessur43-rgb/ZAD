import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("لم نتمكن من الوصول إلى الكاميرا. يرجى منح الإذن والمحاولة مرة أخرى.");
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCaptureClick = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center z-10">
        <h3 className="text-white text-lg font-bold">التقاط صورة</h3>
        <button onClick={onClose} className="bg-white/20 text-white rounded-full p-2 hover:bg-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="w-full h-full flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="absolute top-1/2 -translate-y-1/2 p-4 bg-red-500 text-white rounded-lg z-20">
            {error}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center z-10">
        {capturedImage ? (
          <div className="flex items-center gap-8">
            <button onClick={() => setCapturedImage(null)} className="text-white font-semibold text-lg">
              إعادة التقاط
            </button>
            <button onClick={handleConfirm} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
              استخدام الصورة
            </button>
          </div>
        ) : (
          <button onClick={handleCaptureClick} className="w-20 h-20 bg-white rounded-full border-4 border-black/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white" aria-label="Take picture" />
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
