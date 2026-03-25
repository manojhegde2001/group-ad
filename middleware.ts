// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Detect Admin Subdomain (e.g., admin.groupad.net or admin.localhost:3000)
  const isAdminSubdomain = host.startsWith('admin.');

  // 2. Subdomain Rewrite Logic
  if (isAdminSubdomain) {
    // If accessing root of subdomain, rewrite to internal admin dashboard
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }
    // If accessing a path that doesn't already start with /admin, prefix it
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
    }
  }

  // 3. Prevent direct access to /admin via the main domain (optional but recommended)
  if (!isAdminSubdomain && pathname.startsWith('/admin') && !pathname.startsWith('/admin/analytics')) { // allow analytics for now or specific routes
      // Optionally redirect to admin subdomain in production
      // For now, we'll just allow it to avoid breaking dev, 
      // but in a real prod env, you'd redirect groupad.net/admin -> admin.groupad.net
  }

  // 4. Authentication Logic
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthRoute = pathname.startsWith('/dashboard') || 
                      pathname.startsWith('/profile') || 
                      pathname.startsWith('/events') ||
                      pathname.startsWith('/admin') ||
                      pathname.startsWith('/settings');

  if (isAuthRoute && !token) {
    const loginUrl = new URL('/', req.url);
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
