import dynamic from "next/dynamic";
import type { Category } from "@/components/ui/glare-card-demo";
import { logger } from '@/lib/utils'

// Dynamic import of the client component to improve code-splitting
const GlareCardDemo = dynamic(
  () => import("@/components/ui/glare-card-demo").then((mod) => mod.GlareCardDemo),
  {
    loading: () => (
      <div className="text-center text-white">
        <p className="text-lg mb-4">Loading categories...</p>
      </div>
    ),
  }
);

async function getCategories() {
  try {
    // تحديد عنوان API بشكل ديناميكي بناءً على البيئة الحالية
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/category/AllCategory`;
    
    const res = await fetch(apiUrl, { 
      cache: "no-store",
      credentials: 'same-origin'
    });
    if (!res.ok) {
      logger.warn("Failed to fetch categories, server might be down")
      return []; // Return empty array instead of throwing error
    }
    const data = await res.json();
    return data.data.slice(0, 3) as Category[]; // Only first 3 categories
  } catch (error) {
    logger.warn("Error fetching categories:", error)
    return []; // Return empty array on any error
  }
}

export default async function CategoryPage() {
  const categories = await getCategories();
  
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