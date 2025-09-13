import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const referer = headersList.get('referer') || '';
    
    let errorData = {};
    try {
      const text = await request.text();
      if (text) {
        errorData = JSON.parse(text);
      }
    } catch (parseError) {
      // Handle empty or invalid JSON
      console.log('No valid JSON data in request body');
    }
    
    // Log error data (in production, you'd send this to your error tracking service)
    console.error('Error Tracking:', {
      timestamp: new Date().toISOString(),
      userAgent,
      referer,
      error: errorData
    });
    
    // In production, you would:
    // - Validate the error data
    // - Send to error tracking service (Sentry, Bugsnag, etc.)
    // - Store in database for analysis
    // - Alert on critical errors
    
    return NextResponse.json({ success: true, message: 'Error data received' });
  } catch (error) {
    console.error('Error API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process error data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Error tracking API is running',
    timestamp: new Date().toISOString()
  });
}