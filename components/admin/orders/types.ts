export interface Order {
  id: string;
  _id?: string;
  userId: string | {
    _id: string;
    email: string;
    phone: string;
  };
  userEmail: string;
  userName: string;
  gameId?: {
    _id: string;
    name: string;
  };
  packageId?: {
    _id: string;
    title: string;
  };
  accountInfo?: {
    fieldName: string;
    value: string;
    _id: string;
  }[];
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'delivered' | 'rejected' | 'cancelled' | 'processing';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  adminNote?: string;
  isReviewed?: boolean;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

export interface OrderFilters {
  searchTerm: string;
  statusFilter: string;
}

export interface OrdersState {
  orders: Order[];
  filteredOrders: Order[];
  loading: boolean;
  selectedOrder: Order | null;
  showOrderModal: boolean;
  filters: OrderFilters;
}