import Installer from "@/components/Installer";

export const metadata = { title: "Instalar o widget" };

export default function InstalarPage() {
  return (
    <main className="page">
      <div className="wrap narrow">
        <header className="top">
          <div className="eyebrow">
            <a href="/">Assistente RL</a> · instalação
          </div>
          <h1>Coloque o assistente no seu site</h1>
          <p className="lede">
            Escolha uma das três formas. A mais comum é o botão flutuante: uma linha de código e o chat aparece no canto da tela, em
            qualquer página.
          </p>
        </header>
        <Installer />
      </div>
    </main>
  );
}
