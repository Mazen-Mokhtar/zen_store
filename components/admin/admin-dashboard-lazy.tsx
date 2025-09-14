'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the security monitoring dashboard
const SecurityMonitoringDashboardDynamic = dynamic(
  () => import('./SecurityMonitoringDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 p-6">
        {/* Security Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-8 bg-gray-300 rounded animate-pulse w-16"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Security Events Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
);

// Lazy load admin orders table
const AdminOrdersTableDynamic = dynamic(
  () => import('./orders/VirtualizedOrdersTable').then(mod => ({ default: mod.VirtualizedOrdersTable })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
);

export function SecurityMonitoringDashboardLazy() {
  return (
    <Suspense fallback={
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-8 bg-gray-300 rounded animate-pulse w-16"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <SecurityMonitoringDashboardDynamic />
    </Suspense>
  );
}

export function AdminOrdersTableLazy(props: any) {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminOrdersTableDynamic {...props} />
    </Suspense>
  );
}