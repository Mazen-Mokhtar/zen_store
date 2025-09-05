export const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
};

export const statusLabels = {
  pending: 'في الانتظار',
  paid: 'مدفوع',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
  processing: 'قيد المعالجة'
};

export const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

export const paymentStatusLabels = {
  pending: 'معلق',
  paid: 'مدفوع',
  failed: 'فشل',
  refunded: 'مسترد'
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'pending', label: 'في الانتظار' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'rejected', label: 'مرفوض' }
];