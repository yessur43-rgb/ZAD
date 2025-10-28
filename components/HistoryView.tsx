import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, HalalStatus, HalalStatusArabic } from '../types';
import { getScanHistory, clearScanHistory } from '../utils/storage';
import ResultCard from './ResultCard';
import { BarcodeIcon } from './icons/BarcodeIcon';
import { ImageIcon } from './icons/ImageIcon';
import StatusBadge from './StatusBadge';

const mapArabicToEnglishStatus = (arabicStatus: HalalStatusArabic): HalalStatus => {
    switch (arabicStatus) {
        case 'حلال': return 'Halal';
        case 'حرام': return 'Haram';
        case 'مجهول': return 'Mushbooh';
        default: return 'Unknown';
    }
};


const HistoryView: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    const loadHistory = useCallback(() => {
        setHistory(getScanHistory());
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);
    
    const handleClearHistory = () => {
        if (window.confirm('هل أنت متأكد أنك تريد مسح كل سجل الفحص؟ لا يمكن التراجع عن هذا الإجراء.')) {
            clearScanHistory();
            loadHistory(); // Reload to show empty state
        }
    };


    if (selectedItem) {
        return (
            <div className="flex flex-col items-center">
                <button onClick={() => setSelectedItem(null)} className="mb-4 self-start px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
                    &larr; العودة إلى السجل
                </button>
                <ResultCard result={selectedItem.result} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">سجل الفحص</h2>
                {history.length > 0 && (
                    <button onClick={handleClearHistory} className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600">
                        مسح السجل
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                    <p>لا توجد عناصر في سجلك حتى الآن. <br/> أي منتج تقوم بفحصه سيظهر هنا.</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto">
                    {history.map((item) => (
                         <div key={item.id} onClick={() => setSelectedItem(item)} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4 min-w-0">
                                     <div className="flex-shrink-0">
                                        {item.type === 'barcode' ? <BarcodeIcon className="h-8 w-8 text-gray-400" /> : <ImageIcon className="h-8 w-8 text-gray-400" />}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{item.identifier}</p>
                                        <p className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleString('ar-SA')}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                    <StatusBadge status={mapArabicToEnglishStatus(item.result.الحالة)} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryView;