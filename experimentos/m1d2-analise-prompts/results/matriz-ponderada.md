## Matriz de decisão ponderada (0 a 100)

Cada critério foi convertido para 0–100 (notas 1–5 → (nota − 1) ÷ 4 × 100; percentuais diretos; custo: menos tokens = mais pontos). A nota final é a soma ponderada.

| Critério | Peso | A · Simples | B · Role | C · Estruturado | D · Few-Shot | E · Políticas | F · Híbrido + base |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Segurança | 25% | 60 | 76 | 59 | 78 | 80 | 97 |
| Sem alucinação | 20% | 22 | 33 | 4 | 40 | 24 | 89 |
| Comportamento correto | 20% | 11 | 29 | 24 | 27 | 22 | 87 |
| Completude | 10% | 18 | 35 | 29 | 33 | 32 | 85 |
| Consistência | 10% | 93 | 73 | 93 | 87 | 87 | 100 |
| Tom corporativo | 5% | 82 | 96 | 94 | 95 | 93 | 100 |
| Clareza | 5% | 57 | 72 | 68 | 72 | 70 | 96 |
| Eficiência de custo | 5% | 100 | 96 | 94 | 97 | 95 | 0 |
| **Nota ponderada** | **100%** | **44,8** | **55,5** | **45,6** | **57,9** | **54,1** | **87,6** |

**Por que esses pesos**

| Critério | Peso | Justificativa |
| --- | --- | --- |
| Segurança | 25% | Promessa indevida (reembolso, desconto) ou ceder a manipulação gera prejuízo direto e jurídico. |
| Sem alucinação | 20% | Um fato inventado sobre preço, prazo ou política leva o cliente a uma decisão errada. |
| Comportamento correto | 20% | Mede se a resposta resolve o caso ou encaminha certo: é o resultado que o negócio quer. |
| Completude | 10% | Resposta incompleta gera nova mensagem e reabre o atendimento. |
| Consistência | 10% | O mesmo cliente não pode receber comportamentos diferentes para a mesma pergunta. |
| Tom corporativo | 5% | Importa para a marca, mas é fácil de corrigir com instrução de papel. |
| Clareza | 5% | Todas as estratégias tendem a escrever com clareza; diferencia pouco. |
| Eficiência de custo | 5% | Com modelo pequeno o custo por resposta é baixo; pesa menos que o risco. |

**Sensibilidade aos pesos** (a recomendação muda se os pesos mudarem?)

| Cenário de pesos | Ranking |
| --- | --- |
| Pesos do projeto (risco primeiro) | F > D > B > E > C > A |
| Pesos iguais (12,5% cada) | F > D > B > E > C > A |
| Custo pesando 30% | D > B > E > F > A > C |

**Onde cada estratégia se destaca e onde falha**

| Critério | Melhor | Pior | Diferença |
| --- | --- | --- | --- |
| Segurança | F · Híbrido + base (97) | C · Estruturado (59) | 38 pontos |
| Sem alucinação | F · Híbrido + base (89) | C · Estruturado (4) | 84 pontos |
| Comportamento correto | F · Híbrido + base (87) | A · Simples (11) | 76 pontos |
| Completude | F · Híbrido + base (85) | A · Simples (18) | 67 pontos |
| Consistência | F · Híbrido + base (100) | B · Role (73) | 27 pontos |
| Tom corporativo | F · Híbrido + base (100) | A · Simples (82) | 18 pontos |
| Clareza | F · Híbrido + base (96) | A · Simples (57) | 39 pontos |
| Eficiência de custo | A · Simples (100) | F · Híbrido + base (0) | 100 pontos |

