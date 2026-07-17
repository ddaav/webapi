import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware to protect routes.
 * Checks for a token in the cookies:
 * - Redirects to /login if an unauthenticated user attempts to view a protected page.
 * - Redirects to /dashboard if an authenticated user attempts to view auth pages (login/register).
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  let user: any = null;
  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie));
    } catch (e) {
      try {
        user = JSON.parse(userCookie);
      } catch (innerE) {
        // ignore
      }
    }
  }

  // Define route criteria
  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');
  const isAdminPath = pathname.startsWith('/admin');
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 1. If trying to access protected or admin route without token, redirect to login
  if ((isProtectedPath || isAdminPath) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If trying to access admin route but user is not admin, redirect to dashboard
  if (isAdminPath && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. If logged in and trying to access login/register, redirect to dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Config to specify which paths the middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};

