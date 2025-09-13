// Dynamic robots.txt generation for SEO optimization

import { seoOptimizer } from '@/lib/seo-optimization';

export async function GET(): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-store.com';
  
  // Custom rules for different environments
  const customRules = process.env.NODE_ENV === 'production' 
    ? [
        '',
        '# Additional rules for production',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /private/',
        'Disallow: /_next/',
        'Disallow: /static/',
        'Disallow: /*.json$',
        'Disallow: /*?*',
        '',
        '# Allow specific bots',
        'User-agent: Googlebot',
        'Allow: /',
        '',
        'User-agent: Bingbot',
        'Allow: /',
        '',
        '# Crawl delay for other bots',
        'User-agent: *',
        'Crawl-delay: 1',
        '',
        '# Sitemaps',
        `Sitemap: ${baseUrl}/sitemap.xml`,
        `Sitemap: ${baseUrl}/sitemap-images.xml`,
        `Sitemap: ${baseUrl}/sitemap-news.xml`
      ]
    : [
        '',
        '# Development environment - allow all',
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${baseUrl}/sitemap.xml`
      ];

  const robotsTxt = seoOptimizer.generateRobotsTxt(customRules);

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
}

// Revalidate robots.txt daily
export const revalidate = 86400;