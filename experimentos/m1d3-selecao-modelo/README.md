# M1D3 — Seleção de modelo para o assistente do RealLeader

Benchmark do micro-capstone "IA para SaaS": 6 modelos (premium, intermediário, referência, open-source em nuvem e open-source local) comparados nas duas tarefas de IA do assistente em produção.

- **[RESUMO-EXECUTIVO.md](RESUMO-EXECUTIVO.md)**: decisão, tabela de decisão consolidada e sensibilidade de custo, para a liderança
- **[RELATORIO.md](RELATORIO.md)**: tarefa de negócio, plano de benchmark, métricas, decisão e riscos

## 1. Pré-requisitos

| Item | Para quê | Obrigatório? |
| --- | --- | --- |
| Node.js 20 ou mais recente | Rodar o `run.mjs` (não há `npm install`: o script só usa recursos do Node) | Sim |
| Chave da OpenAI com saldo | Modelos GPT, juiz (`gpt-4o`) e embeddings | Sim |
| Chave da Groq | Modelo `openai/gpt-oss-120b` | Só para esse modelo |
| [Ollama](https://ollama.com) com `qwen2.5:3b` | Modelo local | Só para o modelo local |

## 2. Variáveis de ambiente

O script lê as variáveis do ambiente ou do arquivo **`.env.local` na raiz do repositório** (`assistente-rl/.env.local`), o mesmo do assistente.

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `OPENAI_API_KEY` | `sk-proj-...` | Modelos GPT, juiz e embeddings (obrigatória) |
| `GROQ_API_KEY` | `gsk_...` | Modelo `openai/gpt-oss-120b` na Groq |
| `MODELO_LOCAL` | `qwen2.5:3b` (padrão) | Troca o modelo do Ollama, ex.: `llama3.2:3b` (precisa de `ollama pull` antes). Lida só do ambiente do terminal, não do `.env.local` |

Exemplo de `.env.local`:

```ini
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
```

Para o modelo local, o Ollama precisa estar rodando em `http://localhost:11434` (o aplicativo do Ollama inicia o servidor sozinho):

```bash
ollama pull qwen2.5:3b
```

## 3. Comandos

Rode dentro desta pasta (`experimentos/m1d3-selecao-modelo`).

| Comando | O que faz |
| --- | --- |
| `node run.mjs` | Roda o benchmark completo: todos os modelos, o juiz, a consistência e as tabelas. Retoma de onde parou se for interrompido |
| `node run.mjs --modelos=gpt-4o-mini,gpt-6-luna` | Roda só os modelos indicados (IDs separados por vírgula, como em `modelos.mjs`) |
| `node run.mjs --modelos=openai/gpt-oss-120b` | Só o modelo da Groq; refaz automaticamente chamadas que falharam por limite de uso (HTTP 429) |
| `node run.mjs --modelos=qwen2.5:3b` | Só o modelo local (lento sem GPU: ~30 a 60 min num notebook) |
| `node run.mjs --so-relatorio` | Não chama nenhuma API: recalcula tabelas, gráficos e o CSV a partir de `results/raw.json` |

No PowerShell (Windows), para passar a chave só para um comando:

```powershell
$env:OPENAI_API_KEY="sk-proj-..."; node run.mjs --modelos=gpt-4o-mini
```

Para refazer tudo do zero, apague `results/raw.json`. Como a temperatura é 1, os textos mudam a cada execução, e as médias devem ficar próximas, mas não idênticas.

## 4. Custo, tempo e limites

| Item | Valor medido |
| --- | --- |
| Custo dos 6 modelos no benchmark completo | ~US$ 2 (mais o juiz e os embeddings) |
| Modelo mais caro | GPT-6.2 Astra, ~US$ 1,50 |
| Tempo dos 5 modelos em nuvem | ~20 min |
| Tempo do modelo local (notebook sem GPU) | ~30 a 60 min |
| Plano gratuito da Groq | Limita chamadas por minuto: o script usa 1 chamada por vez e espera o tempo pedido pela Groq |

## 5. Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `dataset.mjs` | 30 mensagens com gabarito; lê a base de conhecimento de `lib/kb.ts` (a mesma da produção) |
| `modelos.mjs` | Modelos, provedores, preços oficiais (24/11/2026), condições e volumes |
| `prompts.mjs` | Prompts de produção (classificação e resposta) e rubrica do juiz |
| `run.mjs` | Gera, avalia, mede e escreve resultados |
| `results/tabelas.md` | Todas as tabelas, inclusive a tabela de decisão e a sensibilidade de custo |
| `results/resumo.json` | Métricas por modelo, em JSON |
| `results/respostas.csv` | As 1.080 saídas, com custo, latência e nota do juiz |
| `results/raw.json` | Dados brutos (respostas, avaliações, embeddings) |
| `results/graficos/` | Nota ponderada, custo mensal, latência e perfil por critério |

O script reaproveita os gráficos de `../m1d2-analise-prompts/charts.mjs`.
