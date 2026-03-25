// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Detect Admin Subdomain (e.g., admin.groupad.net)
  const isAdminSubdomain = host.startsWith('admin.');

  // Helper: is this the admin login page (any URL form)?
  // Covers: admin.groupad.net/login  AND  admin.groupad.net/admin/login
  const isAdminLoginPath =
    isAdminSubdomain && (pathname === '/login' || pathname === '/admin/login');

  // 2. Domain-Aware Rewrites (admin subdomain only)
  if (isAdminSubdomain) {
    // /login → rewrite to /admin/login internally, then pass through
    if (pathname === '/login') {
      const rewriteUrl = new URL('/admin/login', req.url);
      const res = NextResponse.rewrite(rewriteUrl);
      // Tell AdminLayout this is the login page so it won't auth-redirect
      res.headers.set('x-is-admin-login', '1');
      return res;
    }
    // Root → /admin dashboard
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }
    // Any other sub-path that isn't already prefixed
    if (
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/_next')
    ) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
    }
  } else {
    // On main domain: redirect /admin/* to the admin subdomain
    if (pathname.startsWith('/admin')) {
      const targetPath = pathname.replace('/admin', '') || '/';
      return NextResponse.redirect(
        new URL(`https://admin.groupad.net${targetPath}`, req.url)
      );
    }
  }

  // 3. Authentication Logic
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as any;

  // Skip auth check for the admin login page itself
  if (isAdminLoginPath) {
    // If already logged in as admin, redirect to dashboard
    if (token && token.userType === 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    // Not logged in → allow through and tell AdminLayout to skip auth
    const res = NextResponse.next({
      request: {
        headers: new Headers({
          ...Object.fromEntries(req.headers.entries()),
          'x-is-admin-login': '1',
        }),
      },
    });
    res.headers.set('x-is-admin-login', '1');
    return res;
  }

  // If on admin subdomain, require an ADMIN token
  if (isAdminSubdomain) {
    if (!token || token.userType !== 'ADMIN') {
      return NextResponse.redirect(new URL('https://admin.groupad.net/login', req.url));
    }
  }

  // General protected routes on main domain
  const isAuthRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/settings');

  if (isAuthRoute && !token) {
    const loginUrl = new URL('https://www.groupad.net/', req.url);
    loginUrl.searchParams.set('auth', 'required');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
