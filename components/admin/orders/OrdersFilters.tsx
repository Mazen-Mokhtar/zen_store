'use client';

import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { OrderFilters } from './types';
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, SORT_OPTIONS } from './constants';

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  loading?: boolean;
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
      statusFilter: statusFilter as any
    });
  };

  const handlePaymentStatusChange = (paymentStatus: string) => {
    onFiltersChange({
      ...filters,
      paymentStatus: paymentStatus as any
    });
  };

  const handleDateFromChange = (dateFrom: string) => {
    onFiltersChange({
      ...filters,
      dateFrom
    });
  };

  const handleDateToChange = (dateTo: string) => {
    onFiltersChange({
      ...filters,
      dateTo
    });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy as any,
      sortOrder
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
      <div className="space-y-4">
        {/* Search and Status Row */}
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

        {/* Payment Status and Date Range Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <select
              value={filters.paymentStatus || ''}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="flex-1">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                placeholder="من تاريخ"
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                placeholder="إلى تاريخ"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
              }}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};