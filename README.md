# Assistente RL — assistente de suporte híbrido

Protótipo acadêmico (Micro-capstone M1D1) de um assistente de suporte para o RealLeader. Cada mensagem do cliente passa por quatro camadas, da mais barata e previsível para a mais cara:

| Camada | O que faz | Custo por mensagem |
| --- | --- | --- |
| 1. Respostas prontas (regras) | Responde perguntas de resposta fixa (créditos, preços, cancelamento, horário, como contratar). Reembolso vai sempre para humano. | Zero |
| 2. Classificação | O LLM identifica produto, tipo de dúvida e idioma. | 1 chamada pequena |
| 3. LLM com fontes | Responde só com a base de conhecimento oficial, cita as fontes e informa a confiança. | 1 chamada |
| 4. Humano | Parcerias, erros nos dados, reembolsos, pedidos comerciais e respostas de baixa confiança. Gera um resumo para a equipe. | Tempo da equipe |

**Em produção:** https://assistente-rl.vercel.app (demonstração) · [/exemplo-site.html](https://assistente-rl.vercel.app/exemplo-site.html) (widget num site) · [/instalar](https://assistente-rl.vercel.app/instalar) (gerador do código)

Sem vínculo oficial com o RealLeader. A base de conhecimento padrão foi montada a partir das páginas públicas do site, consultadas em 17/11/2026.

## Documentação

| Guia | Para quem | Conteúdo |
| --- | --- | --- |
| Este README | Quem vai rodar ou publicar o projeto | Pré-requisitos, instalação local, publicação na Vercel, solução de problemas, API |
| [docs/INSTALACAO-WIDGET.md](docs/INSTALACAO-WIDGET.md) | Quem vai colocar o chat num site | Passo a passo por plataforma (HTML, WordPress, Wix, Shopify, Google Tag Manager, Next.js, React), opções e exemplos de uso |
| [docs/IMPLANTACAO.md](docs/IMPLANTACAO.md) | Quem decide e opera em produção | Plano de entrada em produção por fases, checklist de go-live, operação do dia a dia, custos e métricas |
| [experimentos/m1d2-analise-prompts](experimentos/m1d2-analise-prompts/RELATORIO.md) | Quem quer entender por que o prompt é como é | Experimento com 15 perguntas × 7 estratégias de prompt, avaliadas contra a documentação oficial; as escolhas do assistente (base no prompt, exemplo de "não sei", urgência primeiro, temperatura 0) vêm daqui |

---

## 1. Pré-requisitos

| Item | Para quê | Obrigatório? | Como conferir |
| --- | --- | --- | --- |
| **Node.js 20 ou mais recente** | Rodar o projeto | Sim | `node -v` mostra `v20` ou maior. Baixe em [nodejs.org](https://nodejs.org) (versão LTS). |
| **npm** (vem com o Node) | Instalar as dependências | Sim | `npm -v` |
| **Git** | Baixar o código e publicar | Sim | `git --version` |
| **Chave da API da OpenAI** | Camadas 2 e 3 | Não, mas sem ela o chat só usa regras e encaminha o resto para humano | Crie em [platform.openai.com/api-keys](https://platform.openai.com/api-keys). A conta precisa ter crédito. |
| **Conta no GitHub** | Guardar o código e ligar à Vercel | Só para publicar | — |
| **Conta na Vercel** | Hospedar o projeto | Só para publicar | Plano Hobby (gratuito) basta para o protótipo. |
| **Banco Upstash Redis** | Guardar as edições feitas no `/admin` em produção | Só se for usar o admin na Vercel | Criado pela própria Vercel (passo 3.4). |

Conhecimento esperado: usar o terminal para rodar comandos e editar um arquivo de texto. Não é preciso saber programar para instalar o widget nem para usar o admin.

---

## 2. Rodar no seu computador

### 2.1 Baixar o código

```bash
git clone https://github.com/raphaelfurtado/assistente-rl.git
cd assistente-rl
```

### 2.2 Instalar as dependências

```bash
npm install
```

Leva menos de um minuto. Ao final aparece `added NN packages`.

### 2.3 Configurar as variáveis

Copie o modelo para um arquivo `.env.local`:

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

Abra o `.env.local` e preencha pelo menos:

```ini
OPENAI_API_KEY=sk-...           # sua chave da OpenAI
ADMIN_PASSWORD=uma-senha-forte   # para entrar em /admin
```

O `.env.local` está no `.gitignore` e **nunca vai para o GitHub**. Não coloque chaves em nenhum outro arquivo.

### 2.4 Iniciar

```bash
npm run dev
```

Quando aparecer `Ready`, abra:

| Endereço | O que é |
| --- | --- |
| http://localhost:3000 | Demonstração: chat + painel que mostra o caminho de cada mensagem pelas camadas |
| http://localhost:3000/exemplo-site.html | Site fictício com o widget instalado |
| http://localhost:3000/instalar | Gerador do código de instalação |
| http://localhost:3000/admin | Admin (pede a `ADMIN_PASSWORD`) |

### 2.5 Conferir se funcionou

1. No canto do chat, o selo deve mostrar **LLM: ativo**. Se mostrar *LLM: só regras*, a chave não foi lida: confira o `.env.local` e reinicie o `npm run dev`.
2. Clique no exemplo **"Os créditos vencem?"**: deve responder pela camada **Regras** em poucos milissegundos.
3. Clique em **"How long are my credits valid?"**: deve responder em inglês pela camada **LLM com fontes**, citando `kb-creditos-validade`.
4. Clique em **"Quero reembolso do pacote que comprei ontem"**: deve ir para **Humano**, com o resumo para a equipe.

Se os quatro passos derem certo, a instalação local está completa.

---

## 3. Publicar na Vercel

### 3.1 Subir o código para o GitHub

Se você clonou este repositório, crie o seu próprio (fork ou repositório novo) e envie:

```bash
git remote set-url origin https://github.com/SEU-USUARIO/assistente-rl.git
git push -u origin main
```

### 3.2 Importar na Vercel

1. Entre em [vercel.com](https://vercel.com) → **Add New… → Project**.
2. Escolha o repositório `assistente-rl` e clique em **Import**.
3. A Vercel reconhece o Next.js sozinha. Não mude *Build Command* nem *Output Directory*.

### 3.3 Cadastrar as variáveis de ambiente

Ainda na tela de importação (ou depois, em **Settings → Environment Variables**):

| Key | Valor | Observação |
| --- | --- | --- |
| `OPENAI_API_KEY` | sua chave | Obrigatória para as camadas 2 e 3 |
| `ADMIN_PASSWORD` | senha forte, diferente da local | Liga o `/admin` |
| `OPENAI_MODEL` | `gpt-4o-mini` | Opcional; troque se sua conta usar outro modelo |
| `WIDGET_ALLOWED_ORIGINS` | ex.: `'self' https://www.seusite.com.br` | Opcional; restringe quais sites podem exibir o chat ([detalhes](docs/INSTALACAO-WIDGET.md#7-restringir-os-sites-que-podem-usar-o-chat)) |

Clique em **Deploy**. Em cerca de 1 minuto o projeto fica **Ready** com um endereço `https://SEU-PROJETO.vercel.app`.

> Variável cadastrada **depois** do deploy só vale no próximo. Use **Deployments → ⋯ → Redeploy**.

### 3.4 Ligar o banco do admin (Upstash Redis)

Sem banco, o `/admin` abre mas não consegue salvar, porque o disco da Vercel é somente leitura.

1. No projeto, abra a aba **Storage → Create Database**.
2. Escolha **Upstash → Redis**, plano gratuito, região mais próxima dos clientes (ex.: São Paulo, se houver).
3. Em **Connect Project**, selecione este projeto e os ambientes Production, Preview e Development.
4. A Vercel cria sozinha as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`, que o projeto já reconhece.
5. Faça um **Redeploy**.

### 3.5 Conferir a publicação

```bash
curl https://SEU-PROJETO.vercel.app/api/chat
# esperado: {"ok":true,"llm":true}
```

Depois repita os quatro testes da seção 2.5 no endereço publicado e entre em `/admin`: o topo deve mostrar **"Salvando no Upstash Redis"**.

### 3.6 Atualizações

Cada `git push` na branch `main` gera um deploy automático. Pushes em outras branches geram endereços de pré-visualização (*Preview*), bons para testar antes.

---

## 4. Colocar o chat num site

Uma linha antes de `</body>`:

```html
<script src="https://SEU-PROJETO.vercel.app/widget.js" defer></script>
```

O passo a passo por plataforma, as opções de cor, posição e texto, a API JavaScript e os exemplos de uso estão em **[docs/INSTALACAO-WIDGET.md](docs/INSTALACAO-WIDGET.md)**. A página `/instalar` gera o código já personalizado.

---

## 5. Ensinar o chat pelo admin

Em `/admin`, sem mexer em código:

| Aba | Use quando |
| --- | --- |
| **Respostas prontas** | Uma pergunta é frequente e tem resposta fixa. Crie gatilhos (um por linha; todas as palavras precisam aparecer; basta o começo da palavra: `contrat rlpress` casa com "Quero contratar o RLPRESS"). Teste a frase no próprio painel. |
| **Base de conhecimento** | O chat encaminhou para humano porque não sabia a resposta. Acrescente um trecho com o texto oficial e palavras-chave. |
| **Encaminhamento** | Um tipo de pedido deve sempre ir para a equipe, ou o LLM está encaminhando demais ou de menos (ajuste a confiança mínima). |
| **Testar o chat** | Depois de salvar, confira o comportamento no chat com o painel das camadas. |

Fluxo recomendado para corrigir uma resposta: **reproduzir** a pergunta na aba Testar → ver no painel em qual camada parou → **ajustar** (resposta pronta, base ou encaminhamento) → **Salvar** → testar de novo.

---

## 6. Solução de problemas

| Sintoma | Causa provável | Como resolver |
| --- | --- | --- |
| Selo mostra **LLM: só regras** | `OPENAI_API_KEY` ausente ou não lida | Local: confira o `.env.local` e reinicie. Vercel: cadastre a variável e faça Redeploy. |
| Toda pergunta aberta vai para humano com "O LLM não respondeu" | Chave inválida, sem crédito, ou modelo indisponível na conta | Teste a chave no painel da OpenAI; confira o saldo; troque `OPENAI_MODEL`. |
| Widget abre com **"A conexão com localhost foi recusada"** (ou com o domínio) | O site não está na lista `WIDGET_ALLOWED_ORIGINS`, ou a página foi aberta direto do disco (`file://`) com a lista preenchida | Inclua o domínio exato (com `https://`, sem barra no fim) e faça Redeploy. Para testes locais, use `http://localhost:3000/exemplo-site.html`. |
| Botão do chat não aparece | Script não carregou | Abra o endereço do `widget.js` no navegador; confira se o código está antes de `</body>`; veja o Console (F12). Detalhes no [guia do widget](docs/INSTALACAO-WIDGET.md#8-problemas-comuns). |
| `/admin` diz **"Admin desligado"** | `ADMIN_PASSWORD` não definida | Defina a variável e reinicie / faça Redeploy. |
| `/admin` diz **"Sem banco"** e não salva | Upstash não conectado na Vercel | Siga a seção 3.4. |
| "Muitas tentativas" no login | 5 senhas erradas seguidas | Aguarde 1 minuto. |
| Mudança no admin não aparece no chat | Cache de até 5 segundos por servidor | Aguarde alguns segundos e teste de novo. |

---

## 7. Referência da API

### `POST /api/chat`

```json
// requisição
{ "message": "Os créditos vencem?", "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }] }
```

- `message`: texto do cliente, até 600 caracteres.
- `history`: opcional, últimas trocas da conversa (o servidor usa até 6).

```json
// resposta
{
  "reply": "Cada pacote de créditos do RLPRESS vale por 45 dias...",
  "layer": 1,
  "steps": [{ "layer": 1, "result": "resposta aprovada", "kv": [["regra", "validade"], ["gatilho", "credit venc"]] }],
  "meta": "fonte: kb-creditos-validade",
  "handoff": null,
  "lang": "pt",
  "llm": true,
  "ms": 3
}
```

- `layer`: camada em que a mensagem terminou (1 regras, 3 LLM, 4 humano).
- `handoff`: resumo para a equipe quando `layer` é 4.

### `GET /api/chat`

Saúde do serviço: `{ "ok": true, "llm": true }`.

### `GET /api/kb`

Trechos ativos da base de conhecimento (público, mesmo conteúdo que o chat pode dizer).

---

## 8. Estrutura do código

| Caminho | O que faz |
| --- | --- |
| `app/api/chat/route.ts` | API do chat |
| `lib/pipeline.ts` | Orquestra as 4 camadas |
| `lib/rules.ts` | Camada 1 (gatilhos) e classificação de reserva sem LLM |
| `lib/llm.ts` | Chamadas à OpenAI (camadas 2 e 3) |
| `lib/config.ts` | Configuração editável no admin e seus valores padrão |
| `lib/kb.ts` | Base de conhecimento padrão |
| `lib/store.ts` | Onde a configuração é guardada (Upstash ou arquivo local) |
| `lib/auth.ts` | Login do admin (senha + cookie assinado) |
| `app/admin/` e `components/admin/` | Telas do admin |
| `public/widget.js` | Script que coloca o chat em qualquer site |
| `public/exemplo-site.html` | Site fictício com o widget instalado |

## 9. Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Chave da OpenAI. Sem ela, modo só regras |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modelo das camadas 2 e 3 |
| `ADMIN_PASSWORD` | — | Senha do `/admin`. Sem ela, o admin fica desligado |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | — | Banco das edições do admin (criadas pela Vercel ao conectar o Upstash). Também aceita `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` |
| `WIDGET_ALLOWED_ORIGINS` | qualquer site | Sites que podem exibir o chat embutido |

## 10. Limites conhecidos

- Não há limite de mensagens por visitante. Antes de divulgar amplamente, adicione rate limiting e defina um teto de gasto na OpenAI (ver [docs/IMPLANTACAO.md](docs/IMPLANTACAO.md)).
- O encaminhamento humano gera o resumo na tela, mas ainda não abre um chamado num helpdesk ou e-mail.
- O chat não consulta dados da conta do cliente (ex.: saldo de créditos).
- A busca na base é por palavras-chave, adequada para dezenas de trechos. Um banco vetorial só se justifica com centenas.
