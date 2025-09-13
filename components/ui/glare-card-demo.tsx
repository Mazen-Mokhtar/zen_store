"use client";

import { memo, useCallback } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GlareCard } from '@/components/ui/glare-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


export type Category = {
  _id: string;
  name: string;
  logo: { secure_url: string };
  type?: 'steam' | 'games' | 'subscription';
};

// Memoized component to prevent unnecessary re-renders
export const GlareCardDemo = memo<{ categories: Category[] }>(({ categories = [] }) => {
  const router = useRouter();

  // Memoize the click handler to prevent unnecessary re-renders
  const handleCategoryClick = useCallback((category: Category) => {
    // Check if category type is steam or if name contains steam
    const isSteamCategory = category.type === 'steam' || 
                           category.name.toLowerCase().includes('steam') ||
                           category.name.toLowerCase().includes('ستيم');
    
    if (isSteamCategory) {
      // Navigate to category dashboard for steam categories
      router.push(`/category-dashboard?category=${category._id}&name=${encodeURIComponent(category.name)}`);
    } else {
      // Navigate to regular dashboard for other categories
      router.push(`/dashboard?category=${category._id}`);
    }
  }, [router]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {categories.map((cat) => (
        <div 
          key={cat._id} 
          onClick={() => handleCategoryClick(cat)}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <GlareCard className="flex flex-col items-center justify-center relative overflow-hidden">
            <Image
              className="h-full w-full absolute inset-0 object-cover z-0"
              src={cat.logo.secure_url}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              unoptimized
            />
            <div className="relative z-10 bg-black/60 w-full text-center py-2">
              <span className="font-bold text-white text-lg">{cat.name}</span>
            </div>
          </GlareCard>
        </div>
      ))}
    </div>
  );
});

GlareCardDemo.displayName = 'GlareCardDemo';