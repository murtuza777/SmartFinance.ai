/** @type {import('next').NextConfig} */
const WORKER_API_BASE_URL =
  process.env.WORKER_API_BASE_URL ||
  process.env.NEXT_PUBLIC_WORKER_API_BASE_URL ||
  'http://127.0.0.1:8787'

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${WORKER_API_BASE_URL}/:path*`,
      },
    ]
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig 
