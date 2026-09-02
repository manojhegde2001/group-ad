// proxy.ts (Next.js request interceptor — formerly the `middleware` convention)
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // ── API CSRF guard ──────────────────────────────────────────────────────
  // Session-cookie-authenticated routes rely on SameSite=Lax to block
  // cross-site cookie sends, but verify Origin/Referer too as defense in
  // depth. /api/auth/* is excluded — NextAuth manages its own CSRF token.
  if (pathname.startsWith('/api')) {
    if (!pathname.startsWith('/api/auth') && MUTATING_METHODS.has(req.method)) {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      const sourceHost = origin ? hostOf(origin) : referer ? hostOf(referer) : '';
      if (sourceHost && sourceHost !== host) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

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
  // Robust token retrieval for NextAuth v5
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  
  async function getRobustToken() {
    // 1. Try default
    let t = await getToken({ req, secret });
    if (t) return t;

    // 2. Try explicit non-secure (common in local dev/proxies)
    t = await getToken({ req, secret, secureCookie: false });
    if (t) return t;

    // 3. Try explicit secure
    t = await getToken({ req, secret, secureCookie: true });
    if (t) return t;

    // 4. Try with NextAuth v5 salts
    const salts = ["authjs.session-token", "__Secure-authjs.session-token", "next-auth.session-token", "__Secure-next-auth.session-token"];
    for (const salt of salts) {
      t = await getToken({ req, secret, salt, secureCookie: salt.startsWith('__Secure') });
      if (t) return t;
      t = await getToken({ req, secret, salt, secureCookie: !salt.startsWith('__Secure') });
      if (t) return t;
    }

    return null;
  }

  const token = (await getRobustToken()) as any;

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
  // But ALLOW public assets like /auth/ logo files and other static assets
  if (isAdminContext && !pathname.startsWith('/auth') && !pathname.includes('.') && (!token || token.userType !== 'ADMIN')) {
    const loginPath = isAdminSubdomain ? '/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  // Protect main-domain auth routes
  const isProtected = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/settings');

  // Link-preview crawlers (WhatsApp, Facebook, Twitter/X, etc.) never carry a session
  // cookie. Let them through on /profile so generateMetadata can serve real OG data
  // instead of redirecting them to '/'.
  const userAgent = req.headers.get('user-agent') || '';
  const isPreviewCrawler = /facebookexternalhit|whatsapp|twitterbot|slackbot|telegrambot|linkedinbot|discordbot|skypeuripreview|googlebot|applebot|pinterest|redditbot|vkshare|w3c_validator/i.test(userAgent);
  const isCrawlableProfilePath = pathname.startsWith('/profile') && isPreviewCrawler;

  if (isProtected && !token && !isCrawlableProfilePath) {
    const url = new URL('/', req.url);
    url.searchParams.set('auth', 'required');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
