import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const referer = headersList.get('referer') || '';
    
    let performanceData = {};
    try {
      const text = await request.text();
      if (text) {
        performanceData = JSON.parse(text);
      }
    } catch (parseError) {
      // Handle empty or invalid JSON
      console.log('No valid JSON data in request body');
    }
    
    // Log performance data (in production, you'd send this to your monitoring service)
    console.log('Performance Metrics:', {
      timestamp: new Date().toISOString(),
      userAgent,
      referer,
      metrics: performanceData
    });
    
    // In production, you would:
    // - Validate the performance data
    // - Send to performance monitoring service (New Relic, DataDog, etc.)
    // - Store in time-series database
    // - Set up alerts for performance degradation
    
    return NextResponse.json({ success: true, message: 'Performance data received' }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Performance API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process performance data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Performance monitoring API is running',
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'CDN-Cache-Control': 'public, s-maxage=60'
    }
  });
}