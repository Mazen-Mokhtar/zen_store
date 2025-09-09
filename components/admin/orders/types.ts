// Base types
export type OrderStatus = 'pending' | 'paid' | 'delivered' | 'rejected' | 'processing';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'cash' | 'wallet-transfer' | 'insta-transfer' | 'fawry-transfer';
export type SortDirection = 'asc' | 'desc';
export type SortField = 'createdAt' | 'totalAmount' | 'status' | 'userEmail';

// User interface
export interface OrderUser {
  readonly _id: string;
  readonly email: string;
  readonly phone?: string;
}

// Game interface
export interface OrderGame {
  readonly _id: string;
  readonly name: string;
  readonly type?: string;
}

// Package interface
export interface OrderPackage {
  readonly _id: string;
  readonly title: string;
}

// Account info interface
export interface AccountInfo {
  readonly fieldName: string;
  readonly value: string;
  readonly _id?: string;
}

// Order item interface
export interface OrderItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

// Image interface
export interface OrderImage {
  readonly secure_url: string;
  readonly public_id: string;
  readonly _id?: string;
}

// Shipping address interface
export interface ShippingAddress {
  readonly street: string;
  readonly city: string;
  readonly country: string;
  readonly postalCode: string;
}

// Main Order interface
export interface Order {
  readonly id: string;
  readonly _id?: string;
  readonly userId?: OrderUser;
  readonly userEmail?: string;
  readonly userName?: string;
  readonly gameId?: OrderGame;
  readonly packageId?: OrderPackage;
  readonly accountInfo?: readonly AccountInfo[];
  readonly items?: readonly OrderItem[];
  readonly totalAmount: number;
  readonly status: OrderStatus;
  readonly paymentStatus?: PaymentStatus;
  readonly paymentMethod?: PaymentMethod;
  readonly adminNote?: string;
  readonly isReviewed?: boolean;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly __v?: number;
  // Wallet transfer specific fields
  readonly walletTransferImage?: OrderImage;
  readonly walletTransferNumber?: string;
  readonly walletTransferSubmittedAt?: string;
  readonly nameOfInsta?: string;
  readonly instaTransferSubmittedAt?: string;
  readonly shippingAddress?: ShippingAddress;
}

// Filter interfaces
export interface OrderFilters {
  readonly searchTerm: string;
  readonly statusFilter: OrderStatus | 'all';
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly paymentMethod?: PaymentMethod | 'all';
  readonly minAmount?: number;
  readonly maxAmount?: number;
  readonly paymentStatus?: PaymentStatus | 'all';
  readonly sortBy?: SortField;
  readonly sortOrder?: SortDirection;
}

// Pagination interface
export interface PaginationConfig {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

// Sorting interface
export interface SortConfig {
  readonly field: SortField;
  readonly direction: SortDirection;
}

// State interface
export interface OrdersState {
  readonly orders: readonly Order[];
  readonly filteredOrders: readonly Order[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly selectedOrder: Order | null;
  readonly showOrderModal: boolean;
  readonly filters: OrderFilters;
  readonly pagination?: PaginationConfig;
  readonly sort?: SortConfig;
  readonly lastFetch: number | null;
  readonly serverSidePagination: boolean;
}

// API Response interfaces
export interface OrdersApiResponse {
  readonly success: boolean;
  readonly data: readonly Order[];
  readonly pagination: PaginationConfig;
  readonly message?: string;
}

export interface OrderUpdateResponse {
  readonly success: boolean;
  readonly data: Order;
  readonly message?: string;
}

// Hook return types
export interface UseOrdersReturn {
  readonly state: OrdersState;
  readonly actions: {
    readonly fetchOrders: () => Promise<void>;
    readonly updateOrderStatus: (orderId: string, status: OrderStatus, adminNote?: string) => Promise<void>;
    readonly exportOrders: () => void;
    readonly viewOrderDetails: (order: Order) => void;
    readonly closeOrderModal: () => void;
    readonly updateFilters: (filters: OrderFilters) => void;
    readonly refreshOrders: () => Promise<void>;
    readonly updatePagination: (page: number, limit?: number) => void;
    readonly updateSort: (field: SortField, direction?: SortDirection) => void;
  };
}

// Component prop types
export interface OrdersTableProps {
  readonly orders: readonly Order[];
  readonly loading: boolean;
  readonly onStatusUpdate: (orderId: string, status: OrderStatus, adminNote?: string) => Promise<void>;
  readonly onViewDetails: (order: Order) => void;
  readonly sort: SortConfig;
  readonly onSortChange: (field: SortField, direction?: SortDirection) => void;
}

export interface OrdersFiltersProps {
  readonly filters: OrderFilters;
  readonly onFiltersChange: (filters: OrderFilters) => void;
  readonly loading: boolean;
}

export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly itemsPerPage: number;
  readonly onPageChange: (page: number) => void;
  readonly showItemsPerPage?: boolean;
  readonly onItemsPerPageChange?: (itemsPerPage: number) => void;
  readonly className?: string;
  readonly disabled?: boolean;
}

export interface OrderDetailsModalProps {
  readonly order: Order | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onStatusUpdate: (orderId: string, status: OrderStatus, adminNote?: string) => Promise<void>;
}

// Utility types
export type OrderStatusUpdate = {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly adminNote?: string;
};

export type OrderExportData = Pick<Order, 'id' | 'userName' | 'userEmail' | 'totalAmount' | 'status' | 'createdAt'>;

// Validation types
export interface ValidationResult<T = any> {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly sanitizedValue?: T;
}

export interface OrderValidationRules {
  readonly orderNumber: {
    readonly required: boolean;
    readonly minLength: number;
    readonly maxLength: number;
    readonly pattern: RegExp;
  };
  readonly customerName: {
    readonly required: boolean;
    readonly minLength: number;
    readonly maxLength: number;
  };
  readonly email: {
    readonly required: boolean;
    readonly pattern: RegExp;
  };
  readonly totalAmount: {
    readonly required: boolean;
    readonly min: number;
    readonly max: number;
  };
  readonly adminNote: {
    readonly maxLength: number;
  };
}