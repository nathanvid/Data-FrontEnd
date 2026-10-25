import type { NextConfig } from "next";

// Le build de production utilise webpack (`next build --webpack`, voir package.json) :
// depuis Next 16.3.3, Turbopack ne tourne plus sur les serveurs de build de Hostinger.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
