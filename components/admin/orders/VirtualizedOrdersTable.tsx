'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { List } from 'react-window';
import { Order, OrderStatus } from './types';
import { statusColors, ORDER_STATUS_LABELS } from './constants';
import { sanitizeInput } from '@/lib/security';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, MoreHorizontal, Package, Calendar, User, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VirtualizedOrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, adminNote?: string) => Promise<void>;
  currentPage?: number;
  itemsPerPage?: number;
  className?: string;
}

interface OrderRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    orders: Order[];
    onViewOrder: (order: Order) => void;
    onUpdateStatus: (orderId: string, status: OrderStatus, adminNote?: string) => Promise<void>;
    isMobile: boolean;
  };
}

// Memoized Order Row Component for virtualization
const OrderRow = React.memo<OrderRowProps>(({ index, style, data }) => {
  const { orders, onViewOrder, onUpdateStatus, isMobile } = data;
  const order = orders[index];
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = useCallback(async (newStatus: OrderStatus) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await onUpdateStatus(order.id, newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [order.id, onUpdateStatus, isUpdating]);

  const handleViewOrder = useCallback(() => {
    onViewOrder(order);
  }, [order, onViewOrder]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  if (!order) {
    return (
      <div style={style} className="px-4 py-2">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded"></div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile Card View
    return (
      <div style={style} className="px-4 py-2">
        <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    #{sanitizeInput(order.orderNumber)}
                  </span>
                </div>
                <Badge 
                  variant="secondary"
                  className={`${statusColors[order.status]} text-xs`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{sanitizeInput(order.customerName)}</span>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <CreditCard className="w-3 h-3" />
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewOrder}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  عرض
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={isUpdating}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      {isUpdating ? 'جاري التحديث...' : 'تحديث الحالة'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusUpdate(status as OrderStatus)}
                        disabled={status === order.status}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop Table Row
  return (
    <div 
      style={style} 
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="grid grid-cols-7 gap-4 px-6 py-4 items-center">
        {/* Order Number */}
        <div className="font-medium text-gray-900 dark:text-white">
          #{sanitizeInput(order.orderNumber)}
        </div>

        {/* Customer */}
        <div className="text-gray-600 dark:text-gray-400">
          {sanitizeInput(order.customerName)}
        </div>

        {/* Date */}
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {formatDate(order.createdAt)}
        </div>

        {/* Total */}
        <div className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(order.total, order.currency)}
        </div>

        {/* Status */}
        <div>
          <Badge 
            variant="secondary"
            className={statusColors[order.status]}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Payment Status */}
        <div>
          <Badge 
            variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
            className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
          >
            {order.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewOrder}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            عرض
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={isUpdating}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusUpdate(status as OrderStatus)}
                  disabled={status === order.status}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

OrderRow.displayName = 'OrderRow';

export const VirtualizedOrdersTable = React.memo<VirtualizedOrdersTableProps>(({ 
  orders, 
  loading = false, 
  onViewOrder, 
  onUpdateStatus,
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const listRef = useRef<List>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoized data for virtualization
  const itemData = useMemo(() => ({
    orders,
    onViewOrder,
    onUpdateStatus,
    isMobile
  }), [orders, onViewOrder, onUpdateStatus, isMobile]);

  // Calculate item height based on viewport
  const itemHeight = useMemo(() => {
    return isMobile ? 180 : 80; // Mobile cards are taller
  }, [isMobile]);

  // Calculate list height (max 600px, min 400px)
  const listHeight = useMemo(() => {
    const maxHeight = 600;
    const minHeight = 400;
    const calculatedHeight = Math.min(orders.length * itemHeight, maxHeight);
    return Math.max(calculatedHeight, minHeight);
  }, [orders.length, itemHeight]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد طلبات
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            لم يتم العثور على أي طلبات تطابق المعايير المحددة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Desktop Table Header */}
      {!isMobile && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-7 gap-4 px-6 py-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              رقم الطلب
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              العميل
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              التاريخ
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              المجموع
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الحالة
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              حالة الدفع
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الإجراءات
            </div>
          </div>
        </div>
      )}

      {/* Virtualized List */}
      <div className="relative">
        <List
          ref={listRef}
          height={listHeight}
          itemCount={orders.length}
          itemSize={itemHeight}
          itemData={itemData}
          overscanCount={5} // Render 5 extra items for smooth scrolling
          className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        >
          {OrderRow}
        </List>
      </div>

      {/* Performance Info */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          عرض {orders.length} طلب • تم تحسين الأداء للقوائم الكبيرة
        </p>
      </div>
    </div>
  );
});

VirtualizedOrdersTable.displayName = 'VirtualizedOrdersTable';

export default VirtualizedOrdersTable;