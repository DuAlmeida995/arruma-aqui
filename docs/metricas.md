# Eventos e métricas

Os eventos são gravados pela API na tabela `events` (`user_id`, `type`, `payload` JSON, `created_at`). A gravação nunca bloqueia nem derruba a requisição. Nos testes automáticos ela fica desligada para não misturar dados de teste com os do piloto.

## Eventos registrados

| Evento | Quando | `payload` |
|---|---|---|
| `request_created` | cliente cria um pedido | `requestId`, `cat`, `hasDate` |
| `list_shown` | uma lista de profissionais é exibida (busca ou pedido) | `source` (`search`/`request`), `requestId?`, `cat`, `q`, `sort`, `weekday`, `total`, `radiusKm`, `expanded`, `top` (ids dos 10 primeiros) |
| `profile_opened` | perfil de um profissional é aberto | `providerId` |
| `contact_started` | cliente inicia uma conversa nova | `conversationId`, `providerId`, `requestId?` |
| `provider_replied` | primeira resposta do prestador numa conversa | `conversationId`, `minutes` (tempo até responder) |
| `review_created` | cliente avalia um serviço | `conversationId`, `providerId`, `stars` |

## Métricas (doc FAPESP, seções 6.1 e 6.d)

| Métrica | Fórmula com os eventos |
|---|---|
| Tempo até o contato | para cada `contact_started`, tempo desde o `list_shown` ou `request_created` anterior do mesmo usuário |
| Taxa de contato | usuários com `contact_started` ÷ usuários com `list_shown` |
| Conversão do pedido | pedidos com `contact_started` ligado (`requestId`) ÷ `request_created` |
| Taxa de resposta do prestador | `provider_replied` ÷ `contact_started` |
| Tempo de resposta do prestador | média/mediana de `provider_replied.minutes` |
| Satisfação | média de `review_created.stars` (e o questionário da Fase 9) |
| Posição do contatado | posição do `providerId` do `contact_started` no `top` do último `list_shown`: mostra se o ranking põe no topo quem o cliente escolhe |

**Antes do piloto:** apague os eventos gerados durante o desenvolvimento (`delete from events;`) para começar a contagem do zero.
