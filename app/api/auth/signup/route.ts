import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, email, phone, password, cPassword } = body;

    // Basic validation
    if (!userName || !email || !phone || !password || !cPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== cPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Forward to actual backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName, email, phone, password, cPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Signup failed' },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: data.data || {},
      message: data.message || 'Signup successful'
    });

  } catch (error) {
    logger.error('Signup API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}