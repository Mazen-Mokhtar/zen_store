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
  // Enhanced security headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy - Enhanced with nonce support
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://vercel.live https://images.unsplash.com https://www.google-analytics.com",
              "media-src 'self' https://videos.pexels.com https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
              "connect-src 'self' https://api.github.com https://vercel.live https://www.google-analytics.com ws://localhost:* wss://localhost:* " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // X-Frame-Options - Enhanced clickjacking protection
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // X-Content-Type-Options - Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // X-XSS-Protection - Enable XSS filtering
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Strict-Transport-Security - Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Referrer-Policy - Enhanced referrer control
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions-Policy - Comprehensive feature control
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
              'ambient-light-sensor=()',
              'autoplay=()',
              'encrypted-media=()',
              'fullscreen=(self)',
              'picture-in-picture=()'
            ].join(', ')
          },
          // Cross-Origin-Embedder-Policy - Enhanced isolation
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          // Cross-Origin-Opener-Policy - Process isolation
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          // Cross-Origin-Resource-Policy - Resource sharing control
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          // X-DNS-Prefetch-Control - Control DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          },
          // X-Download-Options - Prevent file execution in IE
          {
            key: 'X-Download-Options',
            value: 'noopen'
          },
          // X-Permitted-Cross-Domain-Policies - Control cross-domain policies
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          // Cache-Control for security-sensitive pages
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          // Pragma for legacy cache control
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          // Expires for cache expiration
          {
            key: 'Expires',
            value: '0'
          }
        ]
      },
      // Specific headers for API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive'
          }
        ]
      },
      // Headers for admin routes
      {
        source: '/admin/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
