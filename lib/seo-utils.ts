// SEO utilities and helpers for better search engine optimization
import { logger } from './utils';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: Record<string, any>;
}

export class SEOManager {
  private static instance: SEOManager;

  private constructor() {}

  static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  // Generate comprehensive meta tags
  generateMetaTags(config: SEOConfig): Record<string, string> {
    const meta: Record<string, string> = {
      title: config.title,
      description: config.description,
      'og:title': config.title,
      'og:description': config.description,
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
      'twitter:title': config.title,
      'twitter:description': config.description,
    };

    if (config.keywords) {
      meta.keywords = config.keywords;
    }

    if (config.canonical) {
      meta.canonical = config.canonical;
    }

    if (config.ogImage) {
      meta['og:image'] = config.ogImage;
      meta['twitter:image'] = config.ogImage;
    }

    if (config.noIndex) {
      meta.robots = 'noindex, nofollow';
    } else {
      meta.robots = 'index, follow';
    }

    return meta;
  }

  // Generate structured data for different content types
  generateStructuredData = {
    product: (product: {
      name: string;
      description: string;
      image?: string;
      price?: number;
      currency?: string;
      availability?: 'InStock' | 'OutOfStock';
      category?: string;
      brand?: string;
    }) => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category || 'Gaming',
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Zen Store'
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'EGP',
        availability: `https://schema.org/${product.availability || 'InStock'}`,
        seller: {
          '@type': 'Organization',
          name: 'Zen Store'
        }
      }
    }),

    organization: () => ({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Zen Store',
      url: 'https://zenstore.com',
      logo: 'https://zenstore.com/logo.png',
      description: 'Ultimate gaming destination with secure payments and instant delivery',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+20-101-066-6002',
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic']
      },
      sameAs: [
        'https://facebook.com/zenstore',
        'https://twitter.com/zenstore',
        'https://instagram.com/zenstore'
      ]
    }),

    breadcrumb: (breadcrumbs: { name: string; url: string }[]) => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    }),

    website: () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Zen Store',
      url: 'https://zenstore.com',
      description: 'Ultimate gaming destination',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://zenstore.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    })
  };

  // Optimize page for search engines
  optimizePage(config: SEOConfig): void {
    if (typeof window === 'undefined') return;

    try {
      // Update document title
      document.title = config.title;

      // Update meta description
      this.updateMetaTag('description', config.description);

      // Update canonical URL
      if (config.canonical) {
        this.updateLinkTag('canonical', config.canonical);
      }

      // Add structured data
      if (config.structuredData) {
        this.addStructuredData(config.structuredData);
      }

      logger.info('SEO optimization applied:', config.title);
    } catch (error) {
      logger.error('SEO optimization error:', error);
    }
  }

  private updateMetaTag(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    
    meta.content = content;
  }

  private updateLinkTag(rel: string, href: string): void {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    
    link.href = href;
  }

  private addStructuredData(data: Record<string, any>): void {
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);
  }

  // Generate sitemap data
  generateSitemapData(pages: { url: string; lastModified?: Date; priority?: number }[]): string {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${(page.lastModified || new Date()).toISOString()}</lastmod>
    <priority>${page.priority || 0.5}</priority>
  </url>`).join('\n')}
</urlset>`;

    return sitemap;
  }

  // Check SEO health
  auditSEO(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check title
    const title = document.title;
    if (!title) {
      issues.push('Missing page title');
      score -= 20;
      recommendations.push('Add descriptive page title');
    } else if (title.length > 60) {
      issues.push('Title too long (>60 characters)');
      score -= 5;
      recommendations.push('Shorten page title');
    }

    // Check meta description
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (!description) {
      issues.push('Missing meta description');
      score -= 15;
      recommendations.push('Add meta description');
    } else if (description.length > 160) {
      issues.push('Meta description too long (>160 characters)');
      score -= 5;
      recommendations.push('Shorten meta description');
    }

    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push('Missing canonical URL');
      score -= 10;
      recommendations.push('Add canonical URL');
    }

    // Check structured data
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      issues.push('Missing structured data');
      score -= 10;
      recommendations.push('Add structured data markup');
    }

    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogTitle || !ogDescription) {
      issues.push('Incomplete Open Graph tags');
      score -= 10;
      recommendations.push('Add complete Open Graph metadata');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

export const seoManager = SEOManager.getInstance();

// React hook for SEO
export const useSEO = (config: SEOConfig) => {
  React.useEffect(() => {
    seoManager.optimizePage(config);
  }, [config]);

  const updateSEO = (newConfig: Partial<SEOConfig>) => {
    seoManager.optimizePage({ ...config, ...newConfig });
  };

  return { updateSEO };
};

export default SEOManager;