import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      // Los shaders de ThreeUI importan sus fuentes HTML con `?raw`.
      "*.html": {
        loaders: ["./raw-html-loader.cjs"],
        as: "*.js",
      },
    },
  },
  experimental: {
    // Permite subir material a la Biblioteca IA (PDFs) por server action.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
