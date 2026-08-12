import type { NextConfig } from "next";

// Prefijo público de R2 para autorizar sus imágenes en next/image. Se lee en
// build (en Docker llega como build arg, ver Dockerfile y docker-compose.yml).
const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Obligatorio en Next 16: lista blanca de calidades permitidas
    qualities: [75],
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/brand/**" }],
    remotePatterns: r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : [],
  },
};

export default nextConfig;
