import type { NextConfig } from "next";

// Sites que podem embutir o widget (iframe). Ex.: "https://realleader.com https://www.realleader.com"
// Sem a variável, qualquer site pode embutir (bom para testes, restrinja em produção).
const frameAncestors = process.env.WIDGET_ALLOWED_ORIGINS?.trim() || "*";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/widget",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
      },
      {
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
