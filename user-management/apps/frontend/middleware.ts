import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const SESSION_COOKIE = 'betx_session';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Pages that don't require authentication
const publicPages = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware: Processing request for:', pathname);
  
  // Allow API routes (including auth APIs)
  if (pathname.startsWith('/api/')) {
    console.log('✅ Middleware: Allowing API route:', pathname);
    return NextResponse.next();
  }
  
  // Allow static files and Next.js internal routes
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/public/')) {
    console.log('✅ Middleware: Allowing static file:', pathname);
    return NextResponse.next();
  }
  
  // Allow public pages
  if (publicPages.includes(pathname)) {
    console.log('✅ Middleware: Allowing public page:', pathname);
    return NextResponse.next();
  }

  // Only check authentication for actual page requests (not API calls, not static files)
  // This prevents the middleware from running on every single request
  if (pathname.includes('.') || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    console.log('✅ Middleware: Skipping non-page request:', pathname);
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  console.log('🍪 Middleware: Session cookie found:', sessionCookie ? 'Yes' : 'No');
  console.log('🍪 Middleware: All cookies:', request.cookies.getAll().map(c => c.name));
  
  if (!sessionCookie) {
    // No session cookie, redirect to login
    console.log('❌ Middleware: No session cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the session token using jose (Edge Runtime compatible)
    console.log('🔐 Middleware: Verifying session token...');
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(sessionCookie.value, secret);
    console.log('✅ Middleware: Token verified successfully');
    
    // If token is valid, allow the request
    if (payload) {
      console.log('✅ Middleware: Valid session, allowing access to:', pathname);
      return NextResponse.next();
    }
  } catch (error) {
    // Invalid or expired token, redirect to login
    console.log('❌ Middleware: Invalid session token, redirecting to login. Error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Fallback: redirect to login
  console.log('❌ Middleware: Fallback redirect to login');
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 