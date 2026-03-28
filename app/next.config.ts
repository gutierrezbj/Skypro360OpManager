import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SRS OpsManager — Skypro360
  serverExternalPackages: ["postgres", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
