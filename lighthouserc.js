module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/packages',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/orders'
      ],
      startServerCommand: 'npm run build && npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        formFactor: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']
      }
    },
    assert: {
      assertions: {
        // Core Web Vitals Assertions
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP ≤ 2.5s
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // FCP ≤ 1.8s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS ≤ 0.1
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // TBT ≤ 200ms
        'speed-index': ['error', { maxNumericValue: 3400 }], // SI ≤ 3.4s
        'interactive': ['error', { maxNumericValue: 3800 }], // TTI ≤ 3.8s
        
        // Performance Budget Assertions
        'total-byte-weight': ['error', { maxNumericValue: 307200 }], // ≤ 300KB total
        'unused-javascript': ['warn', { maxNumericValue: 51200 }], // ≤ 50KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 20480 }], // ≤ 20KB unused CSS
        'unminified-javascript': ['error', { maxNumericValue: 0 }], // All JS should be minified
        'unminified-css': ['error', { maxNumericValue: 0 }], // All CSS should be minified
        
        // Resource Optimization
        'uses-text-compression': 'error', // Enable gzip/brotli
        'uses-optimized-images': 'warn', // Optimize images
        'modern-image-formats': 'warn', // Use WebP/AVIF
        'uses-webp-images': 'warn', // Serve WebP images
        'efficient-animated-content': 'warn', // Optimize animated content
        'offscreen-images': 'warn', // Lazy load images
        
        // JavaScript Bundle Optimization
        'legacy-javascript': 'warn', // Avoid legacy JavaScript
        'duplicated-javascript': 'error', // No duplicate JS bundles
        'bootup-time': ['warn', { maxNumericValue: 3500 }], // JS execution time ≤ 3.5s
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }], // Main thread work ≤ 4s
        
        // Network and Caching
        'uses-long-cache-ttl': 'warn', // Use long cache TTL
        'uses-rel-preconnect': 'warn', // Preconnect to required origins
        'uses-rel-preload': 'warn', // Preload key requests
        'critical-request-chains': 'warn', // Minimize critical request chains
        'server-response-time': ['error', { maxNumericValue: 600 }], // Server response ≤ 600ms
        
        // Font Optimization
        'font-display': 'error', // Use font-display: swap
        'preload-fonts': 'warn', // Preload important fonts
        
        // Accessibility Assertions
        'color-contrast': 'error', // Sufficient color contrast
        'image-alt': 'error', // Images have alt text
        'label': 'error', // Form elements have labels
        'link-name': 'error', // Links have accessible names
        'button-name': 'error', // Buttons have accessible names
        'aria-allowed-attr': 'error', // ARIA attributes are valid
        'aria-required-attr': 'error', // Required ARIA attributes present
        'aria-roles': 'error', // ARIA roles are valid
        'aria-valid-attr-value': 'error', // ARIA attribute values are valid
        'aria-valid-attr': 'error', // ARIA attributes are valid
        'duplicate-id-aria': 'error', // No duplicate ARIA IDs
        'heading-order': 'error', // Heading elements in logical order
        'landmark-one-main': 'error', // Page has one main landmark
        'list': 'error', // Lists contain only li elements
        'listitem': 'error', // List items are in lists
        'meta-viewport': 'error', // Has viewport meta tag
        'tabindex': 'error', // No positive tabindex values
        
        // SEO Assertions
        'document-title': 'error', // Document has title
        'meta-description': 'error', // Document has meta description
        'http-status-code': 'error', // Page has successful HTTP status code
        'crawlable-anchors': 'error', // Links are crawlable
        'is-crawlable': 'error', // Page is crawlable
        'robots-txt': 'warn', // robots.txt is valid
        'hreflang': 'warn', // Document has valid hreflang
        
        // Best Practices
        'is-on-https': 'error', // Uses HTTPS (in production)
        'uses-http2': 'warn', // Uses HTTP/2
        'no-vulnerable-libraries': 'error', // No known vulnerable libraries
        'csp-xss': 'warn', // Has Content Security Policy
        'errors-in-console': 'warn', // No browser errors in console
        
        // PWA Assertions (if applicable)
        'installable-manifest': 'warn', // Web app manifest is installable
        'service-worker': 'warn', // Registers a service worker
        'works-offline': 'warn', // Works offline
        'viewport': 'error', // Has viewport meta tag
        'without-javascript': 'warn', // Contains some content when JS unavailable
        
        // Category Score Assertions
        'categories:performance': ['error', { minScore: 0.9 }], // Performance score ≥ 90
        'categories:accessibility': ['error', { minScore: 0.95 }], // Accessibility score ≥ 95
        'categories:best-practices': ['error', { minScore: 0.9 }], // Best practices score ≥ 90
        'categories:seo': ['error', { minScore: 0.9 }], // SEO score ≥ 90
        'categories:pwa': ['warn', { minScore: 0.8 }] // PWA score ≥ 80 (warning only)
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: './lighthouse-results'
    }
  }
};

// Environment-specific overrides
if (process.env.CI) {
  // CI-specific settings
  module.exports.ci.collect.settings.chromeFlags += ' --headless';
  module.exports.ci.collect.numberOfRuns = 1; // Faster CI runs
  
  // Relax some assertions for CI environment
  module.exports.ci.assert.assertions['server-response-time'] = ['warn', { maxNumericValue: 1000 }];
  module.exports.ci.assert.assertions['largest-contentful-paint'] = ['error', { maxNumericValue: 3000 }];
}

if (process.env.NODE_ENV === 'development') {
  // Development-specific settings
  module.exports.ci.collect.startServerCommand = 'npm run dev';
  module.exports.ci.collect.url = ['http://localhost:3000'];
  
  // More lenient assertions for development
  module.exports.ci.assert.assertions['total-byte-weight'] = ['warn', { maxNumericValue: 512000 }]; // 500KB for dev
  module.exports.ci.assert.assertions['largest-contentful-paint'] = ['warn', { maxNumericValue: 4000 }];
  module.exports.ci.assert.assertions['categories:performance'] = ['warn', { minScore: 0.7 }];
}

// Mobile configuration
if (process.env.LIGHTHOUSE_MOBILE === 'true') {
  module.exports.ci.collect.settings.preset = 'mobile';
  module.exports.ci.collect.settings.throttling = {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0
  };
  module.exports.ci.collect.settings.screenEmulation = {
    mobile: true,
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    disabled: false
  };
  module.exports.ci.collect.settings.formFactor = 'mobile';
  
  // Adjust mobile-specific assertions
  module.exports.ci.assert.assertions['largest-contentful-paint'] = ['error', { maxNumericValue: 4000 }]; // 4s for mobile
  module.exports.ci.assert.assertions['first-contentful-paint'] = ['error', { maxNumericValue: 2000 }]; // 2s for mobile
}