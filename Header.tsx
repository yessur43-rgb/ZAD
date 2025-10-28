import React from 'react';
import { AppIcon } from './components/icons/AppIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <AppIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">زاد</span>
        </div>
        <h1 className="text-sm font-bold text-gray-500 dark:text-gray-400">
            zad
        </h1>
      </div>
    </header>
  );
};

export default Header;
