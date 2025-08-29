import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '../../../../lib/google-oauth';
import { logger } from '../../../../lib/utils';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/category';
    
    // Validate returnUrl for security
    let validatedReturnUrl = '/category';
    if (returnUrl && typeof returnUrl === 'string') {
      // Ensure returnUrl is safe (starts with / and doesn't contain external URLs)
      if (returnUrl.startsWith('/') && !returnUrl.includes('//') && returnUrl.length < 200) {
        validatedReturnUrl = returnUrl;
      }
    }
    
    // Generate Google OAuth URL with CSRF protection
    const authUrl = getGoogleAuthUrl();
    
    logger.info('Redirecting to Google OAuth with CSRF protection');
    
    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    logger.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnUrl } = body;
    
    // Validate returnUrl for security
    let validatedReturnUrl = '/category';
    if (returnUrl && typeof returnUrl === 'string') {
      // Ensure returnUrl is safe (starts with / and doesn't contain external URLs)
      if (returnUrl.startsWith('/') && !returnUrl.includes('//') && returnUrl.length < 200) {
        validatedReturnUrl = returnUrl;
      }
    }
    
    // Generate Google OAuth URL with CSRF protection
    const authUrl = getGoogleAuthUrl();
    
    return NextResponse.json({
      success: true,
      data: {
        authUrl: authUrl
      }
    });
    
  } catch (error) {
    logger.error('Google OAuth URL generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate Google OAuth URL' },
      { status: 500 }
    );
  }
}