const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

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
    remotePatterns: [
      // S3 media uploads (any bucket/region under our AWS account)
      { protocol: 'https', hostname: '**.amazonaws.com' },
      // Cloudinary — legacy media host; existing pre-S3-migration posts still
      // reference res.cloudinary.com URLs, even though current uploads go to S3
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google OAuth profile photos
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      // Placeholder/demo imagery used in explore & power-teams sections
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Generated avatar fallbacks (admin bulk user creation)
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg'],
};

module.exports = withSerwist(nextConfig);
