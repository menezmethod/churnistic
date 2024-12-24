/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/opportunities/:path*',
        destination: 'http://localhost:8000/opportunities/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
