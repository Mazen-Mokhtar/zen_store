export interface Order {
  id: string;
  _id?: string;
  userId?: {
    _id: string;
    email: string;
    phone?: string;
  };
  userEmail?: string;
  userName?: string;
  gameId?: {
    _id: string;
    name: string;
    type?: string;
  };
  packageId?: {
    _id: string;
    title: string;
  };
  accountInfo?: {
    fieldName: string;
    value: string;
    _id?: string;
  }[];
  items?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'delivered' | 'rejected' | 'processing';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'cash' | 'wallet-transfer' | 'insta-transfer' | 'fawry-transfer';
  adminNote?: string;
  isReviewed?: boolean;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
  // Wallet transfer specific fields
  walletTransferImage?: {
    secure_url: string;
    public_id: string;
    _id?: string;
  };
  walletTransferNumber?: string;
  walletTransferSubmittedAt?: string;
  nameOfInsta?: string;
  instaTransferSubmittedAt?: string;
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