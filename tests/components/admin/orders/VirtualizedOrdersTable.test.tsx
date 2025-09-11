import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedOrdersTable } from '../../../../components/admin/orders/VirtualizedOrdersTable';
import { Order } from '../../../../lib/types';

// Mock react-window
jest.mock('react-window', () => ({
  List: ({ children, itemCount, itemSize, height, width }: any) => (
    <div data-testid="virtualized-list" style={{ height, width }}>
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) =>
        children({ index, style: { height: itemSize } })
      )}
    </div>
  ),
}));

const mockOrders: Order[] = [
  {
    id: '1',
    _id: '1',
    userId: { _id: 'user1', email: 'user1@example.com' },
    userEmail: 'user1@test.com',
    userName: 'User 1',
    gameId: { _id: 'game1', name: 'Test Game' },
    accountInfo: [{ fieldName: 'username', value: 'testuser1' }],
    totalAmount: 29.99,
    status: 'pending',
    paymentMethod: 'card',
    currency: 'USD',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    _id: '2',
    userId: { _id: 'user2', email: 'user2@example.com' },
    userEmail: 'user2@test.com',
    userName: 'User 2',
    gameId: { _id: 'game2', name: 'Another Game' },
    accountInfo: [{ fieldName: 'username', value: 'testuser2' }],
    totalAmount: 99.98,
    status: 'delivered',
    paymentMethod: 'card',
    currency: 'USD',
    createdAt: '2024-01-02T00:00:00.000Z',
     updatedAt: '2024-01-02T00:00:00.000Z',
   },
 ];

describe('VirtualizedOrdersTable', () => {
  const defaultProps = {
    orders: mockOrders,
    onViewOrder: jest.fn(),
    onUpdateStatus: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    render(<VirtualizedOrdersTable {...defaultProps} loading={true} />);
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('displays empty state when no orders', () => {
    render(<VirtualizedOrdersTable {...defaultProps} orders={[]} />);
    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('renders order rows correctly', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Another Game')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$99.98')).toBeInTheDocument();
  });

  it('handles order view action', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const viewButton = screen.getAllByLabelText('View order details')[0];
    fireEvent.click(viewButton);
    expect(defaultProps.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('handles status updates', async () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const statusButton = screen.getAllByText('Mark as Completed')[0];
    fireEvent.click(statusButton);
    
    await waitFor(() => {
      expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith('1', 'completed');
    });
  });

  it('applies correct styling for different statuses', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const pendingRow = screen.getByText('Test Game').closest('[data-testid="order-row"]');
    const completedRow = screen.getByText('Another Game').closest('[data-testid="order-row"]');
    
    expect(pendingRow).toHaveClass('bg-yellow-50');
    expect(completedRow).toHaveClass('bg-green-50');
  });

  it('handles keyboard navigation', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const viewButton = screen.getAllByLabelText('View order details')[0];
    
    fireEvent.keyDown(viewButton, { key: 'Enter' });
    expect(defaultProps.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('displays correct accessibility attributes', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const table = screen.getByRole('grid');
    expect(table).toHaveAttribute('aria-label', 'Orders table');
    
    const rows = screen.getAllByRole('row');
    rows.forEach((row, index) => {
      expect(row).toHaveAttribute('aria-rowindex', (index + 1).toString());
    });
  });

  it('handles large datasets efficiently', () => {
    const largeOrderSet = Array.from({ length: 1000 }, (_, i) => ({
      ...mockOrders[0],
      id: `order-${i}`,
    }));
    
    const { container } = render(
      <VirtualizedOrdersTable {...defaultProps} orders={largeOrderSet} />
    );
    
    // Should only render visible items, not all 1000
    const renderedRows = container.querySelectorAll('[data-testid="order-row"]');
    expect(renderedRows.length).toBeLessThan(50);
  });
});