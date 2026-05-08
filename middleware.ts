// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  const isAdminSubdomain = host.startsWith('admin.');
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  // Treat localhost /admin/* as equivalent to the admin subdomain
  const isAdminContext = isAdminSubdomain || (isLocalhost && pathname.startsWith('/admin'));

  // ── Admin Subdomain rewrites ──────────────────────────────────────────────
  if (isAdminSubdomain) {
    // /login stays as-is (maps to /admin/login internally)
    if (pathname === '/login') {
      return NextResponse.rewrite(new URL('/admin/login', req.url));
    }
    // / → /admin dashboard
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }
    // Any other path not already prefixed
    if (
      !pathname.startsWith('/admin') && 
      !pathname.startsWith('/api') && 
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/auth') &&
      !pathname.startsWith('/uploads') &&
      !pathname.includes('.')
    ) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
    }
  } else if (!isLocalhost) {
    // Production main domain: bounce /admin/* to the subdomain
    if (pathname.startsWith('/admin')) {
      const targetPath = pathname.replace('/admin', '') || '/';
      // Dynamically construct the admin subdomain based on current host
      const adminHost = host.startsWith('www.') ? host.replace('www.', 'admin.') : `admin.${host}`;
      return NextResponse.redirect(new URL(`${req.nextUrl.protocol}//${adminHost}${targetPath}`, req.url));
    }
  }

  // ── Auth Logic ────────────────────────────────────────────────────────────
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as any;

  // Admin login page is always public — the (panel) layout handles its own auth
  const isAdminLogin = isAdminContext && (pathname === '/login' || pathname === '/admin/login');
  if (isAdminLogin) {
    // Already authenticated as admin → go to dashboard
    if (token?.userType === 'ADMIN') {
      return NextResponse.redirect(new URL(isLocalhost ? '/admin' : '/', req.url));
    }
    return NextResponse.next();
  }

  // Protect entire admin context (subdomain OR localhost /admin/*)
  if (isAdminContext && (!token || token.userType !== 'ADMIN')) {
    const loginPath = isAdminSubdomain ? '/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  // Protect main-domain auth routes
  const isProtected = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/settings');

  if (isProtected && !token) {
    const url = new URL('/', req.url);
    url.searchParams.set('auth', 'required');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
