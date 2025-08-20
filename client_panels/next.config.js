const path = require('path');

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
  transpilePackages: ['user-management-frontend'],
  experimental: {
    transpilePackages: ['user-management-frontend']
  },
  webpack: (config, { isServer }) => {
    // Handle external TypeScript files
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [
        path.resolve(__dirname, '../user-management'),
        path.resolve(__dirname, '../shared')
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript'
          ],
          plugins: [
            ['@babel/plugin-transform-runtime', { regenerator: true }]
          ]
        }
      }
    });

    // Resolve modules from user-management
    config.resolve.alias = {
      ...config.resolve.alias,
      '@user-management': path.resolve(__dirname, '../user-management/apps/frontend'),
    };

    return config;
  },
}

module.exports = nextConfig 