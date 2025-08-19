/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_FRONTEND_HOSTNAME || 'localhost',
        port: process.env.NEXT_PUBLIC_FRONTEND_PORT || '3000',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 