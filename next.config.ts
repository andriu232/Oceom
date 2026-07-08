import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir material a la Biblioteca IA (PDFs) por server action.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
