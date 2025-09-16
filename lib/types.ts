// Shared types and configurations for the ZenStore application

export interface Order {
  _id: string;
  id: string; // Computed property for compatibility
  userId?: {
    _id: string;
    email: string;
    phone?: string;
  };
  userName?: string; // Computed property for compatibility
  userEmail?: string; // Computed property for compatibility
  orderNumber?: string; // Computed property for compatibility
  customerName?: string; // Computed property for compatibility
  total?: number; // Alias for totalAmount
  gameId: {
    _id: string;
    name: string;
    type?: string;
    image?: {
      secure_url: string;
    };
  };
  packageId?: {
    _id: string;
    title: string;
    price?: number;
    currency?: string;
  };
  accountInfo: { fieldName: string; value: string; _id?: string }[];
  status: 'pending' | 'processing' | 'paid' | 'delivered' | 'rejected';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'wallet-transfer' | 'insta-transfer' | 'fawry-transfer';
  totalAmount: number;
  currency: string; // العملة المستخدمة في الطلب
  originalAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  couponDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    appliedAmount: number;
  };
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  refundAmount?: number;
  refundDate?: string;
  isReviewed?: boolean;
  __v?: number;
  // Wallet transfer specific fields
  walletTransferImage?: {
    secure_url: string;
    public_id: string;
    _id?: string;
  };
  walletTransferNumber?: string;
  walletTransferSubmittedAt?: string;
  instaTransferSubmittedAt?: string;
  nameOfInsta?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  items?: any[];
}

export interface CreateOrderData {
  gameId: string;
  packageId?: string;
  accountInfo: { fieldName: string; value: string }[];
  paymentMethod: 'card' | 'cash' | 'wallet-transfer' | 'insta-transfer' | 'fawry-transfer';
  note?: string;
  couponCode?: string;
}

// Order status configuration with visual styling and labels
export const ORDER_STATUS_CONFIG = {
  pending: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/20',
    label: 'قيد الانتظار',
    description: 'طلبك قيد المراجعة وسيتم معالجته قريباً'
  },
  processing: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
    label: 'قيد المعالجة',
    description: 'جاري معالجة طلبك وتجهيزه للتسليم'
  },
  paid: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    label: 'مدفوع',
    description: 'تم استلام الدفع وجاري معالجة الطلب'
  },
  delivered: {
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
    label: 'تم التسليم',
    description: 'تم تسليم طلبك بنجاح'
  },
  rejected: {
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',  
    borderColor: 'border-red-400/20',
    label: 'مرفوض',
    description: 'تم رفض أو إلغاء الطلب'
  }
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;

// Steam Game Types
export interface SteamGame {
  _id: string;
  slug: string;
  name: string;
  description: string;
  type: 'steam';
  price?: number;
  currency?: string; // Added currency property
  isOffer?: boolean;
  originalPrice?: number;
  finalPrice?: number;
  discountPercentage?: number;
  image: {
    secure_url: string;
    public_id: string;
  };
  images?: {
    secure_url: string;
    public_id: string;
  }[];
  video?: {
    secure_url: string;
    public_id: string;
  };
  backgroundImage?: {
    secure_url: string;
    public_id: string;
  };
  accountInfoFields: { fieldName: string; isRequired: boolean }[];
  categoryId: string;
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
  tags?: string[];
}

export type SteamGamePrice = {
  amount: number;
  currency: string;
  discount?: number;
  originalAmount?: number;
}

// Coupon Types
export interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableGames?: string[];
  applicableCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationRequest {
  code: string;
  orderAmount: number;
}

export interface CouponValidationResponse {
  success: boolean;
  isValid?: boolean;
  data?: {
    code: string;
    discountAmount: number;
    discountPercentage?: number;
    type: 'percentage' | 'fixed';
    description?: string;
    coupon?: Coupon;
    finalAmount?: number;
  };
  message?: string;
  error?: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
  discountPercentage?: number;
  originalAmount: number;
  finalAmount: number;
  description?: string;
}