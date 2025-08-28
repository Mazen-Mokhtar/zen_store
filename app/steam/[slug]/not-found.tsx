'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Home } from 'lucide-react';

export default function SteamGameNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0D0E12] text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Steam Game Not Found</h1>
          <p className="text-gray-400">
            The Steam game you're looking for doesn't exist or has been removed.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          
          <button
            onClick={() => router.push('/category')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <Home size={16} />
            Browse Games
          </button>
        </div>
      </div>
    </div>
  );
}