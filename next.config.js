/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: 'https://admin.groupad.net/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
