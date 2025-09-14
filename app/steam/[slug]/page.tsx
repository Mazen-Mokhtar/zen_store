import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DynamicSteamGameDetails } from '@/lib/dynamic-imports';
import { apiService } from '@/lib/api';
import type { SteamGame } from '@/lib/types';
import { logger } from '@/lib/utils';

// Enable ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

interface SteamGamePageProps {
  params: Promise<{ slug: string }>;
}

async function getSteamGame(slug: string): Promise<SteamGame | null> {
  try {
    // First try to get by slug, fallback to ID if needed
    let response = await apiService.getSteamGameBySlug(slug);
    
    // If slug doesn't work and it looks like an ID, try by ID
    if (!response.success && slug.match(/^[a-f\d]{24}$/i)) {
      response = await apiService.getSteamGameById(slug);
    }
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    logger.error('Error fetching Steam game:', error);
    return null;
  }
}

export async function generateMetadata({ params }: SteamGamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getSteamGame(slug);
  
  if (!game) {
    return {
      title: 'Game Not Found - Endex',
      description: 'The requested Steam game could not be found.',
    };
  }

  const currency = game.currency || 'EGP';
  const price = game.isOffer && game.finalPrice 
    ? `${game.finalPrice} ${currency}` 
    : game.price 
    ? `${game.price} ${currency}` 
    : 'Price not available';

  return {
    title: `${game.name} - Steam Games | Endex`,
    description: `${game.description.slice(0, 160)}... Available for ${price}`,
    openGraph: {
      title: game.name,
      description: game.description,
      images: [
        {
          url: game.backgroundImage?.secure_url || game.image?.secure_url || '/images/placeholder-game.jpg',
          width: 1200,
          height: 630,
          alt: game.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: game.name,
      description: game.description,
      images: [game.backgroundImage?.secure_url || game.image?.secure_url || '/images/placeholder-game.jpg'],
    },
  };
}

export default async function SteamGamePage({ params }: SteamGamePageProps) {
  const { slug } = await params;
  const game = await getSteamGame(slug);
  
  if (!game) {
    notFound();
  }

  return <DynamicSteamGameDetails game={game} />;
}