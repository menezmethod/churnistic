/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
