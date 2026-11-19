// Barra de navegação comum a todas as páginas do projeto.

const REPO = "https://github.com/raphaelfurtado/assistente-rl";

const LINKS: { id: string; href: string; label: string; externo?: boolean }[] = [
  { id: "demo", href: "/", label: "Demonstração" },
  { id: "exemplo", href: "/exemplo-site.html", label: "Site de exemplo" },
  { id: "instalar", href: "/instalar", label: "Instalar" },
  { id: "admin", href: "/admin", label: "Admin" },
  { id: "experimento", href: `${REPO}/blob/main/experimentos/m1d2-analise-prompts/RELATORIO.md`, label: "Experimento", externo: true },
  { id: "codigo", href: REPO, label: "Código", externo: true },
];

export default function SiteNav({ atual }: { atual?: string }) {
  return (
    <nav className="site-nav" aria-label="Páginas do projeto">
      <a className="site-brand" href="/">Assistente RL</a>
      <ul>
        {LINKS.map((l) => (
          <li key={l.id}>
            <a
              href={l.href}
              aria-current={l.id === atual ? "page" : undefined}
              {...(l.externo ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {l.label}
              {l.externo && <span aria-hidden="true"> ↗</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
