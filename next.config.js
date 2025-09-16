/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const fs = require('fs');
const path = require('path');
// const { TreeShakingOptimizationPlugin, createResolveConfig } = require('./lib/webpack-tree-shaking');

// Cleanup function to remove .next folder before build
const cleanupNextFolder = () => {
  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up .next folder');
  }
};

// Run cleanup only once when build script starts
if (process.env.npm_lifecycle_event === 'build' && !process.env.CLEANUP_DONE) {
  cleanupNextFolder();
  process.env.CLEANUP_DONE = 'true';
}

const nextConfig = {
  // HTTP Agent configuration for better connectivity
  httpAgentOptions: {
    keepAlive: true,
  },
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // TypeScript configuration
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
  
  // Enable ISR for faster builds
  generateStaticParams: true,
  
  // Build optimization
  swcMinify: true,
  
  // Output configuration for better caching
  output: 'standalone',
  
  // Disable caching during development
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
    generateEtags: false,
  }),
  
  // Bundle optimization with Turbopack for faster builds
  experimental: {
    // Enable Turbopack for faster builds (Next.js 13+)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Build performance optimizations
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion', 'react-icons'],
    esmExternals: true,
    scrollRestoration: true,
    webpackBuildWorker: true,
    optimizeServerReact: true,
    serverMinification: true,
    serverSourceMaps: false,
    // Additional build speed optimizations
    swcMinify: true,
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        skipDefaultConversion: true,
      },
      'react-icons': {
        transform: 'react-icons/{{member}}',
      },
    },
    // Enable faster refresh and compilation
    forceSwcTransforms: true,
    fullySpecified: false,
  },
  
  // Server external packages
  serverExternalPackages: ['sharp'],
  
  // Enhanced webpack configuration for performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Simple SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Add tree shaking optimization plugin
    // if (process.env.NODE_ENV === 'production') {
    //   config.plugins.push(new TreeShakingOptimizationPlugin({
    //     aggressive: true
    //   }));
    // }
    
    // Enhanced resolve configuration for better tree shaking (only add alias, not override mainFields)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Keep original imports working, just optimize when possible
    };
    
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate framer-motion into its own chunk
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Separate react-icons into its own chunk
          reactIcons: {
            name: 'react-icons',
            test: /[\\/]node_modules[\\/]react-icons[\\/]/,
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Separate lucide-react into its own chunk
          lucideReact: {
            name: 'lucide-react',
            test: /[\/]node_modules[\/]lucide-react[\/]/,
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Separate UI libraries
          radixUI: {
            name: 'radix-ui',
            test: /[\/]node_modules[\/]@radix-ui[\/]/,
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Separate admin components
          adminChunk: {
            name: 'admin',
            test: /[\/]components[\/]admin[\/]/,
            chunks: 'all',
            priority: 15,
            minSize: 30000,
            reuseExistingChunk: true,
          },
          // Separate performance monitoring
          performanceChunk: {
            name: 'performance',
            test: /[\/](components[\/]performance|lib[\/].*performance)[\/]/,
            chunks: 'all',
            priority: 10,
            minSize: 20000,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    // Enhanced tree shaking optimization - only in production to avoid caching conflicts
    if (process.env.NODE_ENV === 'production') {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Enhanced tree shaking for specific packages
      config.optimization.providedExports = true;
      config.optimization.innerGraph = true;
      
      // Mark specific packages as side-effect free for better tree shaking
      config.module.rules.push({
        test: /node_modules\/(lucide-react|react-icons|framer-motion)\/.*\.js$/,
        sideEffects: false
      });
      
      // Optimize module concatenation
      config.optimization.concatenateModules = true;
      
      // Enable aggressive dead code elimination
      config.optimization.minimize = true;
    }
    
    return config;
  },
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable styled-components
    styledComponents: true,
  },
  
  // Image optimization with priority and WebP/AVIF support
  images: {
    // Optimize for faster builds - reduce formats and sizes
    formats: process.env.NODE_ENV === 'production' ? ['image/webp', 'image/avif'] : ['image/webp'],
    deviceSizes: [640, 828, 1200, 1920], // Reduced from 8 to 4 sizes
    imageSizes: [32, 64, 128, 256], // Reduced from 8 to 4 sizes
    minimumCacheTTL: process.env.NODE_ENV === 'development' ? 1 : 3600, // Longer cache in production
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Skip optimization during development for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
    // Allow SVG images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Loader optimization
    loader: process.env.NODE_ENV === 'development' ? 'default' : 'default',
  },
  
  // Font optimization is enabled by default in Next.js 13+
  // optimizeFonts: true, // Removed as it's deprecated
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  },
  
  // Security headers
  poweredByHeader: false,
  compress: true,
  
  // Headers configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Static assets caching
      {
        source: '/:path*\\.(js|css|woff|woff2|eot|ttf|otf|png|jpg|jpeg|gif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // HTML pages caching
      {
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // Font optimization headers
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Font files caching
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Service Worker caching
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Manifest caching
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // Preload critical resources with font-display swap
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</globals.css>; rel=preload; as=style, <https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin',
          },
        ],
      },
      // Font optimization headers
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Rewrites
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
