const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

// Content-Security-Policy — shipped in Report-Only mode: browsers report
// violations (visible in devtools) but nothing is blocked. Once the reports are
// clean this can be tightened (drop 'unsafe-inline'/'unsafe-eval', add a nonce)
// and switched to the enforcing `Content-Security-Policy` header.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth?mode=signup',
        permanent: true,
      },
    ];
  },
  images: {
    // Optimized feed images rarely change — hold them in the on-disk optimizer
    // cache for 31 days so repeat/first-paint requests skip the sharp round-trip.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // S3 media uploads (any bucket/region under our AWS account)
      { protocol: 'https', hostname: '**.amazonaws.com' },
      // Cloudinary — legacy media host; existing pre-S3-migration posts still
      // reference res.cloudinary.com URLs, even though current uploads go to S3
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google OAuth profile photos
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      // Legacy: older category/venue/power-team records may still hold an
      // unsplash banner URL (new fallbacks use a bundled local asset).
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Generated avatar fallbacks (admin bulk user creation)
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg'],
  experimental: {
    // Barrel-file tree-shaking: import only the icons/components actually used
    // instead of the whole package on first load.
    optimizePackageImports: [
      'lucide-react',
      'rizzui',
      '@heroicons/react',
      'framer-motion',
      'date-fns',
    ],
  },
};

module.exports = withSerwist(nextConfig);
