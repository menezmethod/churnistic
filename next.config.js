/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['bankrewards.io', 't3.gstatic.com', 'www.usbank.com', 'gstatic.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
