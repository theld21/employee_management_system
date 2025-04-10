/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  swcMinify: true,
  // Allow CSS imports from node_modules
  transpilePackages: ["react-big-calendar"],
};

export default nextConfig;
