import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import SessionManager from '@/components/SessionManager';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { Phase3Provider } from '@/components/Phase3Provider';
import { seoOptimizer } from '@/lib/seo-optimization';
import { StructuredDataScript } from '@/lib/seo-optimization';
import PreloadLinks from '@/components/PreloadLinks';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { reportWebVitals } from '../sentry.client.config';


import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Zen Store - Ultimate Gaming Destination',
  description: 'Discover the best games, accessories, and gaming gear at Zen Store. Your one-stop shop for all gaming needs with competitive prices and fast delivery.',
  keywords: 'gaming store, video games, gaming accessories, PC games, console games, gaming gear',
  authors: [{ name: 'Zen Store Team' }],
  creator: 'Zen Store',
  publisher: 'Zen Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Zen Store - Ultimate Gaming Destination',
    description: 'Discover the best games, accessories, and gaming gear at Zen Store.',
    url: '/',
    siteName: 'Zen Store',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Zen Store - Gaming Store',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zen Store - Ultimate Gaming Destination',
    description: 'Discover the best games, accessories, and gaming gear at Zen Store.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00e6c0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wivz" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Critical resource preloading for LCP optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Inline critical above-the-fold CSS */}
        
        
        {/* Preload links with proper client-side handling */}
        <PreloadLinks />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          />
        </noscript>
        
        <StructuredDataScript
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Zen Store",
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            "logo": `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
            "description": "Ultimate gaming destination for games, accessories, and gaming gear",
            "sameAs": [
              "https://twitter.com/zenstore",
              "https://facebook.com/zenstore",
              "https://instagram.com/zenstore"
            ]
          }}
        />
        <StructuredDataScript
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Zen Store",
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <ErrorBoundary>
            <Phase3Provider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <SessionManager>
                  <Suspense fallback={null}>
                    {children}
                  </Suspense>
                  <Toaster position="top-right" richColors />
                </SessionManager>
              </ThemeProvider>
            </Phase3Provider>
          </ErrorBoundary>
        
        {/* Core Web Vitals and Performance Monitoring */}
        <Script
          id="web-vitals"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Web Vitals monitoring will be handled by Sentry automatically
              console.log('Web Vitals monitoring enabled via Sentry');
            `
          }}
        />
        
        {/* Sentry Performance Monitoring */}
        <Script
          id="sentry-performance"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Monitor long tasks
              if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                      console.warn('Long task detected:', entry.duration + 'ms');
                    }
                  }
                });
                observer.observe({ entryTypes: ['longtask'] });
              }
              
              // Monitor layout shifts
              if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.value > 0.1) {
                      console.warn('Layout shift detected:', entry.value);
                    }
                  }
                });
                observer.observe({ entryTypes: ['layout-shift'] });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
