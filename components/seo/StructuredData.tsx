'use client';

import React from 'react';
import Head from 'next/head';

interface StructuredDataProps {
  data: Record<string, any>;
  type?: 'Product' | 'Organization' | 'BreadcrumbList' | 'WebSite';
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data, type = 'Product' }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2)
        }}
      />
    </Head>
  );
};

// Predefined structured data generators
export const generateProductSchema = (product: {
  name: string;
  description: string;
  image?: string;
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock';
  brand?: string;
}) => ({
  name: product.name,
  description: product.description,
  image: product.image,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency || 'EGP',
    availability: `https://schema.org/${product.availability || 'InStock'}`
  },
  brand: {
    '@type': 'Brand',
    name: product.brand || 'Zen Store'
  },
  category: 'Gaming',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.5',
    reviewCount: '100'
  }
});

export const generateOrganizationSchema = () => ({
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
});

export const generateBreadcrumbSchema = (breadcrumbs: { name: string; url: string }[]) => ({
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url
  }))
});

export default StructuredData;