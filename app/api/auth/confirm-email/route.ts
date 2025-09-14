import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils';
import { sanitizeInput, isValidEmail } from '@/lib/security';
import { withEnhancedErrorHandling } from '@/middleware/errorMiddleware';

export const dynamic = "force-dynamic";

export const POST = withEnhancedErrorHandling(async (request: NextRequest) => {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    const body = await request.json();
    const { email, code } = body;

    // Enhanced validation
    if (!email || !code) {
      logger.warn('Missing email or code in confirmation request', { ip });
      return NextResponse.json(
        { success: false, message: 'Email and confirmation code are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      logger.warn('Invalid email format in confirmation request', { email: email.substring(0, 5) + '***', ip });
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sanitize and validate code
    const sanitizedCode = sanitizeInput(code);
    if (!sanitizedCode || sanitizedCode.length < 4 || sanitizedCode.length > 10) {
      logger.warn('Invalid confirmation code format', { ip });
      return NextResponse.json(
        { success: false, message: 'Invalid confirmation code format' },
        { status: 400 }
      );
    }

    // Forward to actual backend with sanitized data
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/auth/confirm-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'User-Agent': request.headers.get('user-agent') || 'unknown'
      },
      body: JSON.stringify({ 
        email: sanitizeInput(email), 
        code: sanitizedCode 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Email confirmation failed:', {
        status: response.status,
        message: data.message,
        email: email.substring(0, 5) + '***', // Don't log full email
        ip
      });
      
      return NextResponse.json(
        { success: false, message: data.message || 'فشل في تأكيد البريد الإلكتروني' },
        { status: response.status }
      );
    }

    logger.info('Email confirmation successful:', { 
      email: email.substring(0, 5) + '***', // Don't log full email
      ip 
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: data.data || {},
      message: data.message || 'تم تأكيد البريد الإلكتروني بنجاح'
    });

  } catch (error) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.error('Email confirmation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip
    });
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}, {
  validateRequest: true,
  performSecurityChecks: true,
  requireAuth: false
});