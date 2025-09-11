# AI Assistant Prompt: Authentication & Error Handling for Wivz

## Project Overview
You are working on the Wivz e-commerce platform that consists of a Next.js frontend and a NestJS backend. The backend folder is **READ-ONLY** and should not be modified. Your task is to implement comprehensive authentication guards and JWT error handling for the frontend application.

## Current Architecture Analysis

### Authentication State Management
- **Auth Service Location**: `lib/auth.ts` - Singleton service managing authentication state
- **Storage**: Uses localStorage for `auth_token` and `auth_user`
- **Current Pages**: Orders page (`app/orders/page.tsx`) has basic auth checking but needs improvement
- **Existing Components**: 
  - `LoginRequiredModal` in `components/ui/login-required-modal.tsx`
  - `AuthStatus` component in `components/ui/auth-status.tsx`

### API Communication
- **API Service**: `lib/api.ts` contains API communication logic
- **Token Handling**: Currently sends token in both `Authorization` and `token` headers
- **Base URL**: Configured via `NEXT_PUBLIC_API_URL` with fallback to `http://localhost:3000`

## Critical Issues to Address

### 1. JWT Expiration Handling
**Problem**: The application doesn't properly handle JWT token expiration (401 responses from backend APIs)

**Required Implementation**:
- Intercept all API responses for 401/403 status codes
- Detect JWT expiration errors specifically
- Automatically clear expired tokens from localStorage
- Redirect users to login page with appropriate return URL
- Show user-friendly expiration messages

### 2. Route Protection
**Problem**: Protected routes (like `/orders`) can be accessed without authentication

**Required Implementation**:
- NON-NEGOTIABLE: Unauthenticated users must not see or access any protected page content. Immediately redirect to the login page (/signin) with a return URL; do not mount or render the protected page UI prior to redirect.
- Create a higher-order component (HOC) or custom hook for route protection
- Implement client-side route guards that check authentication before rendering
- Redirect unauthenticated users to login with return URL
- Show loading states during authentication checks

### 3. Session Management
**Problem**: No session cleanup or token refresh mechanism

**Required Implementation**:
- Implement session timeout handling
- Add token validity checking before API calls
- Clear invalid/expired sessions automatically
- Provide session extension mechanisms where appropriate

## Specific Modifications Required

### 1. Enhance API Service (`lib/api.ts`)
```typescript
// Add JWT expiration detection and handling
// Implement automatic token cleanup on 401 responses
// Add retry mechanism for failed requests due to expired tokens
// Create centralized error handling for authentication errors
```

### 2. Improve Auth Service (`lib/auth.ts`)
```typescript
// Add token validation methods
// Implement session timeout checking
// Add JWT payload parsing to check expiration
// Create automatic logout on token expiration
```

### 3. Create Authentication Guard
```typescript
// New file: components/guards/AuthGuard.tsx
// Implement route protection component
// Handle loading states during auth checks
// Redirect logic for unauthenticated users
```

### 4. Update Orders Page (`app/orders/page.tsx`)
```typescript
// Implement proper authentication guard usage
// Add JWT expiration error handling
// Improve error states and user feedback
// Handle authentication state changes properly
```

### 5. Error Handling Improvements
```typescript
// Update error components to handle auth-specific errors
// Add user-friendly messages for JWT expiration
// Implement retry mechanisms for authentication failures
```

## Implementation Guidelines

### Authentication Flow
1. **Page Load**: Check if user is authenticated and token is valid
2. **API Calls**: Automatically handle 401 responses by clearing auth and redirecting
3. **Route Navigation**: Protect routes before rendering content
4. **Session Expiry**: Show appropriate messages and provide re-login options

### Error Handling Strategy
- **401 Unauthorized**: Clear session, redirect to login with return URL
- **403 Forbidden**: Show access denied message, don't clear session
- **Network Errors**: Show retry options, maintain current session
- **JWT Malformed**: Clear session, show security alert

### User Experience Requirements
- Seamless authentication state management
- Clear feedback for authentication issues
- Preserve user intent with return URLs
- Loading states during authentication checks
- Graceful degradation for expired sessions
- STRICT UI CONSTRAINT: Do NOT change or redesign any page UI. Keep existing layout and styling intact; only add guards/redirect logic without altering the design.

### Security Considerations
- Never expose sensitive token information in console logs
- Clear all auth data on logout/expiration
- Validate tokens before each protected operation
- Implement proper CORS handling for API requests

## Backend Integration Notes
- Backend is in `backend/` folder and is **READ-ONLY**
- Backend uses JWT tokens for authentication
- API endpoints require valid JWT in Authorization header
- Backend returns 401 for expired/invalid tokens
- Order endpoints specifically require authentication

## Testing Requirements
- Test authentication guard on protected routes
- Verify JWT expiration handling across different scenarios
- Ensure proper cleanup of authentication state
- Test return URL functionality after login
- Validate error messages are user-friendly

## Success Criteria
1. Users cannot access `/orders` without valid authentication
2. Expired JWT tokens are handled gracefully with proper user feedback
3. Authentication state is properly managed across browser sessions
4. All API errors related to authentication are handled appropriately
5. User experience remains smooth during authentication state transitions

Remember: Focus on frontend security and user experience. Do not change the existing page design/UI; only add guards and redirects as needed. The backend authentication logic should not be modified.