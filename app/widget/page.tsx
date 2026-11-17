import Chat from "@/components/Chat";

export const metadata = { title: "Suporte RealLeader" };

// Página carregada dentro do iframe criado por /widget.js
export default function WidgetPage() {
  return (
    <main style={{ height: "100dvh" }}>
      <Chat embedded />
    </main>
  );
}
