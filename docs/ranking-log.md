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
