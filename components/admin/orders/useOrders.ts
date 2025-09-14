'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderFilters, OrdersState, SortField, SortDirection } from './types';
import { notificationService } from '@/lib/notifications';
import { sanitizeInput } from '@/lib/security';
import { 
  validateOrderStatus, 
  validateSearchQuery, 
  validateAdminNote,
  validateRateLimit,
  orderValidation 
} from '@/lib/validation';

const initialFilters: OrderFilters = {
  searchTerm: '',
  statusFilter: 'all',
  paymentStatus: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
};

const initialState: OrdersState = {
  orders: [],
  filteredOrders: [],
  loading: false,
  error: null,
  selectedOrder: null,
  showOrderModal: false,
  filters: initialFilters,
  pagination: initialPagination,
  lastFetch: null,
  serverSidePagination: true
};

export const useOrders = () => {
  const [state, setState] = useState<OrdersState>(initialState);
  const [accessChecked, setAccessChecked] = useState(false);
  const router = useRouter();

  // Verify admin access
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const res = await fetch('/api/user/profile/admin', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!res.ok) {
          window.location.replace('/404');
          return;
        }
        
        const data = await res.json();
        const role = data?.success ? data?.data?.role : data?.user?.role;
        
        if (role !== 'admin' && role !== 'superAdmin') {
          window.location.replace('/404');
          return;
        }
        
        setAccessChecked(true);
      } catch (e) {
        window.location.replace('/404');
      }
    };
    verifyAccess();
  }, [router]);

  // Fetch orders with server-side pagination
  const fetchOrders = useCallback(async (customFilters?: Partial<OrderFilters>, customPagination?: Partial<typeof initialPagination>) => {
    if (!accessChecked) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Build query parameters
      const filters = { ...state.filters, ...customFilters };
      const pagination = { ...state.pagination, ...customPagination };
      
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      queryParams.append('page', (pagination?.page || 1).toString());
      queryParams.append('limit', (pagination?.limit || 20).toString());
      
      // Add filter params
      if (filters.statusFilter && filters.statusFilter !== 'all') {
        queryParams.append('status', filters.statusFilter);
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        queryParams.append('paymentStatus', filters.paymentStatus);
      }
      if (filters.searchTerm) {
        queryParams.append('search', filters.searchTerm);
      }
      if (filters.dateFrom) {
        queryParams.append('startDate', filters.dateFrom);
      }
      if (filters.dateTo) {
        queryParams.append('endDate', filters.dateTo);
      }
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      
      const res = await fetch(`/api/order/admin/all?${queryParams.toString()}`, { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const text = await res.text();
      
      if (!res.ok) {
        if (text.includes('Not allow for you')) {
          notificationService.error('وصول مرفوض', 'ليس لديك صلاحية للوصول للطلبات');
          router.back();
          return;
        }
        notificationService.error('فشل الجلب', 'تعذر جلب طلبات الأدمن');
        return;
      }
      
      try {
        const data = JSON.parse(text);
        const mapped = Array.isArray(data?.data) ? data.data.map((o: any, idx: number) => ({
          id: o._id || String(idx + 1),
          _id: o._id,
          userId: o.userId || o.user || '',
          userEmail: o.userEmail || o.user?.email || '',
          userName: o.userName || o.user?.userName || o.user?.name || '',
          gameId: o.gameId || undefined,
          packageId: o.packageId || undefined,
          accountInfo: o.accountInfo || [],
          items: Array.isArray(o.items) ? o.items.map((it: any, i: number) => ({
            id: it.id || String(i + 1),
            name: it.name || it.title || 'Item',
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1
          })) : [],
          totalAmount: Number(o.totalAmount || o.total || 0),
          status: (o.status || 'pending'),
          paymentStatus: (o.paymentStatus || o.payment_status || (o.status === 'paid' ? 'paid' : 'pending') || (o.isPaid ? 'paid' : 'pending') || (o.paid ? 'paid' : 'pending')),
          paymentMethod: o.paymentMethod || undefined,
          adminNote: o.adminNote || undefined,
          isReviewed: o.isReviewed || false,
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
          shippingAddress: o.shippingAddress || undefined,
          walletTransferNumber: o.walletTransferNumber || undefined,
          walletTransferImage: o.walletTransferImage || undefined,
          walletTransferSubmittedAt: o.walletTransferSubmittedAt || undefined,
          nameOfInsta: o.nameOfInsta || undefined,
          instaTransferSubmittedAt: o.instaTransferSubmittedAt || undefined,
        })) : [];
        
        // Update pagination info from server response
        const paginationInfo = {
          page: data.pagination?.currentPage || pagination.page,
          limit: customPagination?.limit || data.pagination?.itemsPerPage || pagination.limit,
          total: data.pagination?.totalItems || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false
        };
        
        setState(prev => ({
          ...prev,
          orders: mapped,
          filteredOrders: mapped,
          loading: false,
          pagination: paginationInfo,
          filters: filters,
          lastFetch: Date.now()
        }));
      } catch {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      notificationService.error('خطأ', 'حدث خطأ أثناء جلب الطلبات');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [accessChecked, router, state.filters, state.pagination]);

  // Remove client-side filtering since we're using server-side pagination
  // filteredOrders will be the same as orders from server response

  // Enhanced update order status with validation
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: Order['status'], adminNote?: string) => {
    // Rate limiting check
    if (!validateRateLimit(`update_order_${orderId}`, 10, 60000)) {
      notificationService.error('تحديث متكرر', 'يرجى الانتظار قبل المحاولة مرة أخرى');
      return;
    }

    // Validate inputs
    const sanitizedOrderId = sanitizeInput(orderId);
    if (!sanitizedOrderId) {
      notificationService.error('خطأ في البيانات', 'معرف الطلب غير صحيح');
      return;
    }

    const statusValidation = validateOrderStatus(newStatus);
    if (!statusValidation.isValid) {
      notificationService.error('خطأ في البيانات', statusValidation.errors.join(', '));
      return;
    }

    let sanitizedAdminNote: string | undefined;
    if (adminNote) {
      const noteValidation = validateAdminNote(adminNote);
      if (!noteValidation.isValid) {
        notificationService.error('خطأ في البيانات', noteValidation.errors.join(', '));
        return;
      }
      sanitizedAdminNote = noteValidation.sanitizedValue;
    }

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const payload: { status: string; adminNote?: string } = { 
        status: statusValidation.sanitizedValue 
      };
      if (sanitizedAdminNote) {
        payload.adminNote = sanitizedAdminNote;
      }
      
      const response = await fetch(`/api/order/admin/${encodeURIComponent(sanitizedOrderId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'فشل في تحديث حالة الطلب');
      }
      
      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === sanitizedOrderId 
            ? { 
                ...order, 
                status: statusValidation.sanitizedValue, 
                adminNote: sanitizedAdminNote,
                updatedAt: new Date().toISOString() 
              }
            : order
        ),
        loading: false
      }));
      
      notificationService.success('نجح التحديث', 'تم تحديث حالة الطلب بنجاح');
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في تحديث حالة الطلب';
      notificationService.error('خطأ في التحديث', errorMessage);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Enhanced export orders with validation and security
  const exportOrders = useCallback(() => {
    // Rate limiting for export
    if (!validateRateLimit('export_orders', 5, 300000)) { // 5 exports per 5 minutes
      notificationService.error('تصدير متكرر', 'يرجى الانتظار قبل تصدير البيانات مرة أخرى');
      return;
    }

    try {
      const headers = ['رقم الطلب', 'اسم العميل', 'البريد الإلكتروني', 'المجموع', 'الحالة', 'التاريخ'];
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
        headers.join(',') + "\n" +
        state.filteredOrders.map(order => {
          const sanitizedData = [
            sanitizeInput(order.id || ''),
            sanitizeInput(order.userName || ''),
            sanitizeInput(order.userEmail || ''),
            order.totalAmount || 0,
            sanitizeInput(order.status || ''),
            new Date(order.createdAt).toLocaleDateString('ar-SA')
          ];
          return sanitizedData.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notificationService.success('تم التصدير', 'تم تصدير البيانات بنجاح');
    } catch (error) {

      notificationService.error('خطأ في التصدير', 'حدث خطأ أثناء تصدير البيانات');
    }
  }, [state.filteredOrders]);

  // View order details
  const viewOrderDetails = useCallback((order: Order) => {
    setState(prev => ({
      ...prev,
      selectedOrder: order,
      showOrderModal: true
    }));
  }, []);

  // Close order modal
  const closeOrderModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedOrder: null,
      showOrderModal: false
    }));
  }, []);

  // Enhanced update filters with validation and server-side fetch
  const updateFilters = useCallback(async (filters: OrderFilters) => {
    // Create sanitized filters object as mutable
    const sanitizedFilters: any = {
      searchTerm: '',
      statusFilter: 'all',
      paymentStatus: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    // Validate and sanitize search term
    if (filters.searchTerm) {
      const searchValidation = validateSearchQuery(filters.searchTerm);
      if (searchValidation.isValid) {
        sanitizedFilters.searchTerm = searchValidation.sanitizedValue || '';
      }
    }

    // Validate status filter
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      const statusValidation = validateOrderStatus(filters.statusFilter);
      if (statusValidation.isValid) {
        sanitizedFilters.statusFilter = statusValidation.sanitizedValue as any;
      } else {
        sanitizedFilters.statusFilter = 'all';
      }
    } else {
      sanitizedFilters.statusFilter = 'all';
    }

    // Validate payment status
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      sanitizedFilters.paymentStatus = filters.paymentStatus;
    }

    // Validate sort options
    if (filters.sortBy) {
      sanitizedFilters.sortBy = filters.sortBy;
    }
    if (filters.sortOrder) {
      sanitizedFilters.sortOrder = filters.sortOrder;
    }

    // Copy other filters
    if (filters.dateFrom) sanitizedFilters.dateFrom = filters.dateFrom;
    if (filters.dateTo) sanitizedFilters.dateTo = filters.dateTo;
    if (filters.paymentMethod) sanitizedFilters.paymentMethod = filters.paymentMethod;
    if (filters.minAmount) sanitizedFilters.minAmount = filters.minAmount;
    if (filters.maxAmount) sanitizedFilters.maxAmount = filters.maxAmount;

    // Reset to first page when filters change
    await fetchOrders(sanitizedFilters as OrderFilters, { page: 1 });
  }, [fetchOrders]);

  // Update pagination
  const updatePagination = useCallback(async (page: number, limit?: number) => {
    const newPagination: any = { page };
    if (limit) {
      newPagination.limit = limit;
    }
    await fetchOrders(undefined, newPagination);
  }, [fetchOrders]);

  // Update sort
  const updateSort = useCallback(async (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    await fetchOrders({ sortBy, sortOrder } as any);
  }, [fetchOrders]);

  // Enhanced refresh orders
  const refreshOrders = useCallback(async () => {
    // Rate limiting for refresh
    if (!validateRateLimit('refresh_orders', 10, 60000)) {
      notificationService.error('تحديث متكرر', 'يرجى الانتظار قبل تحديث البيانات مرة أخرى');
      return;
    }

    try {
      await fetchOrders();
      notificationService.success('تم التحديث', 'تم تحديث البيانات بنجاح');
    } catch (error) {

      notificationService.error('خطأ في التحديث', 'حدث خطأ أثناء تحديث البيانات');
    }
  }, [fetchOrders]);

  // Effects
  useEffect(() => {
    if (accessChecked) {
      fetchOrders();
    }
  }, [accessChecked, fetchOrders]);

  return {
    ...state,
    accessChecked,
    updateOrderStatus,
    viewOrderDetails,
    closeOrderModal,
    exportOrders,
    updateFilters,
    updatePagination,
    updateSort,
    refreshOrders,
    fetchOrders
  };
};