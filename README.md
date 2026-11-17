# Assistente RL — protótipo de suporte híbrido

Protótipo acadêmico (Micro-capstone M1D1) de um assistente de suporte para o RealLeader, seguindo a arquitetura proposta no documento do projeto:

1. **Regras** — respostas aprovadas para perguntas de resposta fixa (créditos, preços, cancelamento, horário, login). Reembolso vai sempre para humano.
2. **Classificação** — o LLM identifica produto, tipo de dúvida e idioma.
3. **LLM com fontes** — responde só com a base de conhecimento oficial, cita as fontes e informa a confiança.
4. **Humano** — parcerias, erros nos dados, reembolsos, pedidos comerciais e respostas de baixa confiança.

Sem vínculo oficial com o RealLeader. A base de conhecimento (`lib/kb.ts`) foi montada a partir das páginas públicas do site, consultadas em 17/11/2026. O trecho marcado como *Rascunho a validar* não vem do site.

## Estrutura

| Caminho | O que faz |
| --- | --- |
| `app/api/chat/route.ts` | API `POST /api/chat` que recebe `{ message, history }` e devolve a resposta e o rastro das camadas |
| `lib/pipeline.ts` | Orquestra as 4 camadas |
| `lib/rules.ts` | Camada 1 (regras) e classificação de reserva sem LLM |
| `lib/llm.ts` | Chamadas à OpenAI (Camadas 2 e 3) |
| `lib/kb.ts` | Base de conhecimento (fontes autorizadas) |
| `lib/text.ts` | Detecção de idioma e busca nas fontes |
| `app/page.tsx` | Página de demonstração: chat + painel do avaliador |
| `app/widget/page.tsx` | Chat sozinho, carregado no iframe do widget |
| `public/widget.js` | Script para embutir o widget em qualquer site |
| `public/exemplo-site.html` | Site de exemplo com o widget embutido |

## Rodar localmente

Requer Node 20 ou mais recente.

```bash
cd assistente-rl
npm install
cp .env.example .env.local   # no Windows PowerShell: Copy-Item .env.example .env.local
# edite .env.local e cole sua OPENAI_API_KEY
npm run dev
```

- Demonstração com painel: http://localhost:3000
- Widget num site de exemplo: http://localhost:3000/exemplo-site.html

Sem `OPENAI_API_KEY`, o assistente funciona só com regras e encaminha o resto para humano.

## Publicar na Vercel

1. Suba a pasta `assistente-rl` para um repositório no GitHub.
2. Na Vercel, clique em **Add New → Project** e importe o repositório. Se o repositório tiver outras pastas, defina **Root Directory** como `assistente-rl`.
3. Em **Environment Variables**, cadastre `OPENAI_API_KEY` e, se quiser, `OPENAI_MODEL`, `CONFIDENCE_THRESHOLD` e `WIDGET_ALLOWED_ORIGINS`.
4. Clique em **Deploy**.

Também dá para publicar pelo terminal: `npm i -g vercel`, depois `vercel` dentro da pasta (e `vercel env add OPENAI_API_KEY`).

## Embutir em um site

```html
<script src="https://SEU-PROJETO.vercel.app/widget.js" defer></script>
```

Opcional: `data-color="#1A7748"` e `data-position="left"`. Para limitar quais sites podem embutir o widget, defina `WIDGET_ALLOWED_ORIGINS` (ex.: `https://realleader.com https://www.realleader.com`).

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Chave da OpenAI. Sem ela, modo só regras |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modelo usado nas Camadas 2 e 3 |
| `CONFIDENCE_THRESHOLD` | `0.6` | Confiança mínima para a Camada 3 responder sozinha |
| `WIDGET_ALLOWED_ORIGINS` | qualquer site | Sites que podem embutir o widget |

## Limites do protótipo

- Não há limite de requisições por usuário. Antes de expor publicamente, adicione rate limiting (por exemplo, Vercel Firewall ou Upstash Ratelimit), porque cada mensagem na Camada 2 ou 3 gera custo na OpenAI.
- O "encaminhamento humano" só gera o resumo na tela. Em produção, ele criaria um chamado (e-mail, helpdesk ou planilha).
- Não há acesso aos dados da conta do cliente (saldo de créditos), previsto no documento como evolução.
- A busca nas fontes é por palavras-chave, suficiente para ~14 trechos. Um banco vetorial só se justifica com uma base bem maior.
