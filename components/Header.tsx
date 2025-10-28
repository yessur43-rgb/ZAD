
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">Halal AI</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-200 text-center">
            مساعد الامتثال الحلال
        </h1>
      </div>
    </header>
  );
};

export default Header;