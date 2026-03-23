// import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/media/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

// Sentry disabled — uncomment to re-enable:
// export default withSentryConfig(nextConfig, {
//   org: 'konbinishopcl',
//   project: 'javascript-nextjs',
//   silent: !process.env.CI,
//   widenClientFileUpload: true,
//   tunnelRoute: '/monitoring',
//   disableLogger: true,
//   automaticVercelMonitors: true,
// });
