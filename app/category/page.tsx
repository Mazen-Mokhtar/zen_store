import { Suspense } from 'react';
import { Metadata } from 'next';
import { Category, CategoryResponse } from '@/types/category';
import { logger } from '@/lib/utils';
import { CategoryPageClient } from '@/components/category/category-page-client';
import { SkeletonSpinner } from '@/components/ui/skeleton';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'Game Categories - Zen Store',
  description: 'Browse our game categories and find your favorite games',
  keywords: 'games, categories, gaming, mobile games, pc games',
};

// Server-side data fetching
async function getCategoriesData(): Promise<Category[]> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://wivz-zen-ehtkn.ondigitalocean.app'}/category/AllCategory`;
    
    const res = await fetch(apiUrl, { 
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      logger.warn("Failed to fetch categories, server might be down");
      return [];
    }
    
    const data: CategoryResponse = await res.json();
    if (data.success && data.data) {
      return data.data.slice(0, 3); // Only first 3 categories
    } else {
      logger.warn("API response indicates failure:", data.message);
      return [];
    }
  } catch (error) {
    logger.warn("Error fetching categories:", error);
    return [];
  }
}

// Server Component
export default async function CategoryPage() {
  const categories = await getCategoriesData();

  return (
    <Suspense fallback={<SkeletonSpinner />}>
      <CategoryPageClient initialCategories={categories} />
    </Suspense>
  );
}