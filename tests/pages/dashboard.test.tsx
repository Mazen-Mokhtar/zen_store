import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiService: {
    getCategoryWithPackages: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authService: {
    isAuthenticated: jest.fn(),
  },
}));

jest.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const mockGames = [
  {
    _id: 'game1',
    name: 'Popular Game 1',
    image: { secure_url: 'https://example.com/game1.jpg' },
    isPopular: true,
    type: 'games',
    price: 100,
  },
  {
    _id: 'game2',
    name: 'Mobile Game 1',
    image: { secure_url: 'https://example.com/game2.jpg' },
    isPopular: false,
    type: 'games',
    price: 50,
  },
  {
    _id: 'game3',
    name: 'Steam Game 1',
    image: { secure_url: 'https://example.com/game3.jpg' },
    isPopular: true,
    type: 'steam',
    slug: 'steam-game-1',
    price: 200,
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    mockSearchParams.get.mockReturnValue(null);

    (apiService.getCategoryWithPackages as jest.Mock).mockResolvedValue({
      success: true,
      data: mockGames,
      packages: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('renders hero section with carousel', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('dashboard.bloodStrike')).toBeInTheDocument();
    });

    expect(screen.getByText('dashboard.endex')).toBeInTheDocument();
    expect(screen.getByText('dashboard.buyNow')).toBeInTheDocument();
  });

  it('renders popular games section', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('dashboard.popular')).toBeInTheDocument();
    });

    expect(screen.getByText('Popular Game 1')).toBeInTheDocument();
    expect(screen.getByText('Steam Game 1')).toBeInTheDocument();
  });

  it('renders mobile games section', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('dashboard.mobileGames')).toBeInTheDocument();
    });

    expect(screen.getByText('Mobile Game 1')).toBeInTheDocument();
  });

  it('handles game click navigation correctly', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('Popular Game 1')).toBeInTheDocument();
    });

    // Click on regular game
    const regularGame = screen.getByText('Popular Game 1');
    fireEvent.click(regularGame);

    expect(mockRouter.push).toHaveBeenCalledWith('/packages?gameId=game1');

    // Click on Steam game
    const steamGame = screen.getByText('Steam Game 1');
    fireEvent.click(steamGame);

    expect(mockRouter.push).toHaveBeenCalledWith('/steam/steam-game-1');
  });

  it('toggles show all games functionality', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('dashboard.mobileGames')).toBeInTheDocument();
    });

    const seeAllButton = screen.getByText('dashboard.seeAll');
    fireEvent.click(seeAllButton);

    expect(screen.getByText('dashboard.showLess')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (apiService.getCategoryWithPackages as jest.Mock).mockRejectedValue(new Error('API Error'));

    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('errors.dataLoadFailed')).toBeInTheDocument();
    });
  });

  it('displays no games message when empty', async () => {
    (apiService.getCategoryWithPackages as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      packages: [],
    });

    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('No games available at the moment')).toBeInTheDocument();
    });
  });

  it('is accessible with proper ARIA attributes', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('dashboard.popular')).toBeInTheDocument();
    });

    // Check for proper headings
    const popularHeading = screen.getByRole('heading', { name: /dashboard.popular/ });
    expect(popularHeading).toBeInTheDocument();

    const mobileGamesHeading = screen.getByRole('heading', { name: /dashboard.mobileGames/ });
    expect(mobileGamesHeading).toBeInTheDocument();

    // Check for proper button roles
    const gameButtons = screen.getAllByRole('button');
    gameButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('supports keyboard navigation', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('Popular Game 1')).toBeInTheDocument();
    });

    const gameCard = screen.getByText('Popular Game 1').closest('[role="button"]');
    
    // Test keyboard activation
    fireEvent.keyDown(gameCard!, { key: 'Enter' });
    expect(mockRouter.push).toHaveBeenCalled();

    fireEvent.keyDown(gameCard!, { key: ' ' });
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('handles responsive image loading', async () => {
    const mockSearchParams = Promise.resolve({});
    render(<DashboardPage searchParams={mockSearchParams} />);
    
    await waitFor(() => {
      expect(screen.getByText('Popular Game 1')).toBeInTheDocument();
    });

    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
      expect(img).toHaveAttribute('sizes');
    });
  });
});