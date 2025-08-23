'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiDownload, FiEye, FiCheck, FiX, FiClock, FiRefreshCw } from 'react-icons/fi';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NotificationToast } from '@/components/ui/notification-toast';
import { notificationService } from '@/lib/notifications';

interface Order {
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



const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
};

const statusLabels = {
  pending: 'في الانتظار',
  paid: 'مدفوع',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  processing: 'قيد المعالجة'
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const paymentStatusLabels = {
  pending: 'معلق',
  paid: 'مدفوع',
  failed: 'فشل',
  refunded: 'مسترد'
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);

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

  useEffect(() => {
    if (!accessChecked) return;
    const fetchAdminOrders = async () => {
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
            items: Array.isArray(o.items) ? o.items.map((it: any, i: number) => ({ id: it.id || String(i+1), name: it.name || it.title || 'Item', price: Number(it.price)||0, quantity: Number(it.quantity)||1 })) : [],
            totalAmount: Number(o.totalAmount || o.total || 0),
            status: (o.status || 'pending'),
            paymentStatus: (o.paymentStatus || o.payment_status || (o.status === 'paid' ? 'paid' : 'pending') || (o.isPaid ? 'paid' : 'pending') || (o.paid ? 'paid' : 'pending')),
            paymentMethod: o.paymentMethod || undefined,
            adminNote: o.adminNote || undefined,
            isReviewed: o.isReviewed || false,
            createdAt: o.createdAt || new Date().toISOString(),
            updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
            shippingAddress: o.shippingAddress || undefined,
          })) : [];
          setOrders(mapped);
          setFilteredOrders(mapped);
        } catch { /* not JSON */ }
      } catch (e) {
        notificationService.error('خطأ', 'حدث خطأ أثناء جلب الطلبات');
      }
    };
    fetchAdminOrders();
  }, [accessChecked, router]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const filterOrders = () => {
    let filtered = orders;
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status'], adminNote?: string) => {
    setLoading(true);
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
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );
      
      notificationService.success('نجح التحديث', 'تم تحديث حالة الطلب بنجاح');
      } catch (error) {
        notificationService.error('خطأ في التحديث', 'حدث خطأ في تحديث حالة الطلب');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const exportOrders = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Order ID,User,Email,Total,Status,Date\n" +
      filteredOrders.map(order => 
        `${order.id},${order.userName},${order.userEmail},${order.totalAmount},${order.status},${new Date(order.createdAt).toLocaleDateString('ar-EG')}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" style={{ zoom: '80%' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">إدارة جميع طلبات العملاء</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={exportOrders}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            <FiDownload className="w-4 h-4" />
            تصدير
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <FiRefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="البحث برقم الطلب أو البريد الإلكتروني أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="processing">قيد المعالجة</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="refunded">مسترد</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table - Desktop View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  رقم الطلب
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  اللعبة
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الحزمة
                </th>
                <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  معلومات الحساب
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  المبلغ الإجمالي
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  حالة الدفع
                </th>
                <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{order.id}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{order.userName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {typeof order.userId === 'object' ? order.userId.email : order.userEmail}
                      </div>
                      {typeof order.userId === 'object' && order.userId.phone && (
                        <div className="text-xs text-gray-400">{order.userId.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.gameId?.name || 'غير محدد'}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.packageId?.title || 'غير محدد'}
                  </td>
                  <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                    {order.accountInfo && order.accountInfo.length > 0 ? (
                      <div className="text-xs">
                        {order.accountInfo.map((info, index) => (
                          <div key={info._id} className="mb-1">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{info.fieldName}:</span>
                            <span className="text-gray-900 dark:text-white ml-1">{info.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">لا توجد معلومات</span>
                    )}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 xl:gap-2">
                      {order.status === 'delivered' && (
                        <FiCheck className="w-4 h-4 text-green-500" />
                      )}
                      {order.status === 'pending' && (
                        <FiClock className="w-4 h-4 text-yellow-500" />
                      )}
                      {order.status === 'processing' && (
                        <FiRefreshCw className="w-4 h-4 text-blue-500" />
                      )}
                      {order.status === 'cancelled' && (
                        <FiX className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </td>
                  <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {order.paymentStatus === 'paid' && (
                        <FiCheck className="w-4 h-4 text-green-500" />
                      )}
                      {order.paymentStatus === 'pending' && (
                        <FiClock className="w-4 h-4 text-yellow-500" />
                      )}
                      {order.paymentStatus === 'failed' && (
                        <FiX className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </div>
                  </td>
                  <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-1 xl:gap-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="عرض التفاصيل"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      
                      {order.paymentStatus === 'paid' && order.status !== 'delivered' && order.status !== 'rejected' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="تأكيد التسليم"
                            disabled={loading}
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'rejected', 'تم إلغاء الطلب من قبل الإدارة')}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="إلغاء الطلب"
                            disabled={loading}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="تأكيد الدفع"
                          disabled={loading}
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات تطابق معايير البحث</p>
          </div>
        )}
      </div>

      {/* Orders Cards - Mobile & Tablet View */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            {/* Order Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">#{order.id}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {order.status === 'delivered' && <FiCheck className="w-4 h-4 text-green-500" />}
                {order.status === 'pending' && <FiClock className="w-4 h-4 text-yellow-500" />}
                {order.status === 'processing' && <FiRefreshCw className="w-4 h-4 text-blue-500" />}
                {order.status === 'cancelled' && <FiX className="w-4 h-4 text-red-500" />}
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العميل</h4>
              <div className="text-sm text-gray-900 dark:text-white">
                <div className="font-medium">{order.userName}</div>
                <div className="text-gray-500 dark:text-gray-400">
                  {typeof order.userId === 'object' ? order.userId.email : order.userEmail}
                </div>
                {typeof order.userId === 'object' && order.userId.phone && (
                  <div className="text-gray-400">{order.userId.phone}</div>
                )}
              </div>
            </div>

            {/* Game & Package Info */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اللعبة</h4>
                <p className="text-sm text-gray-900 dark:text-white">{order.gameId?.name || 'غير محدد'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحزمة</h4>
                <p className="text-sm text-gray-900 dark:text-white">{order.packageId?.title || 'غير محدد'}</p>
              </div>
            </div>

            {/* Account Info - Only on larger mobile screens */}
            <div className="sm:block hidden mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">معلومات الحساب</h4>
              {order.accountInfo && order.accountInfo.length > 0 ? (
                <div className="text-xs space-y-1">
                  {order.accountInfo.map((info) => (
                    <div key={info._id} className="flex">
                      <span className="font-medium text-gray-600 dark:text-gray-400 ml-2">{info.fieldName}:</span>
                      <span className="text-gray-900 dark:text-white">{info.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">لا توجد معلومات</span>
              )}
            </div>

            {/* Amount & Payment Status */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ الإجمالي</h4>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</p>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حالة الدفع</h4>
                <div className="flex items-center gap-1">
                  {order.paymentStatus === 'paid' && <FiCheck className="w-4 h-4 text-green-500" />}
                  {order.paymentStatus === 'pending' && <FiClock className="w-4 h-4 text-yellow-500" />}
                  {order.paymentStatus === 'failed' && <FiX className="w-4 h-4 text-red-500" />}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                    {paymentStatusLabels[order.paymentStatus]}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => viewOrderDetails(order)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
              >
                <FiEye className="w-4 h-4" />
                عرض التفاصيل
              </button>
              
              {order.paymentStatus === 'paid' && order.status !== 'delivered' && order.status !== 'rejected' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center"
                  title="تأكيد التسليم"
                  disabled={loading}
                >
                  <FiCheck className="w-4 h-4" />
                </button>
              )}
              
              {order.status !== 'rejected' && order.status !== 'delivered' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'rejected')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center"
                  title="رفض الطلب"
                  disabled={loading}
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
         ))}
       </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  تفاصيل الطلب #{selectedOrder.id}
                </h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">معلومات العميل</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-1 sm:space-y-2">
                    <p className="text-sm sm:text-base"><strong>الاسم:</strong> {selectedOrder.userName}</p>
                    <p className="text-sm sm:text-base break-all"><strong>البريد الإلكتروني:</strong> {typeof selectedOrder.userId === 'object' ? selectedOrder.userId.email : selectedOrder.userEmail}</p>
                    {typeof selectedOrder.userId === 'object' && selectedOrder.userId.phone && (
                      <p className="text-sm sm:text-base"><strong>رقم الهاتف:</strong> {selectedOrder.userId.phone}</p>
                    )}
                  </div>
                </div>
                
                {/* Game Info */}
                {selectedOrder.gameId && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">معلومات اللعبة</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base"><strong>اسم اللعبة:</strong> {selectedOrder.gameId.name}</p>
                    </div>
                  </div>
                )}
                
                {/* Package Info */}
                {selectedOrder.packageId && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">معلومات الحزمة</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base"><strong>عنوان الحزمة:</strong> {selectedOrder.packageId.title}</p>
                    </div>
                  </div>
                )}
                
                {/* Account Info */}
                {selectedOrder.accountInfo && selectedOrder.accountInfo.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">معلومات الحساب</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-1 sm:space-y-2">
                      {selectedOrder.accountInfo.map((info) => (
                        <p key={info._id} className="text-sm sm:text-base break-all"><strong>{info.fieldName}:</strong> {info.value}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Order Items */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">عناصر الطلب</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{item.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الكمية: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-sm sm:text-base">${item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">عنوان الشحن</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-1">
                      <p className="text-sm sm:text-base">{selectedOrder.shippingAddress.street}</p>
                      <p className="text-sm sm:text-base">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}</p>
                      <p className="text-sm sm:text-base">{selectedOrder.shippingAddress.postalCode}</p>
                    </div>
                  </div>
                )}
                
                {/* Order Summary */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">ملخص الطلب</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-sm sm:text-base">المبلغ الإجمالي:</span>
                      <span className="font-bold text-base sm:text-lg">${selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-sm sm:text-base">حالة الطلب:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedOrder.status]} w-fit`}>
                        {statusLabels[selectedOrder.status]}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-sm sm:text-base">حالة الدفع:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                        selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {selectedOrder.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-sm sm:text-base">تاريخ الإنشاء:</span>
                      <span className="text-sm sm:text-base">{new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                    {selectedOrder.paymentMethod && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-sm sm:text-base">طريقة الدفع:</span>
                        <span className="text-sm sm:text-base">{selectedOrder.paymentMethod}</span>
                      </div>
                    )}
                    {selectedOrder.adminNote && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                        <span className="text-sm sm:text-base">ملاحظة الإدارة:</span>
                        <span className="text-xs sm:text-sm break-words flex-1">{selectedOrder.adminNote}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-sm sm:text-base">حالة المراجعة:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                        selectedOrder.isReviewed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {selectedOrder.isReviewed ? 'تمت المراجعة' : 'لم تتم المراجعة'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                {selectedOrder.paymentStatus === 'paid' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'delivered');
                        setShowOrderModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                      disabled={loading}
                    >
                      تأكيد التسليم
                    </button>
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'cancelled');
                        setShowOrderModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                      disabled={loading}
                    >
                      إلغاء الطلب
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
      
      {/* Notification */}
      <NotificationToast />
    </div>
  );
}