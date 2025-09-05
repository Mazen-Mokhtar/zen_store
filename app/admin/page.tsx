'use client';

import { useState, useEffect } from 'react';
import { FiShoppingCart, FiUsers, FiDollarSign, FiTrendingUp, FiClock, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;

  totalRevenue: number;
  totalUsers: number;
  recentOrders: {
    id: string;
    userName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
}

const mockStats: DashboardStats = {
  totalOrders: 156,
  pendingOrders: 23,
  completedOrders: 118,

  totalRevenue: 12450.75,
  totalUsers: 89,
  recentOrders: [
    {
      id: '1',
      userName: 'أحمد محمد',
      totalAmount: 109.98,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      userName: 'فاطمة علي',
      totalAmount: 39.99,
      status: 'processing',
      createdAt: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      userName: 'محمد حسن',
      totalAmount: 59.98,
      status: 'completed',
      createdAt: '2024-01-13T09:20:00Z'
    },
    {
      id: '4',
      userName: 'سارة أحمد',
      totalAmount: 79.99,
      status: 'pending',
      createdAt: '2024-01-12T14:15:00Z'
    },
    {
      id: '5',
      userName: 'عمر خالد',
      totalAmount: 149.97,
      status: 'completed',
      createdAt: '2024-01-11T11:30:00Z'
    }
  ]
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',

};

const statusLabels = {
  pending: 'في الانتظار',
  processing: 'قيد المعالجة',
  completed: 'مكتمل',

};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // التحقق من صلاحيات الإدارة من خلال API
        const profileResponse = await fetch('/api/user/profile/admin', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!profileResponse.ok) {
          window.location.replace('/404');
          return;
        }

        const userData = await profileResponse.json();
        
        // التحقق من وجود المستخدم والصلاحيات
        // API يُرجع البيانات بتنسيق {success: true, data: {user data}}
        const user = userData.success ? userData.data : userData.user;
        if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
          window.location.replace('/404');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        // في حالة أي خطأ، إخفاء الصفحة
        console.error('خطأ في التحقق من الصلاحيات:', error);
        window.location.replace('/404');
      }
    };

    checkUserRole();
  }, [router]);

  // عرض شاشة تحميل أثناء التحقق من الصلاحيات
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  const refreshData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, fetch fresh data from API
      setStats(mockStats);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
          <p className="text-gray-600 dark:text-gray-400">نظرة عامة على أداء المتجر</p>
        </div>
        
        <button
          onClick={refreshData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon={FiShoppingCart}
          color="bg-blue-500"
          onClick={() => router.push('/admin/orders')}
        />
        
        <StatCard
          title="الطلبات المعلقة"
          value={stats.pendingOrders}
          icon={FiClock}
          color="bg-yellow-500"
          onClick={() => router.push('/admin/orders?status=pending')}
        />
        
        <StatCard
          title="الطلبات المكتملة"
          value={stats.completedOrders}
          icon={FiCheck}
          color="bg-green-500"
          onClick={() => router.push('/admin/orders?status=completed')}
        />
        
        <StatCard
          title="إجمالي الإيرادات"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={FiDollarSign}
          color="bg-purple-500"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.totalUsers}
          icon={FiUsers}
          color="bg-indigo-500"
        />
        

        
        <StatCard
          title="معدل النمو"
          value="+12.5%"
          icon={FiTrendingUp}
          color="bg-teal-500"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">الطلبات الأخيرة</h2>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              عرض الكل
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  رقم الطلب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  التاريخ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push(`/admin/orders?highlight=${order.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">إجراءات سريعة</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/orders?status=pending')}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiClock className="w-5 h-5 text-yellow-500" />
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">الطلبات المعلقة</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stats.pendingOrders} طلب</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/admin/orders')}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiShoppingCart className="w-5 h-5 text-blue-500" />
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">جميع الطلبات</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">إدارة شاملة</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiUsers className="w-5 h-5 text-indigo-500" />
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">المستخدمين</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalUsers} مستخدم</p>
            </div>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw className="w-5 h-5 text-green-500" />
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">تحديث البيانات</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">تحديث فوري</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}