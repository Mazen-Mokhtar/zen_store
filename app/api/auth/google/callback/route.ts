import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, getGoogleUserInfo, GoogleTokenResponse, GoogleUserInfo } from '@/lib/google-oauth';
import { logger } from '@/lib/utils';
import { sessionManager } from '@/lib/sessionManager';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      logger.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/signin?error=oauth_error', request.url));
    }

    if (!code) {
      logger.error('No authorization code received from Google');
      return NextResponse.redirect(new URL('/signin?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokenResponse: GoogleTokenResponse = await exchangeCodeForTokens(code);
    
    if (!tokenResponse.access_token) {
      logger.error('No access token received from Google');
      return NextResponse.redirect(new URL('/signin?error=no_token', request.url));
    }

    // Get user info from Google
    const userInfo: GoogleUserInfo = await getGoogleUserInfo(tokenResponse.access_token);
    
    if (!userInfo.email || !userInfo.verified_email) {
      logger.error('Email not verified or not provided by Google');
      return NextResponse.redirect(new URL('/signin?error=email_not_verified', request.url));
    }

    // Send user data to backend for registration/login
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Log the request being sent to backend
    logger.log('Sending request to backend:', `${API_BASE_URL}/auth/google-login`);
    logger.log('Request payload:', JSON.stringify({
      idToken: tokenResponse.id_token || 'mock_token'
    }, null, 2));
    
    const backendResponse = await fetch(`${API_BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: tokenResponse.id_token || 'mock_token'
      }),
    });

    const backendData = await backendResponse.json();

    // Log the complete backend response for debugging with delay
    setTimeout(() => {
      logger.log('=== GOOGLE OAUTH DEBUG LOGS ===');
      logger.log('Complete backend response:', JSON.stringify(backendData, null, 2));
      logger.log('Backend response status:', backendResponse.status);
      logger.log('Backend response ok:', backendResponse.ok);
      logger.log('=== END DEBUG LOGS ===');
    }, 1000);
    
    // Log the structure before extraction
    logger.log('backendData structure:', typeof backendData);
    logger.log('backendData.data exists:', !!backendData.data);
    logger.log('backendData.data keys:', backendData.data ? Object.keys(backendData.data) : 'no data');
    
    // Extract tokens and user data from the data property
    const { accessToken, refreshToken, user } = backendData.data || {};
    
    // Log immediately after extraction
    logger.log('Immediate extraction - accessToken:', typeof accessToken, accessToken ? 'exists' : 'null');
    logger.log('Immediate extraction - refreshToken:', typeof refreshToken, refreshToken ? 'exists' : 'null');
    logger.log('Immediate extraction - user:', typeof user, user ? 'exists' : 'null');

    if (!backendResponse.ok) {
      logger.error('Backend Google auth failed:', backendData);
      return NextResponse.redirect(new URL('/signin?error=backend_error', request.url));
    }

    // Log extracted data with delay
    setTimeout(() => {
      logger.log('=== EXTRACTED DATA DEBUG ===');
      logger.log('Extracted accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
      logger.log('Extracted refreshToken:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');
      logger.log('Extracted user:', user);
      logger.log('=== END EXTRACTED DATA DEBUG ===');
    }, 1200);

    if (!accessToken) {
      logger.error('No access token received from backend');
      return NextResponse.redirect(new URL('/signin?error=no_backend_token', request.url));
    }

    // Log before setting cookies
    logger.log('Setting cookies - accessToken length:', accessToken?.length || 0);
    logger.log('Setting cookies - refreshToken available:', !!refreshToken);
    
    // Set secure httpOnly cookies
    const cookieStore = await cookies();
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    
    logger.log('Auth token cookie has been set');

    // Set refresh token cookie if available
    if (refreshToken) {
      cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      logger.log('Refresh token cookie has been set');
    }

    // Create session in sessionManager
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const sessionResult = await sessionManager.createSession({
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role || 'user',
      ipAddress: clientIP,
      userAgent: userAgent
    });

    if (sessionResult) {
      // Set session cookie
      cookieStore.set('session', sessionResult.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: Math.floor((sessionResult.expiresAt - Date.now()) / 1000),
        path: '/'
      });
      logger.log('Session cookie has been set');
    }

    // Log cookie setting with delay
    setTimeout(() => {
      logger.log('=== COOKIE SETTING DEBUG ===');
      logger.log('Auth token cookie set:', !!accessToken);
      logger.log('Refresh token cookie set:', !!refreshToken);
      logger.log('User data available:', !!user);
      logger.log('=== END COOKIE DEBUG ===');
    }, 1500);

    // Redirect based on user role
    let redirectUrl = '/category'; // Default redirect
    
    if (user?.role === 'admin') {
      redirectUrl = '/admin';
    }

    // Check for return URL in state or session
    const returnUrl = searchParams.get('state');
    if (returnUrl && returnUrl.startsWith('/')) {
      redirectUrl = decodeURIComponent(returnUrl);
    }

    logger.log('Google OAuth login successful for user:', user?.email);
    
    // Add user data as URL parameter (encoded) so it can be saved on the client side
    const userDataParam = encodeURIComponent(JSON.stringify(user));
    const separator = redirectUrl.includes('?') ? '&' : '?';
    const finalRedirectUrl = `${redirectUrl}${separator}success=google_login&userData=${userDataParam}`;
    
    return NextResponse.redirect(new URL(finalRedirectUrl, request.url));

  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/signin?error=oauth_callback_error', request.url));
  }
}