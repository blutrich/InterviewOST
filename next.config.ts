import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Mastra to work in Vercel serverless functions
  serverExternalPackages: ["@mastra/*"],
};

export default nextConfig;
