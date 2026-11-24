# Resumo executivo — Qual modelo de IA usar no assistente do RealLeader

24/11/2026 · Benchmark com 6 modelos, 30 mensagens reais de clientes e 1.080 chamadas

## Decisão

**Manter o GPT-4o mini como modelo do assistente e ter o gpt-oss-120b (open-source) pronto como contingência.** Não contratar os modelos premium agora.

## Por quê, em quatro números

| | GPT-4o mini (recomendado) | Melhor premium (GPT-6.2 Sol) | Modelo local no notebook |
| --- | --- | --- | --- |
| Acerto nas perguntas que chegam à IA | **100%** | 100% | 60% |
| Respostas com informação inventada grave | **0%** | 0% | 18% |
| Tempo de resposta (95% das vezes até) | **3,6 s** | 5,7 s | 33 s |
| Custo mensal com 1.200 mensagens | **US$ 0,16** | US$ 2,60 | sem custo de API, mas inviável |
| Custo mensal com 100 mil mensagens | **US$ 14** | US$ 217 | — |

## O que isso significa para o negócio

1. **Pagar mais não traz mais qualidade aqui.** Os modelos premium erram menos em casos delicados, como reembolso e cupom, mas o assistente já responde esses casos com respostas prontas, sem IA. No que de fato chega à IA, o modelo barato acerta tanto quanto o premium.
2. **O custo hoje é irrisório; em escala, ele define a margem.** Com 100 mil mensagens por mês, o modelo mais caro custaria 60 vezes mais (US$ 840 contra US$ 14) para o mesmo resultado.
3. **Rodar a IA no próprio computador não serve para o produto.** No notebook, sem placa de vídeo, o modelo local é lento (33 s) e inventa informação. Uma IA própria exige servidor com GPU, o que importa para o projeto Oráculo.
4. **Ter dois fornecedores é proteção, não luxo.** Durante o teste, a conta da OpenAI ficou sem saldo e o site passou a encaminhar tudo para humanos. O gpt-oss-120b, de outro fornecedor e com pesos abertos, é o plano B. Ele também é o caminho para hospedar a IA em servidor próprio, se a soberania dos dados virar requisito.

## Próximos passos

| Ação | Responsável | Prazo |
| --- | --- | --- |
| Alertas de saldo e recarga automática na conta OpenAI | Financeiro / técnico | Imediato |
| Corrigir a resposta pronta de "preços", que captura perguntas sobre pacotes da organização | Suporte (pelo admin) | Imediato |
| Configurar o gpt-oss-120b como contingência automática (plano pago da Groq) | Técnico | 30 dias |
| Repetir este benchmark a cada troca de modelo ou de prompt | Técnico | Contínuo |

Relatório completo, com metodologia, tabela de métricas e riscos: [RELATORIO.md](RELATORIO.md).
