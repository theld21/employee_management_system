/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  // This is important for Docker
  webpack(config) {
    return config;
  },
}

module.exports = nextConfig;
