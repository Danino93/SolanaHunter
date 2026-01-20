import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable strict mode warnings for now (we'll enable later)
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: ['dexscreener.com', 'solscan.io'],
  },
  
  // Enable experimental features if needed
  // experimental: {
  //   optimizePackageImports: ['lucide-react'],
  // },
};

export default nextConfig;
