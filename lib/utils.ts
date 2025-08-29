import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid MongoDB ObjectId (24 hex characters)
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Generate WhatsApp purchase link with formatted message
 */
export function generateWhatsAppPurchaseLink(game: { name: string; price?: number; description?: string; category?: string }): string {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201010666002';
  
  const message = `مرحباً! 🌟

أريد شراء اللعبة التالية:

🎮 اسم اللعبة: ${game.name}
${game.price ? `💰 السعر: ${game.price} EGP` : ''}
${game.description ? `📝 الوصف: ${game.description}` : ''}
${game.category ? `📂 الفئة: ${game.category}` : ''}

هل يمكنني الحصول على مزيد من التفاصيل حول عملية الشراء؟`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
}

/**
 * Decode JWT token to extract user data
 */
export function decodeJWT(token: string): any {
  try {
    // Remove 'admin ' prefix if it exists
    const cleanToken = token.replace(/^admin\s+/, '');
    
    // Split the token and get the payload
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode the payload (base64url)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Production-safe logger to replace console.log statements
 */
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Keep errors in production for debugging critical issues
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    }
  }
};