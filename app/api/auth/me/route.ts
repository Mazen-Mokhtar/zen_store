import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const authToken = cookieStore.get('auth_token')?.value;

    console.log('🔍 /api/auth/me: Checking cookies');
    console.log('Session token:', sessionToken ? 'exists' : 'missing');
    console.log('Auth token:', authToken ? 'exists' : 'missing');

    // If we have a session token, validate it first
    if (sessionToken) {
      // Import session manager to validate session
      const { sessionManager } = await import('@/lib/sessionManager');
      
      try {
        const sessionData = await sessionManager.validateSession(sessionToken);
        if (sessionData) {
          console.log('✅ Valid session found');
          return NextResponse.json({
            success: true,
            user: {
              id: sessionData.userId,
              email: sessionData.email,
              name: sessionData.name,
              role: sessionData.role
            }
          });
        }
      } catch (sessionError) {
        console.log('❌ Session validation failed:', sessionError);
      }
    }

    // Fallback to auth_token validation
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Decode JWT token to extract user information
    try {
      // Remove "user " prefix if it exists (from Google OAuth response)
      const cleanToken = authToken.startsWith('user ') ? authToken.substring(5) : authToken;
      
      const tokenParts = cleanToken.split('.');
      if (tokenParts.length !== 3) {
        logger.error('Invalid token format. Token parts:', tokenParts.length, 'Original token:', authToken);
        return NextResponse.json(
          { success: false, message: 'Invalid token format' },
          { status: 401 }
        );
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return NextResponse.json(
          { success: false, message: 'Token expired' },
          { status: 401 }
        );
      }

      // Extract user information from token payload
      const user = {
        id: payload.userId,
        role: payload.role,
        // We'll need to get additional user info from backend if needed
      };

      // Optionally, fetch additional user details from backend
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      try {
        // Backend expects token format: "user {token}" or "admin {token}" based on role
        const userRole = payload.role || 'user';
        const backendResponse = await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `${userRole} ${cleanToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          const fullUser = backendData.data || backendData;
          
          return NextResponse.json({
            success: true,
            data: {
              user: {
                id: fullUser._id || fullUser.id || payload.userId,
                email: fullUser.email,
                name: fullUser.userName || fullUser.name,
                role: fullUser.role || payload.role,
                profileImage: fullUser.profileImage?.secure_url || fullUser.profileImage
              }
            }
          });
        } else {
          // If backend call fails, return basic user info from token
          return NextResponse.json({
            success: true,
            data: {
              user: {
                id: payload.userId,
                role: payload.role,
                email: null,
                name: null,
                profileImage: null
              }
            }
          });
        }
      } catch (backendError) {
        logger.warn('Failed to fetch user details from backend:', backendError);
        
        // Return basic user info from token if backend is unavailable
        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: payload.userId,
              role: payload.role,
              email: null,
              name: null,
              profileImage: null
            }
          }
        });
      }

    } catch (decodeError) {
      logger.error('Failed to decode JWT token:', decodeError);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    logger.error('Auth me endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}