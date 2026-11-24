# M1D3 — Seleção de modelo para o assistente do RealLeader

Benchmark do micro-capstone "IA para SaaS": 6 modelos (premium, intermediário, referência, open-source em nuvem e open-source local) comparados nas duas tarefas de IA do assistente em produção.

- **[RESUMO-EXECUTIVO.md](RESUMO-EXECUTIVO.md)**: decisão em uma página, para a liderança
- **[RELATORIO.md](RELATORIO.md)**: tarefa de negócio, plano de benchmark, tabela de métricas, decisão e riscos

| Arquivo | Conteúdo |
| --- | --- |
| `dataset.mjs` | 30 mensagens com gabarito; lê a base de conhecimento direto de `lib/kb.ts` (a mesma da produção) |
| `modelos.mjs` | Modelos, provedores, preços oficiais (24/11/2026), condições e cenários de volume |
| `prompts.mjs` | Prompts de produção (classificação e resposta) e a rubrica do juiz |
| `run.mjs` | Gera, avalia, mede e escreve tabelas e gráficos (retoma de onde parou) |
| `results/tabelas.md` | Tabelas geradas |
| `results/respostas.csv` | As 1.080 saídas, com custo, latência e nota do juiz |
| `results/graficos/` | Nota ponderada, custo mensal, latência e perfil por critério |

## Rodar

```bash
node run.mjs                                   # todos os modelos
node run.mjs --modelos=gpt-4o-mini,gpt-6-luna  # só alguns
node run.mjs --so-relatorio                    # só recalcula
```

Precisa de `OPENAI_API_KEY` e `GROQ_API_KEY` no `.env.local` da raiz do repositório. Para o modelo local: [Ollama](https://ollama.com) com `ollama pull qwen2.5:3b`. O script reaproveita os gráficos de `../m1d2-analise-prompts/charts.mjs` e não tem dependências além do Node.js 20+.
