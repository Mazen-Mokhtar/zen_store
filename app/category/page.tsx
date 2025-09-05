'use client'
import dynamic from 'next/dynamic'
import { Category, CategoryResponse } from '@/types/category'
import { logger } from '@/lib/utils'
import { useEffect, useState } from 'react'

const GlareCardDemo = dynamic(() => import('@/components/ui/glare-card-demo').then(mod => ({ default: mod.GlareCardDemo })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>,
  ssr: false
})

// مكون صفحة الفئات
export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        // تحديد عنوان API بشكل ديناميكي بناءً على البيئة الحالية
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://wivz-zen-ehtkn.ondigitalocean.app'}/category/AllCategory`;
        
        const res = await fetch(apiUrl, { 
          cache: "no-store",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!res.ok) {
          logger.warn("Failed to fetch categories, server might be down")
          setCategories([]); // Return empty array instead of throwing error
          return;
        }
        const data: CategoryResponse = await res.json();
        if (data.success && data.data) {
          setCategories(data.data.slice(0, 3)); // Only first 3 categories
        } else {
          logger.warn("API response indicates failure:", data.message);
          setCategories([]);
        }
      } catch (error) {
        logger.warn("Error fetching categories:", error)
        setCategories([]); // Return empty array on any error
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-black">
        <div className="animate-pulse bg-gray-800 h-64 rounded-lg m-8"></div>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://videos.pexels.com/video-files/8128311/8128311-uhd_2560_1440_25fps.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="relative z-20 flex flex-col items-center w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">Category</h1>
        {categories.length > 0 ? (
          <GlareCardDemo categories={categories} />
        ) : (
          <div className="text-center text-white">
            <p className="text-lg mb-4">No categories available at the moment</p>
            <p className="text-sm opacity-80">Please check back later or contact support</p>
          </div>
        )}
      </div>
    </main>
  );
}