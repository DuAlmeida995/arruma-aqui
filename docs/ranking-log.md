# Registro de pesos do ranking

Toda mudança em `backend/config/ranking.json` é registrada aqui (Atividade 4 do doc FAPESP).

## v1 — pesos iniciais
| Fator | Peso | Normalização |
|---|---|---|
| distance | 0.30 | `1 - d / raio_da_busca` |
| rating | 0.30 | nota bayesiana (prior 3,5 com força 5) → `(nota - 1) / 4` |
| reviewCount | 0.10 | `n / (n + 10)` |
| availability | 0.10 | 1 se atende no dia pedido; sem dia, fração da semana |
| responseTime | 0.10 | `60 / (60 + minutos)`; desconhecido = 0,5 |
| successRate | 0.10 | serviços concluídos / contatos, com prior 0,5 (força 3) |

**Motivo:** distância e reputação são os dois critérios centrais da proposta (geo-consciente + confiança), por isso pesos maiores. A nota bayesiana com prior neutro evita que novatos sem avaliação sejam excluídos e que uma única nota 5 supere históricos longos. Desempate: menor distância, depois id.

## v2 — após a primeira avaliação (`npm run eval`)
| Fator | v1 | v2 |
|---|---|---|
| distance | 0.30 | 0.25 |
| rating | 0.30 | 0.45 |
| reviewCount | 0.10 | 0.10 |
| availability | 0.10 | 0.05 |
| responseTime | 0.10 | 0.10 |
| successRate | 0.10 | 0.05 |

Também: `ratingFloor = 3` — a nota passa a ser normalizada como `(nota_bayesiana - 3) / 2`, porque na prática quase todas as notas ficam entre 3 e 5 e a escala 1–5 achatava as diferenças.

**Critério de avaliação ajustado:** um cenário é adequado se os primeiros `k = min(3, nº de adequados existentes)` resultados são adequados (categoria, área, ativo, disponível no dia e nota bayesiana ≥ 3,8). Cenários sem nenhum prestador adequado são marcados como inviáveis e saem da conta — antes, exigir 3 adequados onde só existiam 1 ou 2 tornava a meta impossível.

**Resultado (base fictícia, 14 cenários, 10 viáveis):**
| Versão | Busca simples | Ranking |
|---|---|---|
| v1 | 20% | 30% |
| v2 | 20% | **70%** |

**Abaixo da meta de 80%.** Os 3 cenários que falham são trocas entre distância e reputação (ex.: prestador a 3 km com nota 3,5 aparece antes de um a 8 km com nota 4,1). Variações com peso de nota até 0,50 não passaram de 70%; não forçamos mais os pesos para não sobreajustar a 10 cenários. Observações:
- `availability` quase não discrimina porque a disponibilidade já é filtro eliminatório.
- `successRate` é uniforme na base fictícia (todo contato vira serviço); só terá efeito com dados reais do piloto.
- Próximo passo: ampliar os cenários e revisar se a nota mínima 3,8 é o critério certo de "adequado" com a equipe.

## Observação — sensibilidade à base fictícia
Ao corrigir o gerador do seed (gênero das profissões e descrições repetidas), a sequência aleatória mudou e, **com os mesmos pesos v2**, o resultado foi de 70% → **90%** (busca simples 20% → 50%). Ou seja: com ~10 cenários viáveis, cada cenário vale 10 pontos e o número oscila muito com a base. O ganho do ranking sobre a busca simples se manteve (+40 a +50 pontos), mas **não dá para afirmar que a meta de 80% está garantida** sem mais cenários e, idealmente, avaliar em várias sementes da base.
