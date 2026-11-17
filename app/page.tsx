import Demo from "@/components/Demo";

export default function Home() {
  return (
    <main className="page">
      <div className="wrap">
        <header className="top">
          <div className="eyebrow">Micro-capstone M1D1 · protótipo acadêmico</div>
          <h1>Assistente de suporte híbrido para o RealLeader</h1>
          <p className="lede">
            Cada mensagem passa pelas camadas da arquitetura proposta, e o painel mostra qual camada respondeu e por quê. Protótipo de
            estudo, sem vínculo oficial com o RealLeader; a base de conhecimento foi montada a partir das páginas públicas do site
            consultadas em 17/11/2026. Veja também o <a href="/exemplo-site.html">widget embutido num site de exemplo</a>.
          </p>
          <div className="pipeline" aria-label="Camadas da arquitetura">
            <span className="tag t1">1 · Regras</span><span className="arrow">→</span>
            <span className="tag t2">2 · Classificação</span><span className="arrow">→</span>
            <span className="tag t3">3 · LLM com fontes</span><span className="arrow">→</span>
            <span className="tag t4">4 · Humano</span>
          </div>
        </header>
        <Demo />
      </div>
    </main>
  );
}
