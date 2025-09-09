'use client';

import React, { memo, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { sortOptions } from './constants';
import { SearchFiltersProps } from './types';

const SearchFilters: React.FC<SearchFiltersProps> = memo(({
  searchTerm,
  sortBy,
  onSearchChange,
  onSortChange,
}) => {
  const { t } = useTranslation();

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as any);
  }, [onSortChange]);

  return (
    <div className="w-full">
      <div className="bg-[#232329] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                placeholder={t('dashboard.searchGames')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-[#1A1B20] text-white placeholder-gray-400 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                aria-label={t('dashboard.searchGames')}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg 
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[180px] md:min-w-[200px]">
            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full bg-[#1A1B20] text-white rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 pr-8 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 appearance-none cursor-pointer"
                aria-label={t('dashboard.sortBy')}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1A1B20] text-white">
                    {t(option.label)}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg 
                  className="w-4 h-4 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SearchFilters.displayName = 'SearchFilters';

export default SearchFilters;