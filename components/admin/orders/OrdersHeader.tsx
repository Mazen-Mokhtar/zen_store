'use client';

import React from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { Order } from './types';

interface OrdersHeaderProps {
  onExport: () => void;
  onRefresh: () => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  onExport,
  onRefresh
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          إدارة جميع طلبات العملاء
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
        >
          <FiDownload className="w-4 h-4" />
          تصدير
        </button>
        
        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          <FiRefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>
    </div>
  );
};