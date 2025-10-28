
import React from 'react';
import { HalalStatus, HalalStatusArabic } from '../types';

interface StatusBadgeProps {
  status: HalalStatus;
}

const statusTranslations: Record<HalalStatus, string> = {
    Halal: 'حلال',
    Haram: 'حرام',
    Mushbooh: 'مجهول', // Changed from 'مشبوه' to 'مجهول'
    Unknown: 'غير معلوم',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Halal':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'Haram':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Mushbooh': // This corresponds to 'مجهول'
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full inline-block ${getStatusClass()}`}
    >
      {statusTranslations[status] || status}
    </span>
  );
};

export default StatusBadge;