import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
