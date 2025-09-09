import { sanitizeInput, isValidEmail } from './security';
import { OrderStatus } from '@/components/admin/orders/types';

/**
 * Comprehensive validation utilities for admin orders functionality
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export interface OrderValidationRules {
  orderNumber: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
  customerName: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  customerEmail: {
    required: boolean;
    validateEmail: boolean;
  };
  total: {
    required: boolean;
    min: number;
    max: number;
  };
  status: {
    required: boolean;
    allowedValues: OrderStatus[];
  };
  adminNote: {
    required: boolean;
    maxLength: number;
  };
}

export const DEFAULT_ORDER_VALIDATION_RULES: OrderValidationRules = {
  orderNumber: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9-]+$/i
  },
  customerName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  customerEmail: {
    required: true,
    validateEmail: true
  },
  total: {
    required: true,
    min: 0,
    max: 1000000
  },
  status: {
    required: true,
    allowedValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as OrderStatus[]
  },
  adminNote: {
    required: false,
    maxLength: 500
  }
};

/**
 * Validates and sanitizes order number
 */
export function validateOrderNumber(orderNumber: string, rules = DEFAULT_ORDER_VALIDATION_RULES.orderNumber): ValidationResult {
  const errors: string[] = [];
  
  if (!orderNumber || typeof orderNumber !== 'string') {
    if (rules.required) {
      errors.push('رقم الطلب مطلوب');
    }
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(orderNumber.trim());
  
  if (sanitized.length < rules.minLength) {
    errors.push(`رقم الطلب يجب أن يكون على الأقل ${rules.minLength} أحرف`);
  }
  
  if (sanitized.length > rules.maxLength) {
    errors.push(`رقم الطلب يجب أن لا يزيد عن ${rules.maxLength} حرف`);
  }
  
  if (!rules.pattern.test(sanitized)) {
    errors.push('رقم الطلب يحتوي على أحرف غير مسموحة');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates and sanitizes customer name
 */
export function validateCustomerName(name: string, rules = DEFAULT_ORDER_VALIDATION_RULES.customerName): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    if (rules.required) {
      errors.push('اسم العميل مطلوب');
    }
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(name.trim());
  
  if (sanitized.length < rules.minLength) {
    errors.push(`اسم العميل يجب أن يكون على الأقل ${rules.minLength} أحرف`);
  }
  
  if (sanitized.length > rules.maxLength) {
    errors.push(`اسم العميل يجب أن لا يزيد عن ${rules.maxLength} حرف`);
  }
  
  // Check for suspicious patterns
  if (/[<>"'&\/\\]/.test(sanitized)) {
    errors.push('اسم العميل يحتوي على أحرف غير مسموحة');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates and sanitizes customer email
 */
export function validateCustomerEmail(email: string, rules = DEFAULT_ORDER_VALIDATION_RULES.customerEmail): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    if (rules.required) {
      errors.push('البريد الإلكتروني للعميل مطلوب');
    }
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(email.trim().toLowerCase());
  
  if (rules.validateEmail && !isValidEmail(sanitized)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates order total amount
 */
export function validateOrderTotal(total: number | string, rules = DEFAULT_ORDER_VALIDATION_RULES.total): ValidationResult {
  const errors: string[] = [];
  
  if (total === null || total === undefined) {
    if (rules.required) {
      errors.push('مجموع الطلب مطلوب');
    }
    return { isValid: false, errors };
  }

  const numericTotal = typeof total === 'string' ? parseFloat(total) : total;
  
  if (isNaN(numericTotal)) {
    errors.push('مجموع الطلب يجب أن يكون رقم صحيح');
    return { isValid: false, errors };
  }
  
  if (numericTotal < rules.min) {
    errors.push(`مجموع الطلب يجب أن يكون على الأقل ${rules.min}`);
  }
  
  if (numericTotal > rules.max) {
    errors.push(`مجموع الطلب يجب أن لا يزيد عن ${rules.max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: numericTotal
  };
}

/**
 * Validates order status
 */
export function validateOrderStatus(status: string, rules = DEFAULT_ORDER_VALIDATION_RULES.status): ValidationResult {
  const errors: string[] = [];
  
  if (!status || typeof status !== 'string') {
    if (rules.required) {
      errors.push('حالة الطلب مطلوبة');
    }
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(status.trim().toLowerCase()) as OrderStatus;
  
  if (!rules.allowedValues.includes(sanitized)) {
    errors.push('حالة الطلب غير صحيحة');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates admin note
 */
export function validateAdminNote(note: string, rules = DEFAULT_ORDER_VALIDATION_RULES.adminNote): ValidationResult {
  const errors: string[] = [];
  
  if (!note || typeof note !== 'string') {
    if (rules.required) {
      errors.push('ملاحظة الإدارة مطلوبة');
    }
    return { isValid: true, errors, sanitizedValue: '' };
  }

  const sanitized = sanitizeInput(note.trim());
  
  if (sanitized.length > rules.maxLength) {
    errors.push(`ملاحظة الإدارة يجب أن لا تزيد عن ${rules.maxLength} حرف`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates pagination parameters
 */
export function validatePaginationParams(page: number | string, itemsPerPage: number | string): ValidationResult {
  const errors: string[] = [];
  
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const itemsNum = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : itemsPerPage;
  
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('رقم الصفحة يجب أن يكون رقم صحيح أكبر من 0');
  }
  
  if (isNaN(itemsNum) || itemsNum < 1 || itemsNum > 100) {
    errors.push('عدد العناصر في الصفحة يجب أن يكون بين 1 و 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: { page: Math.max(1, pageNum), itemsPerPage: Math.min(100, Math.max(1, itemsNum)) }
  };
}

/**
 * Validates search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  
  if (!query || typeof query !== 'string') {
    return { isValid: true, errors, sanitizedValue: '' };
  }

  const sanitized = sanitizeInput(query.trim());
  
  if (sanitized.length > 100) {
    errors.push('استعلام البحث يجب أن لا يزيد عن 100 حرف');
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /('|(\-\-)|(;)|(\|)|(\*)|(%))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('استعلام البحث يحتوي على أحرف غير مسموحة');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates date range for filtering
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const errors: string[] = [];
  
  if (!startDate && !endDate) {
    return { isValid: true, errors, sanitizedValue: { startDate: null, endDate: null } };
  }
  
  let start: Date | null = null;
  let end: Date | null = null;
  
  if (startDate) {
    start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.push('تاريخ البداية غير صحيح');
    }
  }
  
  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.push('تاريخ النهاية غير صحيح');
    }
  }
  
  if (start && end && start > end) {
    errors.push('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
  }
  
  // Check if dates are not too far in the future
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
  
  if (start && start > maxFutureDate) {
    errors.push('تاريخ البداية لا يمكن أن يكون في المستقبل البعيد');
  }
  
  if (end && end > maxFutureDate) {
    errors.push('تاريخ النهاية لا يمكن أن يكون في المستقبل البعيد');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: { startDate: start, endDate: end }
  };
}

/**
 * Comprehensive order validation
 */
export function validateOrder(orderData: any, rules = DEFAULT_ORDER_VALIDATION_RULES): ValidationResult {
  const errors: string[] = [];
  const sanitizedOrder: any = {};
  
  // Validate order number
  const orderNumberResult = validateOrderNumber(orderData.orderNumber, rules.orderNumber);
  if (!orderNumberResult.isValid) {
    errors.push(...orderNumberResult.errors);
  } else {
    sanitizedOrder.orderNumber = orderNumberResult.sanitizedValue;
  }
  
  // Validate customer name
  const customerNameResult = validateCustomerName(orderData.customerName, rules.customerName);
  if (!customerNameResult.isValid) {
    errors.push(...customerNameResult.errors);
  } else {
    sanitizedOrder.customerName = customerNameResult.sanitizedValue;
  }
  
  // Validate customer email
  const customerEmailResult = validateCustomerEmail(orderData.customerEmail, rules.customerEmail);
  if (!customerEmailResult.isValid) {
    errors.push(...customerEmailResult.errors);
  } else {
    sanitizedOrder.customerEmail = customerEmailResult.sanitizedValue;
  }
  
  // Validate total
  const totalResult = validateOrderTotal(orderData.total, rules.total);
  if (!totalResult.isValid) {
    errors.push(...totalResult.errors);
  } else {
    sanitizedOrder.total = totalResult.sanitizedValue;
  }
  
  // Validate status
  const statusResult = validateOrderStatus(orderData.status, rules.status);
  if (!statusResult.isValid) {
    errors.push(...statusResult.errors);
  } else {
    sanitizedOrder.status = statusResult.sanitizedValue;
  }
  
  // Validate admin note if provided
  if (orderData.adminNote !== undefined) {
    const adminNoteResult = validateAdminNote(orderData.adminNote, rules.adminNote);
    if (!adminNoteResult.isValid) {
      errors.push(...adminNoteResult.errors);
    } else {
      sanitizedOrder.adminNote = adminNoteResult.sanitizedValue;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedOrder
  };
}

/**
 * Rate limiting validation for API calls
 */
export function validateRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  
  // Get stored data from sessionStorage (in a real app, use Redis or similar)
  const stored = sessionStorage.getItem(key);
  let requestData = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
  
  // Reset if window has expired
  if (now > requestData.resetTime) {
    requestData = { count: 1, resetTime: now + windowMs };
  } else {
    requestData.count++;
  }
  
  // Store updated data
  sessionStorage.setItem(key, JSON.stringify(requestData));
  
  return requestData.count <= maxRequests;
}

/**
 * Validates file upload for order attachments
 */
export function validateFileUpload(file: File): ValidationResult {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('لم يتم اختيار ملف');
    return { isValid: false, errors };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('حجم الملف يجب أن لا يزيد عن 5 ميجابايت');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('نوع الملف غير مدعوم');
  }
  
  // Sanitize file name
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: { ...file, name: sanitizedName }
  };
}

/**
 * Export validation utilities
 */
export const orderValidation = {
  validateOrderNumber,
  validateCustomerName,
  validateCustomerEmail,
  validateOrderTotal,
  validateOrderStatus,
  validateAdminNote,
  validatePaginationParams,
  validateSearchQuery,
  validateDateRange,
  validateOrder,
  validateRateLimit,
  validateFileUpload
};

export default orderValidation;