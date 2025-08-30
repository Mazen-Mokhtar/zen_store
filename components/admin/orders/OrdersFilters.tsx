'use client';

import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { OrderFilters } from './types';
import { ORDER_STATUS_OPTIONS } from './constants';

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleSearchChange = (searchTerm: string) => {
    onFiltersChange({
      ...filters,
      searchTerm
    });
  };

  const handleStatusFilterChange = (statusFilter: string) => {
    onFiltersChange({
      ...filters,
      statusFilter
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="البحث برقم الطلب أو البريد الإلكتروني أو اسم العميل..."
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>
        
        <div className="w-full sm:w-48">
          <select
            value={filters.statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};