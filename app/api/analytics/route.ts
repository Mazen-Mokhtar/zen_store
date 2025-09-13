import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const referer = headersList.get('referer') || '';
    
    let data = {};
    try {
      const text = await request.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      // Handle empty or invalid JSON
      console.log('No valid JSON data in request body');
    }
    
    // Log analytics data (in production, you'd send this to your analytics service)
    console.log('Analytics Event:', {
      timestamp: new Date().toISOString(),
      userAgent,
      referer,
      data
    });
    
    // In production, you would:
    // - Validate the data
    // - Send to analytics service (Google Analytics, Mixpanel, etc.)
    // - Store in database if needed
    
    return NextResponse.json({ success: true, message: 'Analytics data received' }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process analytics data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Analytics API is running',
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'CDN-Cache-Control': 'public, s-maxage=60'
    }
  });
}