// Dynamic sitemap generation for SEO optimization

import { MetadataRoute } from 'next';
import { seoOptimizer } from '@/lib/seo-optimization';

// Static pages configuration
const STATIC_PAGES = [
  {
    url: '/',
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0
  },
  {
    url: '/categories',
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9
  },
  {
    url: '/dashboard',
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  },
  {
    url: '/about',
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6
  },
  {
    url: '/contact',
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5
  },
  {
    url: '/privacy',
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.3
  },
  {
    url: '/terms',
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.3
  }
];

// Dynamic content fetchers
const fetchCategories = async (): Promise<Array<{ slug: string; updatedAt: Date }>> => {
  try {
    // In a real app, this would fetch from your database or API
    // For now, return mock data
    return [
      { slug: 'action', updatedAt: new Date() },
      { slug: 'adventure', updatedAt: new Date() },
      { slug: 'strategy', updatedAt: new Date() },
      { slug: 'simulation', updatedAt: new Date() },
      { slug: 'sports', updatedAt: new Date() },
      { slug: 'racing', updatedAt: new Date() }
    ];
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
};

const fetchGames = async (): Promise<Array<{ slug: string; updatedAt: Date }>> => {
  try {
    // In a real app, this would fetch from your database or API
    // For now, return mock data
    return [
      { slug: 'cyberpunk-2077', updatedAt: new Date() },
      { slug: 'the-witcher-3', updatedAt: new Date() },
      { slug: 'gta-v', updatedAt: new Date() },
      { slug: 'minecraft', updatedAt: new Date() },
      { slug: 'fortnite', updatedAt: new Date() },
      { slug: 'call-of-duty', updatedAt: new Date() }
    ];
  } catch (error) {
    console.error('Error fetching games for sitemap:', error);
    return [];
  }
};

const fetchBlogPosts = async (): Promise<Array<{ slug: string; updatedAt: Date }>> => {
  try {
    // In a real app, this would fetch from your database or API
    // For now, return mock data
    return [
      { slug: 'gaming-trends-2024', updatedAt: new Date() },
      { slug: 'best-gaming-setup', updatedAt: new Date() },
      { slug: 'upcoming-releases', updatedAt: new Date() }
    ];
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    return [];
  }
};

export async function GET(): Promise<Response> {
  try {
    // Fetch dynamic content
    const [categories, games, blogPosts] = await Promise.all([
      fetchCategories(),
      fetchGames(),
      fetchBlogPosts()
    ]);

    // Build sitemap entries
    const sitemapEntries: MetadataRoute.Sitemap = [
      // Static pages
      ...STATIC_PAGES,
      
      // Category pages
      ...categories.map(category => ({
        url: `/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8
      })),
      
      // Game pages
      ...games.map(game => ({
        url: `/game/${game.slug}`,
        lastModified: game.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7
      })),
      
      // Blog posts
      ...blogPosts.map(post => ({
        url: `/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6
      }))
    ];

    // Generate sitemap XML
    const sitemap = generateSitemapXML(sitemapEntries);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return minimal sitemap on error
    const fallbackSitemap = generateSitemapXML(STATIC_PAGES);
    
    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
}

function generateSitemapXML(entries: MetadataRoute.Sitemap): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-store.com';
  
  const urlEntries = entries.map(entry => {
    const url = entry.url.startsWith('http') ? entry.url : `${baseUrl}${entry.url}`;
    const lastmod = entry.lastModified ? (entry.lastModified instanceof Date ? entry.lastModified : new Date(entry.lastModified)).toISOString() : new Date().toISOString();
    const changefreq = entry.changeFrequency || 'weekly';
    const priority = entry.priority || 0.5;
    
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
}

// Alternative export for static generation
export async function generateStaticParams() {
  return [];
}

// Revalidate sitemap every hour
export const revalidate = 3600;