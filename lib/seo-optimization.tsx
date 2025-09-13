// Advanced SEO optimization utilities

import { Metadata } from 'next';

interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  twitterHandle: string;
  facebookAppId?: string;
  locale: string;
  alternateLocales?: string[];
}

interface PageSEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  price?: {
    amount: number;
    currency: string;
  };
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  brand?: string;
  category?: string;
  sku?: string;
}

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

// Default SEO configuration
export const SEO_CONFIG: SEOConfig = {
  siteName: 'Zen Store',
  siteUrl: 'https://zen-store.com',
  defaultTitle: 'Zen Store - Premium Gaming Experience',
  defaultDescription: 'Discover the ultimate gaming destination with premium games, exclusive content, and unmatched gaming experiences.',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@zenstore',
  locale: 'en_US',
  alternateLocales: ['ar_SA', 'fr_FR']
};

// SEO optimization class
export class SEOOptimizer {
  private config: SEOConfig;
  
  constructor(config: SEOConfig = SEO_CONFIG) {
    this.config = config;
  }

  // Generate comprehensive metadata
  generateMetadata(data: PageSEOData): Metadata {
    const {
      title,
      description,
      keywords = [],
      image,
      url,
      type = 'website',
      publishedTime,
      modifiedTime,
      author,
      section,
      tags = []
    } = data;

    const fullTitle = title.includes(this.config.siteName) 
      ? title 
      : `${title} | ${this.config.siteName}`;
    
    const fullUrl = url ? `${this.config.siteUrl}${url}` : this.config.siteUrl;
    const ogImage = image || this.config.defaultImage;
    const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${this.config.siteUrl}${ogImage}`;

    const metadata: Metadata = {
      title: fullTitle,
      description,
      keywords: keywords.join(', '),
      
      // Open Graph
      openGraph: {
        title: fullTitle,
        description,
        url: fullUrl,
        siteName: this.config.siteName,
        images: [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: title
          }
        ],
        locale: this.config.locale,
        type: type as any,
        ...(publishedTime && { publishedTime }),
        ...(modifiedTime && { modifiedTime }),
        ...(author && { authors: [author] }),
        ...(section && { section }),
        ...(tags.length > 0 && { tags })
      },
      
      // Twitter
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description,
        images: [fullImageUrl],
        creator: this.config.twitterHandle,
        site: this.config.twitterHandle
      },
      
      // Additional meta tags
      other: {
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/jpeg',
        ...(this.config.facebookAppId && { 'fb:app_id': this.config.facebookAppId })
      },
      
      // Robots
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      },
      
      // Verification
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        yandex: process.env.YANDEX_VERIFICATION,
        yahoo: process.env.YAHOO_VERIFICATION
      },
      
      // Alternate languages
      ...(this.config.alternateLocales && {
        alternates: {
          languages: this.config.alternateLocales.reduce((acc, locale) => {
            acc[locale] = `${fullUrl}?lang=${locale}`;
            return acc;
          }, {} as Record<string, string>)
        }
      })
    };

    return metadata;
  }

  // Generate structured data for different content types
  generateStructuredData(type: string, data: any): StructuredData {
    const baseData = {
      '@context': 'https://schema.org'
    };

    switch (type) {
      case 'website':
        return {
          ...baseData,
          '@type': 'WebSite',
          name: this.config.siteName,
          url: this.config.siteUrl,
          description: this.config.defaultDescription,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${this.config.siteUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };

      case 'organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: this.config.siteName,
          url: this.config.siteUrl,
          logo: `${this.config.siteUrl}/images/logo.png`,
          description: this.config.defaultDescription,
          sameAs: [
            'https://twitter.com/zenstore',
            'https://facebook.com/zenstore',
            'https://instagram.com/zenstore'
          ]
        };

      case 'product':
        return {
          ...baseData,
          '@type': 'Product',
          name: data.name,
          description: data.description,
          image: data.image,
          brand: {
            '@type': 'Brand',
            name: data.brand || this.config.siteName
          },
          sku: data.sku,
          category: data.category,
          offers: {
            '@type': 'Offer',
            price: data.price?.amount,
            priceCurrency: data.price?.currency || 'USD',
            availability: this.mapAvailability(data.availability),
            seller: {
              '@type': 'Organization',
              name: this.config.siteName
            }
          },
          aggregateRating: data.rating && {
            '@type': 'AggregateRating',
            ratingValue: data.rating.value,
            reviewCount: data.rating.count
          }
        };

      case 'article':
        return {
          ...baseData,
          '@type': 'Article',
          headline: data.title,
          description: data.description,
          image: data.image,
          author: {
            '@type': 'Person',
            name: data.author
          },
          publisher: {
            '@type': 'Organization',
            name: this.config.siteName,
            logo: {
              '@type': 'ImageObject',
              url: `${this.config.siteUrl}/images/logo.png`
            }
          },
          datePublished: data.publishedTime,
          dateModified: data.modifiedTime || data.publishedTime,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url
          }
        };

      case 'breadcrumb':
        return {
          ...baseData,
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
          }))
        };

      case 'faq':
        return {
          ...baseData,
          '@type': 'FAQPage',
          mainEntity: data.questions.map((qa: any) => ({
            '@type': 'Question',
            name: qa.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: qa.answer
            }
          }))
        };

      default:
        return {
          ...baseData,
          '@type': 'Thing'
        };
    }
  }

  private mapAvailability(availability?: string): string {
    switch (availability) {
      case 'in_stock':
        return 'https://schema.org/InStock';
      case 'out_of_stock':
        return 'https://schema.org/OutOfStock';
      case 'preorder':
        return 'https://schema.org/PreOrder';
      default:
        return 'https://schema.org/InStock';
    }
  }

  // Generate sitemap data
  generateSitemapData(pages: Array<{
    url: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }>) {
    return pages.map(page => ({
      url: `${this.config.siteUrl}${page.url}`,
      lastModified: page.lastModified || new Date(),
      changeFrequency: page.changeFrequency || 'weekly',
      priority: page.priority || 0.5
    }));
  }

  // Generate robots.txt content
  generateRobotsTxt(customRules?: string[]): string {
    const defaultRules = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /api/',
      'Disallow: /private/',
      '',
      `Sitemap: ${this.config.siteUrl}/sitemap.xml`
    ];

    const rules = customRules ? [...defaultRules, ...customRules] : defaultRules;
    return rules.join('\n');
  }
}

// SEO utilities
export class SEOUtils {
  // Optimize title for SEO
  static optimizeTitle(title: string, maxLength = 60): string {
    if (title.length <= maxLength) return title;
    
    const truncated = title.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
  }

  // Optimize description for SEO
  static optimizeDescription(description: string, maxLength = 160): string {
    if (description.length <= maxLength) return description;
    
    const truncated = description.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
  }

  // Generate keywords from content
  static extractKeywords(content: string, maxKeywords = 10): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Generate slug from title
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '');
  }

  // Validate SEO data
  static validateSEO(data: PageSEOData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!data.title) {
      issues.push('Title is required');
    } else if (data.title.length > 60) {
      issues.push('Title is too long (max 60 characters)');
    } else if (data.title.length < 10) {
      issues.push('Title is too short (min 10 characters)');
    }
    
    if (!data.description) {
      issues.push('Description is required');
    } else if (data.description.length > 160) {
      issues.push('Description is too long (max 160 characters)');
    } else if (data.description.length < 50) {
      issues.push('Description is too short (min 50 characters)');
    }
    
    if (data.keywords && data.keywords.length > 10) {
      issues.push('Too many keywords (max 10)');
    }
    
    if (!data.image) {
      issues.push('Image is recommended for better social sharing');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Global SEO optimizer instance
export const seoOptimizer = new SEOOptimizer();

// React hooks for SEO
export const useSEO = (data: PageSEOData) => {
  const metadata = seoOptimizer.generateMetadata(data);
  const validation = SEOUtils.validateSEO(data);
  
  return {
    metadata,
    validation,
    structuredData: (type: string, structuredData: any) => 
      seoOptimizer.generateStructuredData(type, structuredData)
  };
};

// SEO component for structured data injection
export const StructuredDataScript = ({ data }: { data: StructuredData }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  );
};

// SEO performance monitoring
export class SEOMonitor {
  private static instance: SEOMonitor;
  private metrics: Map<string, any> = new Map();
  
  static getInstance(): SEOMonitor {
    if (!SEOMonitor.instance) {
      SEOMonitor.instance = new SEOMonitor();
    }
    return SEOMonitor.instance;
  }
  
  trackPageView(url: string, data: PageSEOData): void {
    const validation = SEOUtils.validateSEO(data);
    
    this.metrics.set(url, {
      timestamp: Date.now(),
      seoData: data,
      validation,
      score: this.calculateSEOScore(data, validation)
    });
    
    // Log SEO issues in development
    if (process.env.NODE_ENV === 'development' && !validation.isValid) {
      console.warn(`SEO issues on ${url}:`, validation.issues);
    }
  }
  
  private calculateSEOScore(data: PageSEOData, validation: { isValid: boolean; issues: string[] }): number {
    let score = 100;
    
    // Deduct points for each issue
    score -= validation.issues.length * 10;
    
    // Bonus points for good practices
    if (data.keywords && data.keywords.length > 0) score += 5;
    if (data.image) score += 5;
    if (data.author) score += 3;
    if (data.tags && data.tags.length > 0) score += 3;
    
    return Math.max(0, Math.min(100, score));
  }
  
  getMetrics(): Array<{ url: string; score: number; issues: string[] }> {
    return Array.from(this.metrics.entries()).map(([url, data]) => ({
      url,
      score: data.score,
      issues: data.validation.issues
    }));
  }
  
  getAverageScore(): number {
    const scores = Array.from(this.metrics.values()).map(data => data.score);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }
}

// Global SEO monitor instance
export const seoMonitor = SEOMonitor.getInstance();

// Initialize SEO monitoring
export const initializeSEOMonitoring = (): void => {
  if (typeof window === 'undefined') return;
  
  // Track page views
  const trackCurrentPage = () => {
    const url = window.location.pathname;
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    seoMonitor.trackPageView(url, {
      title,
      description,
      url
    });
  };
  
  // Track initial page load
  trackCurrentPage();
  
  // Track navigation changes
  let currentUrl = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentUrl) {
      currentUrl = window.location.pathname;
      setTimeout(trackCurrentPage, 100); // Allow time for page updates
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

// SEO debugging utilities
export const debugSEO = (): void => {
  if (typeof window === 'undefined') return;
  
  console.group('SEO Debug Info');
  
  // Page title
  console.log('Title:', document.title, `(${document.title.length} chars)`);
  
  // Meta description
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  console.log('Description:', description, `(${description?.length || 0} chars)`);
  
  // Meta keywords
  const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
  console.log('Keywords:', keywords);
  
  // Open Graph tags
  const ogTags = Array.from(document.querySelectorAll('meta[property^="og:"]'));
  console.log('Open Graph tags:', ogTags.map(tag => ({
    property: tag.getAttribute('property'),
    content: tag.getAttribute('content')
  })));
  
  // Structured data
  const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  console.log('Structured Data:', structuredData.map(script => {
    try {
      return JSON.parse(script.textContent || '');
    } catch {
      return 'Invalid JSON';
    }
  }));
  
  // SEO metrics
  console.log('SEO Metrics:', seoMonitor.getMetrics());
  console.log('Average SEO Score:', seoMonitor.getAverageScore());
  
  console.groupEnd();
};