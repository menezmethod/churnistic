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
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
  },
};

export default nextConfig;
