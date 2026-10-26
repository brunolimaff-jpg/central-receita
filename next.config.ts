import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  reactStrictMode: false,
  webpack(config) {
    if (process.env.NEXT_PUBLIC_VISUAL_PREVIEW === '1') {
      config.resolve.alias = {
        ...config.resolve.alias,
        './real-branches.json$': path.resolve('src/features/comercial-v3/visual-branches.json'),
      }
    }
    return config
  },
};

export default nextConfig;
