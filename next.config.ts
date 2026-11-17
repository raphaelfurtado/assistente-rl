import type { NextConfig } from "next";

// Sites que podem embutir o widget (iframe). Ex.: "https://realleader.com https://www.realleader.com"
// Sem a variável, nenhum cabeçalho é enviado e qualquer página pode embutir, inclusive um arquivo
// aberto direto do disco (file://), que "frame-ancestors *" bloquearia. Restrinja em produção.
const frameAncestors = process.env.WIDGET_ALLOWED_ORIGINS?.trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      ...(frameAncestors
        ? [{ source: "/widget", headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }] }]
        : []),
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
