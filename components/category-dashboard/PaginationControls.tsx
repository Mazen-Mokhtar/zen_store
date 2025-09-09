'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToFirstPage: () => void;
  onGoToLastPage: () => void;
  onGoToPage: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  onGoToFirstPage,
  onGoToLastPage,
  onGoToPage,
  className = ''
}: PaginationControlsProps) {
  const { t } = useTranslation();

  // Don't show pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center gap-2 mt-8 ${className}`}>
      {/* First Page Button */}
      <button
        onClick={onGoToFirstPage}
        disabled={!hasPrevPage}
        className="p-2 rounded-lg bg-[#232329] border border-gray-600 text-white hover:bg-[#18181c] hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={t('pagination.firstPage')}
        title={t('pagination.firstPage')}
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Previous Page Button */}
      <button
        onClick={onPrevPage}
        disabled={!hasPrevPage}
        className="p-2 rounded-lg bg-[#232329] border border-gray-600 text-white hover:bg-[#18181c] hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={t('pagination.previousPage')}
        title={t('pagination.previousPage')}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`dots-${index}`}
                className="px-3 py-2 text-gray-400 select-none"
              >
                ...
              </span>
            );
          }

          const pageNumber = page as number;
          const isCurrentPage = pageNumber === currentPage;

          return (
            <button
              key={pageNumber}
              onClick={() => onGoToPage(pageNumber)}
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                isCurrentPage
                  ? 'bg-green-600 text-white border border-green-500 shadow-lg'
                  : 'bg-[#232329] border border-gray-600 text-white hover:bg-[#18181c] hover:border-green-500'
              }`}
              aria-label={`${t('pagination.goToPage')} ${pageNumber}`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="p-2 rounded-lg bg-[#232329] border border-gray-600 text-white hover:bg-[#18181c] hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={t('pagination.nextPage')}
        title={t('pagination.nextPage')}
      >
        <ChevronRight size={16} />
      </button>

      {/* Last Page Button */}
      <button
        onClick={onGoToLastPage}
        disabled={!hasNextPage}
        className="p-2 rounded-lg bg-[#232329] border border-gray-600 text-white hover:bg-[#18181c] hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={t('pagination.lastPage')}
        title={t('pagination.lastPage')}
      >
        <ChevronsRight size={16} />
      </button>

      {/* Page Info */}
      <div className="ml-4 text-sm text-gray-400 hidden sm:block">
        {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
      </div>
    </div>
  );
}

export default PaginationControls;