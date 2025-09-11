import type { Metadata } from 'next';
import AuthGuard from '@/components/guards/AuthGuard';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'My Orders - Zen Store',
  description: 'View and manage your game orders. Track order status, payment information, and delivery details.',
  keywords: 'orders, gaming orders, order tracking, payment status, game delivery',
  openGraph: {
    title: 'My Orders - Zen Store',
    description: 'View and manage your game orders',
    type: 'website',
    siteName: 'Zen Store',
  },
  twitter: {
    card: 'summary',
    title: 'My Orders - Zen Store',
    description: 'View and manage your game orders',
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121218] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </div>
    }>
      <AuthGuard>
        {children}
      </AuthGuard>
    </Suspense>
  );
}