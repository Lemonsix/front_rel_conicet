import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Desactivar la verificación de ESLint durante el build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
