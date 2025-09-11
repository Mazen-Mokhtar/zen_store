import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../../../../components/admin/orders/Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: jest.fn(),
    itemsPerPage: 20,
    totalItems: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pagination controls correctly', () => {
    render(<Pagination {...defaultProps} />);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-20 of 200 items')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when clicking page numbers', () => {
    render(<Pagination {...defaultProps} />);
    
    const pageButton = screen.getByText('2');
    fireEvent.click(pageButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking next/previous', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    
    const nextButton = screen.getByText('Next');
    const prevButton = screen.getByText('Previous');
    
    fireEvent.click(nextButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(6);
    
    fireEvent.click(prevButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
  });

  it('shows ellipsis for large page ranges', () => {
    render(<Pagination {...defaultProps} totalPages={100} currentPage={50} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    
    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('handles keyboard navigation', () => {
    render(<Pagination {...defaultProps} />);
    
    const pageButton = screen.getByText('2');
    fireEvent.keyDown(pageButton, { key: 'Enter' });
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('displays correct item range for different pages', () => {
    const { rerender } = render(<Pagination {...defaultProps} currentPage={1} />);
    expect(screen.getByText('Showing 1-20 of 200 items')).toBeInTheDocument();
    
    rerender(<Pagination {...defaultProps} currentPage={2} />);
    expect(screen.getByText('Showing 21-40 of 200 items')).toBeInTheDocument();
    
    rerender(<Pagination {...defaultProps} currentPage={10} />);
    expect(screen.getByText('Showing 181-200 of 200 items')).toBeInTheDocument();
  });

  it('handles edge case with fewer items than items per page', () => {
    render(<Pagination {...defaultProps} totalItems={15} totalPages={1} />);
    
    expect(screen.getByText('Showing 1-15 of 15 items')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Pagination {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Pagination Navigation');
    
    const currentPage = screen.getByText('1');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });
});