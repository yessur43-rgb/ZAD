import React, { useState } from 'react';
import { AppIcon } from './icons/AppIcon';
import { validateApiKey } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface ApiKeyInputProps {
    onKeySubmit: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit }) => {
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        const isValid = await validateApiKey(key.trim());

        if (isValid) {
            onKeySubmit(key.trim());
        } else {
            setError('المفتاح الذي أدخلته غير صالح. يرجى التحقق منه والمحاولة مرة أخرى.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 text-center animate-fade-in">
                <AppIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">مرحباً بك في زاد</h1>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                    للبدء، يرجى إدخال مفتاح Gemini API الخاص بك. سيتم التحقق منه وحفظه في متصفحك بأمان.
                </p>
                <form onSubmit={handleSubmit} className="mt-8">
                     <input
                        type="password"
                        value={key}
                        onChange={(e) => {
                            setKey(e.target.value);
                            setError(null); // Clear error on new input
                        }}
                        className={`w-full p-3 text-center bg-gray-100 dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            error 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500'
                        }`}
                        placeholder="أدخل مفتاح API هنا"
                        required
                        disabled={isLoading}
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <button
                        type="submit"
                        className="mt-4 w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:bg-emerald-400 disabled:cursor-wait flex items-center justify-center"
                        disabled={isLoading || !key.trim()}
                    >
                        {isLoading ? <LoadingSpinner/> : null}
                        {isLoading ? 'جاري التحقق...' : 'حفظ ومتابعة'}
                    </button>
                </form>
                 <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    يمكنك الحصول على مفتاحك من{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-500">
                        Google AI Studio
                    </a>.
                </p>
            </div>
            <style>{`
              @keyframes fade-in {
                  from { opacity: 0; transform: scale(0.95); }
                  to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in {
                  animation: fade-in 0.3s ease-out forwards;
              }
            `}</style>
        </div>
    );
};

export default ApiKeyInput;