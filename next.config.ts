import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "katex",
      "remark-math",
      "rehype-katex",
      "react-markdown",
    ],
  },
};

export default nextConfig;
