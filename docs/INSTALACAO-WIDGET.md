# Guia de instalação do widget

Este guia é para quem vai colocar o chat de suporte num site. Não é preciso saber programar: em todas as plataformas, o trabalho é colar **uma linha** num campo de "código personalizado".

Nos exemplos, troque `https://assistente-rl.vercel.app` pelo endereço do seu projeto na Vercel.

## Sumário

1. [Escolha a forma de instalação](#1-escolha-a-forma-de-instalação)
2. [Antes de começar](#2-antes-de-começar)
3. [Instalação por plataforma](#3-instalação-por-plataforma)
4. [Opções de aparência](#4-opções-de-aparência)
5. [Exemplos de uso](#5-exemplos-de-uso)
6. [Como saber se funcionou](#6-como-saber-se-funcionou)
7. [Restringir os sites que podem usar o chat](#7-restringir-os-sites-que-podem-usar-o-chat)
8. [Problemas comuns](#8-problemas-comuns)

---

## 1. Escolha a forma de instalação

| Forma | Como aparece | Quando usar |
| --- | --- | --- |
| **Botão flutuante** (recomendado) | Botão redondo no canto da tela; abre o chat por cima da página | Site inteiro: o cliente encontra ajuda em qualquer página |
| **Chat dentro da página** (iframe) | O chat fixo, ocupando um bloco da página | Página "Ajuda" ou "Contato" dedicada |
| **Link direto** | O chat numa página própria | WhatsApp, e-mail de suporte, bio do Instagram, QR code em material impresso |

As três formas usam o mesmo assistente, as mesmas respostas e o mesmo admin.

## 2. Antes de começar

- [ ] O projeto está publicado e `https://SEU-PROJETO.vercel.app/api/chat` responde `{"ok":true,"llm":true}`.
- [ ] Você tem acesso de administrador ao site (para editar o código do tema ou o campo de código personalizado).
- [ ] Se a variável `WIDGET_ALLOWED_ORIGINS` estiver preenchida na Vercel, o domínio do site está na lista (seção 7).

A página **`/instalar`** do projeto gera o código já com a cor, a posição e o texto escolhidos, com botão de copiar.

---

## 3. Instalação por plataforma

O código é sempre este (com ou sem as opções da seção 4):

```html
<script src="https://assistente-rl.vercel.app/widget.js" defer></script>
```

Ele deve ficar **no fim da página, antes de `</body>`**, e precisa estar em todas as páginas onde o chat deve aparecer.

### 3.1 Site em HTML

1. Abra o arquivo HTML de cada página (ou o modelo comum, se houver).
2. Cole a linha logo antes de `</body>`.
3. Publique os arquivos.

```html
    ...
    <footer>...</footer>
    <script src="https://assistente-rl.vercel.app/widget.js" defer></script>
  </body>
</html>
```

### 3.2 WordPress

**Com plugin (recomendado, não se perde ao atualizar o tema):**

1. Em **Plugins → Adicionar novo**, instale e ative **WPCode** (antigo *Insert Headers and Footers*).
2. Vá em **Code Snippets → Header & Footer**.
3. Cole a linha no campo **Footer** e clique em **Save Changes**.

**Sem plugin:** em **Aparência → Editor de arquivos de tema → footer.php**, cole a linha antes de `</body>`. Use um *tema filho*: alterações no tema principal se perdem na próxima atualização.

> Se o site usa cache (WP Rocket, LiteSpeed, W3 Total Cache), limpe o cache depois de salvar.

### 3.3 Wix

Requer plano pago com domínio conectado.

1. No painel do site, vá em **Configurações → Avançado → Código personalizado**.
2. Clique em **+ Adicionar código personalizado** e cole a linha.
3. Em **Adicionar código às páginas**, escolha **Todas as páginas** e **Carregar código uma vez**.
4. Em **Posicionar código em**, escolha **Corpo - fim**.
5. Clique em **Aplicar** e publique o site.

### 3.4 Shopify

1. No admin, vá em **Loja virtual → Temas**.
2. No tema ativo, clique em **⋯ → Editar código**.
3. Abra **layout → theme.liquid**.
4. Cole a linha antes de `</body>` e clique em **Salvar**.

### 3.5 Google Tag Manager

1. Em **Tags → Nova**, escolha **HTML personalizado** e cole a linha.
2. Em **Acionamento**, escolha **All Pages** (Todas as páginas).
3. Salve, clique em **Visualizar** para testar e depois em **Enviar → Publicar**.

### 3.6 Next.js

No layout raiz (`app/layout.tsx`):

```tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Script src="https://assistente-rl.vercel.app/widget.js" strategy="afterInteractive" data-color="#1A7748" />
      </body>
    </html>
  );
}
```

### 3.7 React (Vite, Create React App) e outras SPAs

Cole a linha no `index.html`, antes de `</body>`. O chat continua aberto mesmo quando o usuário navega entre telas da aplicação.

---

## 4. Opções de aparência

As opções são atributos no próprio `<script>`:

| Atributo | Valores | Padrão | Exemplo |
| --- | --- | --- | --- |
| `data-color` | Cor em hexadecimal | `#1A7748` | `data-color="#0F3D2E"` |
| `data-position` | `right` ou `left` | `right` | `data-position="left"` |
| `data-greeting` | Texto do convite ao lado do botão; `""` desliga | "Precisa de ajuda? Fale com o suporte." | `data-greeting="Dúvidas sobre créditos?"` |
| `data-open` | `true` abre o chat ao carregar | `false` | `data-open="true"` |

Exemplo completo:

```html
<script src="https://assistente-rl.vercel.app/widget.js"
        data-color="#0F3D2E"
        data-position="left"
        data-greeting="Dúvidas sobre créditos ou parcerias? Fale com a gente."
        defer></script>
```

Comportamento padrão:

- o convite aparece 2,5 segundos depois de a página carregar, uma vez por visita;
- o chat só é carregado quando o visitante clica, sem pesar no carregamento do site;
- fecha pelo botão × dentro do chat, pela tecla Esc ou clicando de novo no botão;
- no celular (até 480 px de largura), abre em tela cheia.

---

## 5. Exemplos de uso

### 5.1 Abrir o chat por um botão ou link do site

O widget expõe `window.RLWidget` com `open()`, `close()` e `toggle()`:

```html
<button type="button" onclick="RLWidget.open()">Falar com o suporte</button>

<a href="#" onclick="RLWidget.open(); return false;">Precisa de ajuda?</a>
```

Uso típico: um botão "Falar com o suporte" na página de preços, no rodapé ou na área do cliente.

### 5.2 Página de ajuda com o chat aberto

Na página "Ajuda", use `data-open="true"` para o chat já abrir:

```html
<script src="https://assistente-rl.vercel.app/widget.js" data-open="true" defer></script>
```

### 5.3 Chat fixo dentro da página (iframe)

```html
<iframe src="https://assistente-rl.vercel.app/widget"
        title="Suporte"
        style="width:100%;max-width:420px;height:640px;border:0;border-radius:16px"></iframe>
```

### 5.4 Link direto (WhatsApp, e-mail, QR code)

```
https://assistente-rl.vercel.app/widget
```

Exemplos:

- **Resposta automática do WhatsApp Business:** "Para dúvidas rápidas sobre créditos e integração, fale com nosso assistente: https://assistente-rl.vercel.app/widget"
- **Assinatura de e-mail do suporte:** "Atendimento 24h pelo assistente virtual: https://assistente-rl.vercel.app/widget"
- **QR code** em material impresso de eventos: gere a imagem a partir do link em qualquer gerador de QR code.

### 5.5 Sites diferentes com aparências diferentes

O mesmo assistente pode estar em vários sites, cada um com sua cor:

```html
<!-- portal principal -->
<script src="https://assistente-rl.vercel.app/widget.js" data-color="#1A7748" defer></script>

<!-- blog -->
<script src="https://assistente-rl.vercel.app/widget.js" data-color="#0F3D2E" data-position="left" data-greeting="" defer></script>
```

---

## 6. Como saber se funcionou

1. Abra o site numa **janela anônima** (evita cache).
2. Em até 3 segundos devem aparecer o botão no canto e o convite.
3. Clique no botão: o chat abre com a mensagem de boas-vindas.
4. Clique em **"Os créditos vencem?"**: a resposta chega na hora, com a etiqueta **Regras**.
5. Teste no celular: o chat deve ocupar a tela inteira e fechar pelo ×.

---

## 7. Restringir os sites que podem usar o chat

Por padrão, qualquer site pode exibir o chat. Em produção, limite aos seus domínios:

1. Na Vercel, em **Settings → Environment Variables**, crie `WIDGET_ALLOWED_ORIGINS`.
2. Coloque os domínios separados por espaço:

   ```
   'self' https://realleader.com https://www.realleader.com https://*.realleader.com
   ```

   - `'self'` (com aspas simples) mantém o próprio projeto e os endereços de pré-visualização da Vercel.
   - `www` e sem `www` são domínios diferentes: inclua os dois.
   - `https://*.dominio.com` cobre todos os subdomínios.
   - Use `https://`, sem barra no final e sem caminho.
3. Faça **Redeploy**.

Essa restrição impede que outros sites *exibam* o chat. Ela não protege a API contra chamadas diretas; para isso, veja "Proteção de custo" em [IMPLANTACAO.md](IMPLANTACAO.md).

---

## 8. Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| Botão não aparece | O script não está em `</body>`, o tema não foi salvo, ou há cache | Confira o código-fonte da página (Ctrl+U) e procure `widget.js`; limpe o cache do site e do navegador |
| Botão não aparece e o Console (F12) mostra erro de `widget.js` | Endereço errado ou projeto fora do ar | Abra o endereço do `widget.js` direto no navegador: deve mostrar um código JavaScript |
| Chat abre com **"A conexão com ... foi recusada"** | O domínio não está em `WIDGET_ALLOWED_ORIGINS` | Inclua o domínio exato e faça Redeploy |
| Funciona no domínio sem `www`, mas não com `www` | Só um dos dois está na lista | Inclua os dois |
| Página aberta direto do computador (`file://`) não mostra o chat | Com a lista preenchida, `file://` é bloqueado | Teste por um endereço `http://` ou `https://` |
| Chat aparece duas vezes | Código colado em dois lugares (tema e plugin) | Deixe só um; o widget ignora a segunda cópia, mas a duplicidade confunde a manutenção |
| Botão fica atrás de outro elemento (ex.: botão do WhatsApp) | Dois botões no mesmo canto | Use `data-position="left"` |
| Respostas sempre vão para humano | Sem chave da OpenAI ou sem crédito | Veja a seção "Solução de problemas" do [README](../README.md#6-solução-de-problemas) |
