import { NextResponse } from 'next/server';

// Add dynamic export to prevent static prerendering
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const body = await request.json().catch(() => undefined);

    // Read auth headers from incoming request and forward them
    const incoming = new Headers(request.headers);
    const authHeader = incoming.get('authorization');
    const tokenHeader = incoming.get('token');

    const outHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authHeader) outHeaders['Authorization'] = authHeader;
    if (tokenHeader) outHeaders['token'] = tokenHeader;

    // Log the outgoing request
    console.log('📤 Forwarding order request to:', `${API_BASE_URL}/order`, {
      hasAuthorization: !!authHeader,
      hasTokenHeader: !!tokenHeader,
    });

    const response = await fetch(`${API_BASE_URL}/order`, {
      method: 'POST',
      headers: outHeaders,
      body: JSON.stringify(body ?? {}),
      // Configure the agent to handle proxy if needed
      // @ts-ignore - Node.js specific property
      agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.text().catch(() => ({}));
      console.error('❌ Error from API:', response.status, response.statusText, errorData);
      return NextResponse.json(
        { error: 'Failed to create order', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error in order API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
export async function GET(request: Request) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const incoming = new Headers(request.headers);
    const authHeader = incoming.get('authorization');
    const tokenHeader = incoming.get('token');

    const outHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (authHeader) outHeaders['Authorization'] = authHeader;
    if (tokenHeader) outHeaders['token'] = tokenHeader;

    const response = await fetch(`${API_BASE_URL}/order`, {
      method: 'GET',
      headers: outHeaders,
      // @ts-ignore
      agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
