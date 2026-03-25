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

  // 2. Domain-Aware Redirections & Rewrites
  if (isAdminSubdomain) {
    // REWRITE: On subdomain, map / to /admin internally
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }
    // Prefix other subpaths if needed (but avoid double prefix)
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
    }
  } else {
    // REDIRECT: On main domain, forward /admin to the subdomain
    if (pathname.startsWith('/admin')) {
      const targetPath = pathname.replace('/admin', '') || '/';
      return NextResponse.redirect(new URL(`https://admin.groupad.net${targetPath}`, req.url));
    }
  }

  // 4. Authentication Logic
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as any;
  const isAuthRoute = pathname.startsWith('/dashboard') || 
                      pathname.startsWith('/profile') || 
                      pathname.startsWith('/events') ||
                      pathname.startsWith('/admin') ||
                      pathname.startsWith('/settings');

  // If on admin subdomain, we MUST have an ADMIN token
  if (isAdminSubdomain) {
    if (!token || token.userType !== 'ADMIN') {
      const loginUrl = new URL('https://www.groupad.net/', req.url);
      loginUrl.searchParams.set('auth', 'required');
      return NextResponse.redirect(loginUrl);
    }
  }

  // General auth routes on main domain
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
