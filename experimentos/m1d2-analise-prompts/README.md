# M1D2 — Análise de comportamento do LLM no atendimento do RealLeader

Experimento do micro-capstone da Disciplina 02: 15 perguntas reais de suporte do RealLeader respondidas por 6 estruturas de prompt, 3 vezes cada, avaliadas contra a documentação oficial. Depois, a recomendação foi validada com a estratégia G (v1 e v2).

**Relatório completo: [RELATORIO.md](RELATORIO.md).**

Este experimento roda separado do assistente: tem o próprio `package.json` e não entra no build da Vercel.

## O que o experimento mede

| Medida | Como | Aula relacionada |
| --- | --- | --- |
| Clareza, completude, tom, segurança (1–5) | Modelo juiz com rubrica e gabarito, temperatura 0 | Engenharia de prompt |
| Alucinação (nenhuma / leve / grave) | Juiz compara cada afirmação com a base oficial | LLM: probabilidade não é verdade |
| Comportamento correto | Juiz compara com o comportamento esperado de cada pergunta | Ambiguidade e riscos |
| Fatos do gabarito presentes | Busca determinística de expressões esperadas | — |
| Consistência | Similaridade de cosseno entre os embeddings das 3 execuções | Embeddings e distância de cosseno |
| Estabilidade do comportamento | As 3 execuções acertam ou erram juntas? | Geração token a token |
| Tokens e tempo | `usage` da API | Tokens |
| Temperatura | Estratégia F com temperatura 0 e 1 | Temperatura e previsibilidade |

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `dataset.mjs` | Base de conhecimento (com a fonte de cada trecho), 15 perguntas com gabarito e as 6 estratégias de prompt |
| `run.mjs` | Gera, avalia, mede e escreve os resultados (retoma de onde parou) |
| `charts.mjs` | Gráficos SVG do relatório |
| `riscos.json` | Riscos do mapa de riscos (probabilidade × impacto) |
| `results/raw.json` | Todas as respostas e avaliações brutas |
| `results/respostas.csv` | As 405 respostas (A–F, teste de temperatura e G v1/v2) com notas e justificativa do juiz, para conferência humana |
| `results/tabelas.md` | Tabelas geradas |
| `results/graficos/*.svg` | Gráficos |

## Como reproduzir

Pré-requisitos: Node.js 20+ e uma chave da OpenAI com crédito.

```bash
npm install
# a chave pode vir da variável OPENAI_API_KEY, de um arquivo .env nesta pasta
# (OPENAI_API_KEY=sk-...) ou do .env.local na raiz do repositório
npm run experimento     # ~700 chamadas; alguns minutos
npm run relatorio       # só recalcula tabelas e gráficos a partir de results/raw.json
```

Variáveis opcionais: `MODEL` (padrão `gpt-4o-mini`) e `JUDGE_MODEL` (padrão `gpt-4o`).

Para repetir do zero, apague `results/raw.json`. Como a temperatura principal é 1,0, uma nova execução gera textos diferentes; as médias devem ficar próximas, mas não idênticas.
