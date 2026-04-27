import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simplified protected routes - avoid complex matching
const protectedPaths = ['/profile', '/wallet', '/bets'];
const adminPaths = ['/admin'];
const authPaths = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files (critical fix)
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NEXTAUTH_URL?.startsWith('https://')
    });
    
    const isLoggedIn = !!token;
    const isAdmin = token?.role === 'ADMIN';

    // Check protected routes
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      if (!isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Check admin routes
    if (adminPaths.some(path => pathname.startsWith(path))) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Redirect logged-in users away from auth pages
    if (authPaths.includes(pathname) && isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Add security headers only
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    
    return response;
  } catch (error) {
    // If middleware fails, allow the request to continue (prevents 500 error)
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.webp).*)',
  ],
};
