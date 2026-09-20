import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Necesario para importar desde src/utils/ fuera del proyecto
    // No deshabilita tree-shaking por sí mismo en Next.js 16
    externalDir: true,
  },
};

export default nextConfig;
