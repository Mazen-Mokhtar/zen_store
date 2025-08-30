import type { Game } from '../../lib/api';
import type { SortBy } from './constants';

export type { SortBy };

export interface CategoryDashboardState {
  current: number;
  popularItems: { games: Game[]; packages: any[] };
  categoryGames: Game[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: SortBy;
  selectedGame: string | null;
  gamePackages: any[];
  loadingPackages: boolean;
  isAuth: boolean;
}

export interface CategoryHeroProps {
  categoryName: string;
  heroImages: string[];
  current: number;
  gamesCount: number;
}

export interface CategoryHeaderProps {
  isAuth: boolean;
  onOrdersClick: () => void;
}

export interface SearchFiltersProps {
  searchTerm: string;
  sortBy: SortBy;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: SortBy) => void;
}

export interface PopularSectionProps {
  items: Game[];
  selectedGame: string | null;
  onGameClick: (gameId: string) => void;
  gamePackages: any[];
  loadingPackages: boolean;
  onWhatsAppPurchase: (game: Game) => void;
}

export interface CategoryGamesSectionProps {
  games: Game[];
  categoryName: string;
  selectedGame: string | null;
  onGameClick: (gameId: string) => void;
  gamePackages: any[];
  loadingPackages: boolean;
  onWhatsAppPurchase: (game: Game) => void;
}