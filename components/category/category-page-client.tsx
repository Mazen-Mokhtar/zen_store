'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Category } from '@/types/category';
import { logger } from '@/lib/utils';

interface CategoryPageClientProps {
  initialCategories: Category[];
}

const GlareCardDemo = dynamic(() => import('@/components/ui/glare-card-demo').then(mod => ({ default: mod.GlareCardDemo })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>,
  ssr: false
});

export function CategoryPageClient({ initialCategories }: CategoryPageClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);

  // Use initial categories from server
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-black">
        <div className="animate-pulse bg-gray-800 h-64 rounded-lg m-8"></div>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 xl:p-16 relative overflow-hidden">
      {/* Background Video - Hidden on small screens */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 hidden sm:block"
        src="https://videos.pexels.com/video-files/8128311/8128311-uhd_2560_1440_25fps.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Background Image for small screens */}
      <div className="absolute inset-0 w-full h-full z-0 sm:hidden">
        <Image
          src="/images/sm-sc.png"
          alt="Category background"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/60 lg:bg-black/50 xl:bg-black/40 z-10" />
      <div className="relative z-20 flex flex-col items-center w-full max-w-7xl xl:max-w-none 2xl:max-w-[1600px] mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-8 lg:mb-12 xl:mb-16 text-white text-center">Category</h1>
        {categories.length > 0 ? (
          <GlareCardDemo categories={categories} />
        ) : (
          <div className="text-center text-white">
            <p className="text-lg lg:text-xl xl:text-2xl mb-4">No categories available at the moment</p>
            <p className="text-sm lg:text-base xl:text-lg opacity-80">Please check back later or contact support</p>
          </div>
        )}
      </div>
    </main>
  );
}