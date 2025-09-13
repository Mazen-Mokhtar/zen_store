import dynamic from 'next/dynamic';

// Dynamically import heavy modal components to reduce initial bundle size
export const OrderDetailsModal = dynamic(
  () => import('./order-details-modal').then(mod => ({ default: mod.OrderDetailsModal })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96 w-full" />
  }
);

export const OrderConfirmationModal = dynamic(
  () => import('./order-confirmation-modal').then(mod => ({ default: mod.OrderConfirmationModal })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
  }
);

export const SteamOrderConfirmationModal = dynamic(
  () => import('./steam-order-confirmation-modal').then(mod => ({ default: mod.SteamOrderConfirmationModal })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
  }
);

export const LoginRequiredModal = dynamic(
  () => import('./login-required-modal').then(mod => ({ default: mod.LoginRequiredModal })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full" />
  }
);

export const SteamAccountInfoModal = dynamic(
  () => import('../steam/steam-account-info-modal').then(mod => ({ default: mod.SteamAccountInfoModal })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
  }
);

// Dynamic import for heavy UI components
export const GlareCardDemo = dynamic(
  () => import('./glare-card-demo').then(mod => ({ default: mod.GlareCardDemo })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg h-64 w-full" />
  }
);

export const Meteors = dynamic(
  () => import('./meteors').then(mod => ({ default: mod.Meteors })),
  {
    ssr: false,
    loading: () => null // No loading state for decorative elements
  }
);

// Dynamic import for category games section
export const CategoryGamesSection = dynamic(
  () => import('../category-dashboard/CategoryGamesSection').then(mod => ({ default: mod.CategoryGamesSection })),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48 w-full" />
        ))}
      </div>
    )
  }
);