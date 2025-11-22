import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/guesstheemoji" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/guesstheemoji/" : "",
};

export default nextConfig;
