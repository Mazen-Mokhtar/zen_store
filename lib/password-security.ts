import bcrypt from 'bcrypt';
import { logger } from './utils';

/**
 * Password security utilities using bcrypt for secure hashing
 */
export class PasswordSecurity {
  private static readonly SALT_ROUNDS = 12; // High security level
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * Hash a password securely using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      // Validate password length
      if (password.length < this.MIN_PASSWORD_LENGTH) {
        throw new Error('Password too short');
      }
      
      if (password.length > this.MAX_PASSWORD_LENGTH) {
        throw new Error('Password too long');
      }

      // Generate salt and hash password
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.info('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      if (isValid) {
        logger.info('Password verification successful');
      } else {
        logger.warn('Password verification failed - invalid password');
      }
      
      return isValid;
    } catch (error) {
      logger.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Check if password needs rehashing (for security upgrades)
   */
  static async needsRehash(hashedPassword: string): Promise<boolean> {
    try {
      // Check if the hash was created with current salt rounds
      const rounds = bcrypt.getRounds(hashedPassword);
      return rounds < this.SALT_ROUNDS;
    } catch (error) {
      logger.error('Hash check failed:', error);
      return true; // Assume rehash needed if check fails
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= this.MIN_PASSWORD_LENGTH) {
      score += 1;
    } else {
      feedback.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    // Common password patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      score -= 2;
      feedback.push('Password contains common patterns and is not secure');
    }

    return {
      isValid: score >= 4,
      score: Math.max(0, score),
      feedback
    };
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // Ensure at least one character from each required category
    const categories = [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      '!@#$%^&*()_+-=[]{}|;:,.<>?'
    ];
    
    // Add one character from each category
    categories.forEach(category => {
      const randomIndex = Math.floor(Math.random() * category.length);
      password += category[randomIndex];
    });
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Securely clear password from memory (best effort)
   */
  static clearPassword(password: string): void {
    // Note: This is a best-effort approach in JavaScript
    // True memory clearing is not guaranteed in JavaScript
    try {
      if (typeof password === 'string') {
        // Overwrite the string content (limited effectiveness in JS)
        for (let i = 0; i < password.length; i++) {
          (password as any)[i] = '\0';
        }
      }
    } catch (error) {
      // Silently handle any errors in memory clearing
    }
  }
}

// Export convenience functions
export const hashPassword = PasswordSecurity.hashPassword;
export const verifyPassword = PasswordSecurity.verifyPassword;
export const validatePasswordStrength = PasswordSecurity.validatePasswordStrength;
export const generateSecurePassword = PasswordSecurity.generateSecurePassword;