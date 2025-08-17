import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log('🔍 Middleware processing:', pathname);
  
  // Allow API routes and static files
  if (pathname.startsWith('/api/')) {
    console.log('✅ Allowing API route:', pathname);
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    console.log('✅ Allowing static file:', pathname);
    return NextResponse.next();
  }
  
  // Allow public pages
  if (pathname === '/login' || pathname === '/register') {
    console.log('✅ Allowing public page:', pathname);
    return NextResponse.next();
  }
  
  // Skip non-page requests
  if (pathname.includes('.') || pathname.startsWith('/api/')) {
    console.log('✅ Skipping non-page request:', pathname);
    return NextResponse.next();
  }
  
  // Check for auth token cookie (simple presence check)
  const authCookie = request.cookies.get('betx_session')?.value;
  console.log('🔍 Auth cookie found:', !!authCookie, 'Length:', authCookie?.length || 0);
  
  if (!authCookie) {
    console.log('❌ No auth cookie, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Simple validation: if cookie exists and has reasonable length, allow access
  // Full JWT verification will happen in the session API
  if (authCookie && authCookie.length > 10) {
    console.log('✅ Auth cookie present, allowing access');
    return NextResponse.next();
  } else {
    console.log('❌ Auth cookie invalid, redirecting to login');
    return NextResponse.next();
  }
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