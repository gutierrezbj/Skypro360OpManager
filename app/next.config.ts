import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SRS OpsManager — Skypro360
  output: "standalone",
  serverExternalPackages: ["postgres", "bcryptjs", "nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
