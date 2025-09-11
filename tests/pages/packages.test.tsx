import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import PackagesPage from '@/app/packages/page';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiService: {
    getGameById: jest.fn(),
    getPackagesByGameId: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    getAuthState: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const mockGame = {
  _id: 'game123',
  name: 'Test Game',
  description: 'Test game description',
  image: { secure_url: 'https://example.com/game.jpg' },
  accountInfoFields: [
    { fieldName: 'Player ID', isRequired: true },
    { fieldName: 'Email', isRequired: false },
  ],
};

const mockPackages = [
  {
    _id: 'pkg1',
    title: '100 Diamonds',
    price: 50,
    finalPrice: 45,
    currency: 'EGP',
    isOffer: true,
    discountPercentage: 10,
    image: { secure_url: 'https://example.com/package.jpg' },
  },
  {
    _id: 'pkg2',
    title: '500 Diamonds',
    price: 200,
    currency: 'EGP',
    isOffer: false,
    image: { secure_url: 'https://example.com/package2.jpg' },
  },
];

describe('PackagesPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getAuthState as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Test User', email: 'test@example.com' },
    });
    
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'gameId') return 'game123';
      if (key === 'gameName') return 'Test Game';
      return null;
    });

    (apiService.getGameById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockGame,
    });

    (apiService.getPackagesByGameId as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPackages,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<PackagesPage />);
    expect(screen.getByText('جاري تحميل الباقات...')).toBeInTheDocument();
  });

  it('renders game information and packages after loading', async () => {
    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    expect(screen.getByText('100 Diamonds')).toBeInTheDocument();
    expect(screen.getByText('500 Diamonds')).toBeInTheDocument();
  });

  it('handles package selection', async () => {
    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('100 Diamonds')).toBeInTheDocument();
    });

    const packageCard = screen.getByText('100 Diamonds').closest('.square-card');
    fireEvent.click(packageCard!);

    expect(packageCard).toHaveClass('selected-card');
  });

  it('validates required account info fields', async () => {
    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    // Select a package
    const packageCard = screen.getByText('100 Diamonds').closest('.square-card');
    fireEvent.click(packageCard!);

    // Try to create order without filling required fields
    const buyButton = screen.getByText('شراء الباقة');
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText(/يرجى ملء الحقول المطلوبة/)).toBeInTheDocument();
    });
  });

  it('validates email format in account info', async () => {
    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    // Fill in account info with invalid email
    const playerIdInput = screen.getByLabelText('Player ID');
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(playerIdInput, { target: { value: '123456' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Select a package
    const packageCard = screen.getByText('100 Diamonds').closest('.square-card');
    fireEvent.click(packageCard!);

    // Try to create order
    const buyButton = screen.getByText('شراء الباقة');
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText(/تنسيق البريد الإلكتروني غير صحيح/)).toBeInTheDocument();
    });
  });

  it('shows login modal for unauthenticated users', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authService.getAuthState as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    // Select a package
    const packageCard = screen.getByText('100 Diamonds').closest('.square-card');
    fireEvent.click(packageCard!);

    // Try to create order
    const buyButton = screen.getByText('تسجيل دخول للشراء');
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText('تسجيل الدخول مطلوب')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (apiService.getGameById as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load game data')).toBeInTheDocument();
    });
  });

  it('redirects when gameId is missing', async () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('لم يتم تحديد اللعبة')).toBeInTheDocument();
    });
  });

  it('is accessible with keyboard navigation', async () => {
    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    const packageCard = screen.getByText('100 Diamonds').closest('.square-card') as HTMLElement;
    
    // Test keyboard navigation
    packageCard?.focus();
    fireEvent.keyDown(packageCard!, { key: 'Enter' });

    expect(packageCard).toHaveClass('selected-card');
  });

  it('displays proper ARIA labels and roles', async () => {
    render(<PackagesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    // Check for proper ARIA attributes
    const packageCards = screen.getAllByRole('button');
    expect(packageCards.length).toBeGreaterThan(0);

    packageCards.forEach(card => {
      expect(card).toHaveAttribute('aria-label');
      expect(card).toHaveAttribute('tabIndex');
    });
  });
});