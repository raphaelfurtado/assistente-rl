import Demo from "@/components/Demo";
import SiteNav from "@/components/SiteNav";

export default function Home() {
  return (
    <main className="page">
      <div className="wrap">
        <SiteNav atual="demo" />
        <header className="top">
          <div className="eyebrow">Micro-capstone M1D1 · protótipo acadêmico</div>
          <h1>Assistente de suporte híbrido para o RealLeader</h1>
          <p className="lede">
            Cada mensagem passa pelas camadas da arquitetura proposta, e o painel mostra qual camada respondeu e por quê. Protótipo de
            estudo, sem vínculo oficial com o RealLeader; a base de conhecimento foi montada a partir das páginas públicas do site
            consultadas em 17/11/2026 e da documentação oficial RLDOCS.
          </p>
          <div className="pipeline" aria-label="Camadas da arquitetura">
            <span className="tag t1">1 · Regras</span><span className="arrow">→</span>
            <span className="tag t2">2 · Classificação</span><span className="arrow">→</span>
            <span className="tag t3">3 · LLM com fontes</span><span className="arrow">→</span>
            <span className="tag t4">4 · Humano</span>
          </div>
        </header>
        <section className="shortcuts" aria-label="Outras páginas do projeto">
          <a className="shortcut" href="/exemplo-site.html">
            <strong>Site de exemplo</strong>
            <span>O chat instalado num portal fictício, com uma linha de código.</span>
          </a>
          <a className="shortcut" href="/instalar">
            <strong>Instalar o chat</strong>
            <span>Gera o código para colar no site, com passo a passo por plataforma.</span>
          </a>
          <a className="shortcut" href="/admin">
            <strong>Admin</strong>
            <span>Edite respostas prontas, base de conhecimento e encaminhamento. Pede senha.</span>
          </a>
          <a className="shortcut" href="https://github.com/raphaelfurtado/assistente-rl/blob/main/experimentos/m1d2-analise-prompts/RELATORIO.md" target="_blank" rel="noreferrer">
            <strong>Experimento de prompts ↗</strong>
            <span>Por que o prompt é como é: 15 perguntas × 7 estratégias, com gráficos.</span>
          </a>
        </section>
        <Demo />
      </div>
    </main>
  );
}
