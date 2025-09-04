'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderFilters, OrdersState } from './types';
import { notificationService } from '@/lib/notifications';

const initialFilters: OrderFilters = {
  searchTerm: '',
  statusFilter: 'all'
};

const initialState: OrdersState = {
  orders: [],
  filteredOrders: [],
  loading: false,
  selectedOrder: null,
  showOrderModal: false,
  filters: initialFilters
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

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!accessChecked) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await fetch('/api/order/admin/all', { credentials: 'include' });
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
        })) : [];
        
        setState(prev => ({
          ...prev,
          orders: mapped,
          filteredOrders: mapped,
          loading: false
        }));
      } catch {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      notificationService.error('خطأ', 'حدث خطأ أثناء جلب الطلبات');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [accessChecked, router]);

  // Filter orders
  const filterOrders = useCallback(() => {
    let filtered = state.orders;
    
    if (state.filters.searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(state.filters.searchTerm.toLowerCase()) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(state.filters.searchTerm.toLowerCase())) ||
        (order.userName && order.userName.toLowerCase().includes(state.filters.searchTerm.toLowerCase()))
      );
    }
    
    if (state.filters.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === state.filters.statusFilter);
    }
    
    setState(prev => ({ ...prev, filteredOrders: filtered }));
  }, [state.orders, state.filters]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: Order['status'], adminNote?: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const payload: { status: string; adminNote?: string } = { status: newStatus };
      if (adminNote) {
        payload.adminNote = adminNote;
      }
      
      const response = await fetch(`/api/order/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث حالة الطلب');
      }
      
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        ),
        loading: false
      }));
      
      notificationService.success('نجح التحديث', 'تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      notificationService.error('خطأ في التحديث', 'حدث خطأ في تحديث حالة الطلب');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Export orders
  const exportOrders = useCallback(() => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Order ID,User,Email,Total,Status,Date\n" +
      state.filteredOrders.map(order => 
        `${order.id},${order.userName},${order.userEmail},${order.totalAmount},${order.status},${new Date(order.createdAt).toLocaleDateString('ar-EG')}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Update filters
  const updateFilters = useCallback((filters: OrderFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  // Refresh orders
  const refreshOrders = useCallback(() => {
    window.location.reload();
  }, []);

  // Effects
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  return {
    ...state,
    accessChecked,
    updateOrderStatus,
    viewOrderDetails,
    closeOrderModal,
    exportOrders,
    updateFilters,
    refreshOrders,
    fetchOrders
  };
};