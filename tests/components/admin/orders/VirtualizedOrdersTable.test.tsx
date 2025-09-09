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
    userId: 'user1',
    items: [{ id: 'item1', name: 'Test Game', price: 29.99, quantity: 1 }],
    total: 29.99,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    userId: 'user2',
    items: [{ id: 'item2', name: 'Another Game', price: 49.99, quantity: 2 }],
    total: 99.98,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('VirtualizedOrdersTable', () => {
  const defaultProps = {
    orders: mockOrders,
    onOrderSelect: jest.fn(),
    onStatusUpdate: jest.fn(),
    selectedOrders: [],
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

  it('handles order selection', () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    expect(defaultProps.onOrderSelect).toHaveBeenCalledWith('1');
  });

  it('handles status updates', async () => {
    render(<VirtualizedOrdersTable {...defaultProps} />);
    const statusSelect = screen.getAllByDisplayValue('pending')[0];
    fireEvent.change(statusSelect, { target: { value: 'completed' } });
    
    await waitFor(() => {
      expect(defaultProps.onStatusUpdate).toHaveBeenCalledWith('1', 'completed');
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
    const firstRow = screen.getAllByRole('checkbox')[0];
    
    fireEvent.keyDown(firstRow, { key: 'Enter' });
    expect(defaultProps.onOrderSelect).toHaveBeenCalledWith('1');
    
    fireEvent.keyDown(firstRow, { key: ' ' });
    expect(defaultProps.onOrderSelect).toHaveBeenCalledWith('1');
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