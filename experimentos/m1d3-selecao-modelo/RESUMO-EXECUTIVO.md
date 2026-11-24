# Resumo executivo — Qual modelo de IA usar no assistente do RealLeader

24/11/2026 · Benchmark com 6 modelos, 30 mensagens reais de clientes e 1.080 chamadas

## Decisão

**Manter o GPT-4o mini como modelo do assistente e ter o gpt-oss-120b (open-source) pronto como contingência.** Não contratar os modelos premium agora.

## Tabela de decisão

Cada critério recebe nota de 0 a 100 (maior = melhor). A **nota ponderada** é a soma de nota × peso e define a posição.

| Posição | Modelo | Qualidade (25%) | Risco (20%) | Classificação (10%) | Formato (10%) | Consistência (10%) | Latência (10%) | Custo (15%) | **Nota ponderada** | **Decisão** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1º | **GPT-4o mini** | 90 | 100 | 89 | 100 | 87 | 82 | 100 | **93,2** | **Principal** |
| 2º | GPT-6 Luna | 93 | 100 | 88 | 100 | 98 | 60 | 99 | **92,8** | Sucessor a monitorar |
| 3º | gpt-oss-120b (Groq) | 93 | 97 | 83 | 100 | 80 | 100 | 84 | **91,6** | Contingência / soberania |
| 4º | GPT-6.2 Sol | 97 | 100 | 93 | 100 | 93 | 65 | 33 | **84,3** | Não recomendado agora |
| 5º | GPT-6.2 Astra | 97 | 100 | 98 | 100 | 95 | 66 | 0 | **80,0** | Não recomendado agora |
| 6º | qwen2.5:3b (local) | 54 | 82 | 44 | 99 | 68 | 0 | 100 | **66,3** | Não viável |

**Como cada nota foi calculada**

| Critério | Peso | Nota 0–100 | Por que o peso |
| --- | --- | --- | --- |
| Qualidade | 25% | % de respostas com o comportamento correto (juiz, contra o gabarito oficial) | Resolver o caso do cliente é o objetivo do produto |
| Risco | 20% | 100 − % de respostas com informação inventada grave | Preço ou política inventada gera prejuízo |
| Classificação | 10% | % de acerto de produto + tipo + idioma | Define para onde o caso é encaminhado |
| Formato | 10% | % de JSON válido e no tamanho certo | O sistema depende do formato |
| Consistência | 10% | % de perguntas em que as 3 execuções se comportaram igual | Mesmo cliente, mesmo comportamento |
| Latência | 10% | Tempo em que 95% das respostas chegam (escala log) | Chat exige resposta em segundos |
| Custo | 15% | Custo por mensagem (escala log) | Margem do SaaS conforme o volume |

**O dado que decide:** nas perguntas que chegam à IA no fluxo real (as demais são respondidas por regras), os 5 modelos em nuvem acertaram **100%**. A qualidade empata, e o GPT-4o mini vence por ser o mais barato, o 2º mais rápido e o que tem menor risco junto com os premium.

## Sensibilidade de custo por volume

| Modelo | 1.200 mensagens/mês (hoje) | 100 mil/mês (SaaS com vários clientes) | 1 milhão/mês (escala alta) | Por ano, com 1 milhão/mês | Quantas vezes o recomendado |
| --- | --- | --- | --- | --- | --- |
| **GPT-4o mini** | **US$ 0,16** | **US$ 14** | **US$ 137** | **US$ 1.647** | **1,0×** |
| GPT-6 Luna | US$ 0,17 | US$ 14 | US$ 143 | US$ 1.712 | 1,0× |
| gpt-oss-120b (Groq) | US$ 0,32 | US$ 27 | US$ 268 | US$ 3.212 | 1,9× |
| GPT-6.2 Sol | US$ 2,60 | US$ 217 | US$ 2.170 | US$ 26.042 | 15,8× |
| GPT-6.2 Astra | US$ 10 | US$ 840 | US$ 8.405 | US$ 100.856 | 61,2× |
| qwen2.5:3b (local) | sem custo de API | sem custo de API | sem custo de API | + servidor com GPU | — |

**A decisão muda com o volume?** Não. Quando o volume cresce, o custo passa a pesar mais na decisão, e a vantagem do GPT-4o mini **aumenta**:

| Peso do custo na decisão | 1º lugar | 2º lugar | 3º lugar |
| --- | --- | --- | --- |
| 15% (pesos do projeto) | **GPT-4o mini (93,2)** | GPT-6 Luna (92,8) | gpt-oss-120b (91,6) |
| 25% | **GPT-4o mini (94,0)** | GPT-6 Luna (93,5) | gpt-oss-120b (90,6) |
| 35% | **GPT-4o mini (94,8)** | GPT-6 Luna (94,3) | gpt-oss-120b (89,7) |
| 50% | **GPT-4o mini (96,0)** | GPT-6 Luna (95,4) | gpt-oss-120b (88,4) |

Com 1 milhão de mensagens por mês, escolher o premium mais caro custaria **cerca de US$ 99 mil a mais por ano** (US$ 100.856 contra US$ 1.647) para o mesmo resultado no fluxo real.

## O que isso significa para o negócio

1. **Pagar mais não traz mais qualidade aqui.** Os premium erram menos em casos delicados (reembolso, cupom), mas o assistente já responde esses casos com respostas prontas, sem IA.
2. **Hoje o custo é irrisório; em escala, ele define a margem.** A diferença entre os modelos passa de centavos para dezenas de milhares de dólares por ano.
3. **Rodar a IA no próprio computador não serve para o produto.** Sem placa de vídeo, o modelo local leva 33 s e inventa informação em 18% das respostas. Uma IA própria exige servidor com GPU, o que é relevante para o projeto Oráculo.
4. **Ter dois fornecedores é proteção.** Durante o teste, a conta da OpenAI ficou sem saldo e o site passou a encaminhar tudo para humanos. O gpt-oss-120b, de outro fornecedor e com pesos abertos, é o plano B e o caminho para hospedagem própria.

## Próximos passos

| Ação | Responsável | Prazo |
| --- | --- | --- |
| Alertas de saldo e recarga automática na conta OpenAI | Financeiro / técnico | Imediato |
| Corrigir a resposta pronta de "preços", que captura perguntas sobre pacotes da organização | Suporte (pelo admin) | Imediato |
| Configurar o gpt-oss-120b como contingência automática (plano pago da Groq) | Técnico | 30 dias |
| Repetir este benchmark a cada troca de modelo ou de prompt | Técnico | Contínuo |

Relatório completo, com metodologia, métricas e riscos: [RELATORIO.md](RELATORIO.md). Como reproduzir: [README.md](README.md).
