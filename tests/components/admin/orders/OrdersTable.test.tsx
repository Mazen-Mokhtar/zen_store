import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrdersTable } from '../../../../components/admin/orders/OrdersTable';
import { Order } from '../../../../lib/types';

// Mock the VirtualizedOrdersTable component
jest.mock('../../../../components/admin/orders/VirtualizedOrdersTable', () => ({
  VirtualizedOrdersTable: ({ orders, loading, onOrderSelect, onStatusUpdate }: any) => (
    <div data-testid="virtualized-orders-table">
      {loading ? (
        <div>Loading...</div>
      ) : (
        orders.map((order: Order) => (
          <div key={order.id} data-testid={`order-${order.id}`}>
            <span>{order.id}</span>
            <button onClick={() => onOrderSelect(order.id)}>Select</button>
            <button onClick={() => onStatusUpdate(order.id, 'completed')}>Update Status</button>
          </div>
        ))
      )}
    </div>
  ),
}));

// Mock the Pagination component
jest.mock('../../../../components/admin/orders/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
}));

const mockOrders: Order[] = [
  {
    id: '1',
    userId: 'user1',
    items: [{ id: 'item1', name: 'Test Game 1', price: 29.99, quantity: 1 }],
    total: 29.99,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    userId: 'user2',
    items: [{ id: 'item2', name: 'Test Game 2', price: 49.99, quantity: 1 }],
    total: 49.99,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

// Mock fetch for API calls
global.fetch = jest.fn();

describe('OrdersTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ orders: mockOrders, total: mockOrders.length }),
    });
  });

  it('renders without crashing', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-orders-table')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<OrdersTable />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays orders', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('order-1')).toBeInTheDocument();
      expect(screen.getByTestId('order-2')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-orders-table')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search orders...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test%20search'),
        expect.any(Object)
      );
    });
  });

  it('handles status filter changes', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-orders-table')).toBeInTheDocument();
    });
    
    const statusFilter = screen.getByDisplayValue('all');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
        expect.any(Object)
      );
    });
  });

  it('handles date range filtering', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-orders-table')).toBeInTheDocument();
    });
    
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01'),
        expect.any(Object)
      );
    });
  });

  it('handles order selection', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('order-1')).toBeInTheDocument();
    });
    
    const selectButton = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton);
    
    // Should update selected orders state
    expect(screen.getByText('1 order(s) selected')).toBeInTheDocument();
  });

  it('handles bulk actions', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('order-1')).toBeInTheDocument();
    });
    
    // Select an order
    const selectButton = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton);
    
    // Perform bulk action
    const bulkActionSelect = screen.getByDisplayValue('Select action');
    fireEvent.change(bulkActionSelect, { target: { value: 'mark_completed' } });
    
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/orders/bulk',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            action: 'mark_completed',
            orderIds: ['1'],
          }),
        })
      );
    });
  });

  it('handles status updates', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('order-1')).toBeInTheDocument();
    });
    
    const updateButton = screen.getAllByText('Update Status')[0];
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/orders/1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        })
      );
    });
  });

  it('handles pagination', async () => {
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading orders. Please try again.')).toBeInTheDocument();
    });
  });

  it('exports orders functionality', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock link click
    const mockClick = jest.fn();
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return { click: mockClick, href: '', download: '' } as any;
      }
      return document.createElement(tagName);
    });
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['csv data'], { type: 'text/csv' }),
    });
    
    render(<OrdersTable />);
    
    await waitFor(() => {
      expect(screen.getByTestId('virtualized-orders-table')).toBeInTheDocument();
    });
    
    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/orders/export', expect.any(Object));
      expect(mockClick).toHaveBeenCalled();
    });
  });
});