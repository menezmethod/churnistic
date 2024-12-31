/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle Crawlee and Playwright dependencies
    if (isServer) {
      config.externals = [...config.externals, 'playwright-core'];
    }

    // Ignore browserslist warning
    config.ignoreWarnings = [{ module: /node_modules\/browserslist/ }];

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/opportunities/:path*',
        destination: 'http://localhost:8000/opportunities/:path*',
      },
      {
        source: '/opportunities/:id',
        destination: 'http://localhost:8000/opportunities/:id',
        has: [
          {
            type: 'query',
            key: 'raw',
            value: 'true',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
