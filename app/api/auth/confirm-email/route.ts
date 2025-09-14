import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Basic validation
    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and confirmation code are required' },
        { status: 400 }
      );
    }

    // Forward to actual backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/auth/confirm-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Email confirmation failed:', {
        status: response.status,
        message: data.message,
        email: email
      });
      
      return NextResponse.json(
        { success: false, message: data.message || 'فشل في تأكيد البريد الإلكتروني' },
        { status: response.status }
      );
    }

    logger.info('Email confirmation successful:', { email });

    // Return success response
    return NextResponse.json({
      success: true,
      data: data.data || {},
      message: data.message || 'تم تأكيد البريد الإلكتروني بنجاح'
    });

  } catch (error) {
    logger.error('Email confirmation error:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}