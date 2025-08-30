'use client';

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { sortOptions } from './constants';
import type { SearchFiltersProps } from './types';

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  sortBy,
  onSearchChange,
  onSortChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6">
      <div className="bg-[#232329] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('dashboard.searchGames')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#1A1B20] border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          
          {/* Sort Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
              className="bg-[#1A1B20] border border-gray-600 rounded-lg pl-10 pr-8 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[150px]"
            >
              {sortOptions.map((option) => (
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

export default SearchFilters;