import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OrdersPage from '@/app/orders/page';
import { orderApiService } from '@/lib/api';
import { authService } from '@/lib/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  orderApiService: {
    getUserOrders: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authService: {
    getAuthState: jest.fn(),
  },
}));

jest.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

const mockOrders = [
  {
    _id: 'order1',
    gameId: {
      _id: 'game1',
      name: 'Test Game 1',
      image: { secure_url: 'https://example.com/game1.jpg' },
    },
    packageId: {
      _id: 'pkg1',
      title: '100 Diamonds',
      currency: 'EGP',
    },
    accountInfo: [
      { fieldName: 'Player ID', value: '123456' },
    ],
    status: 'pending' as const,
    paymentMethod: 'card' as const,
    totalAmount: 50,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    _id: 'order2',
    gameId: {
      _id: 'game2',
      name: 'Test Game 2',
      image: { secure_url: 'https://example.com/game2.jpg' },
    },
    packageId: {
      _id: 'pkg2',
      title: '500 Coins',
      currency: 'USD',
    },
    accountInfo: [
      { fieldName: 'User ID', value: '789012' },
    ],
    status: 'delivered' as const,
    paymentMethod: 'card' as const,
    totalAmount: 100,
    createdAt: '2024-01-14T15:45:00Z',
  },
];

describe('OrdersPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (authService.getAuthState as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Test User', email: 'test@example.com' },
    });

    (orderApiService.getUserOrders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrders,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<OrdersPage />);
    expect(screen.getByText('جاري تحميل الطلبات...')).toBeInTheDocument();
  });

  it('renders user information', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders orders list', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Game 2')).toBeInTheDocument();
    expect(screen.getByText('100 Diamonds')).toBeInTheDocument();
    expect(screen.getByText('500 Coins')).toBeInTheDocument();
  });

  it('displays order status correctly', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('قيد الانتظار')).toBeInTheDocument();
    });

    expect(screen.getByText('تم التسليم')).toBeInTheDocument();
  });

  it('opens order details modal on click', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    const orderItem = screen.getByText('Test Game 1').closest('article');
    fireEvent.click(orderItem!);

    await waitFor(() => {
      expect(screen.getByText('تفاصيل الطلب')).toBeInTheDocument();
    });
  });

  it('handles empty orders state', async () => {
    (orderApiService.getUserOrders as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('لا توجد طلبات')).toBeInTheDocument();
    });

    expect(screen.getByText('لم تقم بإنشاء أي طلبات بعد')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (orderApiService.getUserOrders as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('حدث خطأ أثناء جلب الطلبات')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation for orders', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    const orderItem = screen.getByText('Test Game 1').closest('article');
    
    // Test keyboard activation
    fireEvent.keyDown(orderItem!, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('تفاصيل الطلب')).toBeInTheDocument();
    });
  });

  it('displays responsive layout on mobile', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Check that mobile layout is applied
    const orderItems = screen.getAllByRole('article');
    orderItems.forEach(item => {
      expect(item).toHaveClass('block', 'md:hidden');
    });
  });

  it('formats dates correctly', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Check that dates are formatted in Arabic locale
    const dateElements = screen.getAllByText(/يناير|فبراير|مارس/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('displays payment method icons correctly', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Check for payment method icons
    const creditCardIcons = screen.getAllByTestId('credit-card-icon');
    expect(creditCardIcons.length).toBeGreaterThan(0);
  });
});