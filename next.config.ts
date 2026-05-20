import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.4.30"],
  output: "standalone",
};

export default nextConfig;
