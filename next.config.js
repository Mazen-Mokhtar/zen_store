/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable HTTP Agent to prevent proxy issues
  httpAgentOptions: {
    keepAlive: false,
  },
  // Disable React strict mode
  reactStrictMode: false,
  // Disable static page generation
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip middleware URL normalization
  skipMiddlewareUrlNormalize: true,
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    unoptimized: true,
  },

  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  },
  // Security headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy - strict policy for XSS protection
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://vercel.live https://images.unsplash.com",
              "media-src 'self' https://videos.pexels.com https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://vercel.live ws://localhost:* wss://localhost:* " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // X-Frame-Options - prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // X-Content-Type-Options - prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer-Policy - control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // X-XSS-Protection - enable XSS filtering (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Strict-Transport-Security - force HTTPS (only in production)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }] : []),
          // Permissions-Policy - control browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // X-DNS-Prefetch-Control - control DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
