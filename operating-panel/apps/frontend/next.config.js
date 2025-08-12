/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_KEY: 'operating-panel',
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const base = process.env.NGROK_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4001';
    console.log('🔧 Next.js rewrite base:', base);
    
    return [
      {
        source: '/api/:path*',
        destination: `${base}/:path*`,
      },
      {
        source: '/provider/:path*',
        destination: `${base}/provider/:path*`,
        has: [
          {
            type: 'header',
            key: 'accept',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 