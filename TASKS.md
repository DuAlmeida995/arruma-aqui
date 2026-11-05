# Backlog do Arruma Aqui

Ordem = prioridade. O loop faz uma tarefa por iteração (ver `CLAUDE.md`). Entre parênteses, a atividade correspondente no doc FAPESP.

## Fase 0 — Fundação
- [x] Commitar o trabalho de UI pendente; `.gitignore` com `.env*`; `.env.example` no backend e frontend
- [x] Vitest + Supertest no backend com 1 teste de `/api/health`; script `npm test`
- [x] Backend lê `DATABASE_URL` e testa conexão com o Supabase (`/api/health` mostra `db: ok`)

## Fase 1 — Banco (Ativ. 2)
- [x] Migration: extensão PostGIS; tabelas `users`, `provider_profiles` (com `geography(Point)` e `radius_km`), `categories`, `provider_categories`, `availability`, `requests`, `contacts`, `services`, `reviews`, `events`; FKs e índices (GIST na localização)
- [x] Script `npm run db:migrate` que aplica migrations em ordem
- [x] Seed fictício: ~60 prestadores em SP com casos-limite (sem avaliação, região com poucos, notas empatadas, fora da área); `npm run db:seed`
- [x] Trocar `mockData.js` pelas consultas ao banco mantendo os endpoints atuais (front continua funcionando)

## Fase 2 — Contas (Ativ. 5, 7)
- [x] `POST /auth/register` (cliente ou prestador), `POST /auth/login`, `GET /auth/me`; bcrypt + JWT 24h; middleware de papel (validado também no Supabase)
- [x] Telas de cadastro e login; token no front; rotas protegidas; remover usuário fixo "Mariana"
- [x] Onboarding do prestador: categorias, bairro/CEP → coordenada aproximada, raio de atendimento, disponibilidade
- [x] Editar perfil (cliente e prestador); excluir conta (LGPD)

## Fase 3 — Busca geográfica (Ativ. 3)
- [x] Busca com `ST_DWithin` por categoria + ativo + disponibilidade; distância arredondada na resposta
- [ ] Ampliação gradual do raio quando houver menos de N candidatos
- [ ] Testes: exclui fora da categoria/área; distância correta; resposta < 1s

## Fase 4 — Recomendação (Ativ. 4)
- [x] `backend/config/ranking.json` com pesos; score normalizado (distância, nota bayesiana com prior neutro, nº avaliações, disponibilidade, tempo de resposta, contatos bem-sucedidos)
- [ ] Resposta inclui "por que recomendado" (ranking explicável) e a UI mostra isso no card
- [x] `docs/cenarios.json` (elétrica, hidráulica, pintura, montagem, reparos…) + script `npm run eval` que compara ranking vs busca simples e imprime % de cenários adequados (meta ≥ 80%)
- [ ] Ranking ≥ 80% de forma robusta: ampliar cenários e avaliar em várias sementes do seed (hoje oscila 70–90% vs 20–50% da busca simples — ver `docs/ranking-log.md`); revisar critério de "adequado" com a equipe

## Fase 5 — Fluxo principal (Ativ. 5)
- [ ] Cliente cria solicitação (categoria, descrição, quando) → vê lista recomendada
- [ ] Contato direto: chat persistido no banco + botão WhatsApp; prestador vê e responde suas conversas
- [ ] Marcar serviço como realizado → cliente avalia (1–5 + texto); média recalculada
- [ ] Área do prestador: minhas conversas, meus serviços, minhas avaliações

## Fase 6 — Métricas (Ativ. 1, 8)
- [ ] Registrar eventos: solicitação criada, lista exibida, perfil aberto, contato iniciado, resposta do prestador, avaliação
- [ ] Página `/admin/metricas` (só admin): tempo até contato, taxa de contato, conversão, média de satisfação

## Fase 7 — Qualidade e segurança (Ativ. 7)
- [ ] Validação de entrada (zod) em todas as rotas; rate limit no login
- [ ] Testes de controle de acesso (cliente não acessa dados de outro, prestador não avalia, etc.)
- [ ] Cobertura ≥ 70% nas regras de negócio (busca, ranking, auth)

## Fase 8 — Deploy
- [ ] Backend no Render (free) com env vars; CORS restrito ao domínio do front
- [ ] Frontend na Vercel com `VITE_API_URL`; rota SPA funcionando
- [ ] Smoke test no link público: cadastro → busca → contato → avaliação

## Fase 9 — Acabamento (Ativ. 6)
- [ ] Questionário de satisfação (1–5) dentro do app ao fim do fluxo
- [ ] Estados vazios, carregamento e erros revisados em todas as telas
- [ ] README atualizado (como rodar, como fazer deploy, credenciais de demo)
