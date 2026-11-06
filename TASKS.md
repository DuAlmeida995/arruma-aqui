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
- [x] Ampliação gradual do raio quando houver menos de N candidatos
- [x] Testes: exclui fora da categoria/área; distância correta; resposta < 1s (p95 ≈ 330 ms com o Supabase em us-east-1)

## Fase 4 — Recomendação (Ativ. 4)
- [x] `backend/config/ranking.json` com pesos; score normalizado (distância, nota bayesiana com prior neutro, nº avaliações, disponibilidade, tempo de resposta, contatos bem-sucedidos)
- [x] Resposta inclui "por que recomendado" (ranking explicável) e a UI mostra isso no card
- [x] `docs/cenarios.json` (elétrica, hidráulica, pintura, montagem, reparos…) + script `npm run eval` que compara ranking vs busca simples e imprime % de cenários adequados (meta ≥ 80%)
- [x] Avaliação robusta: 96 cenários gerados × 20 bases (`npm run eval:robusto`) com linhas de base — ranking ~74% vs busca simples ~13%
- [x] Critério "nota + proximidade" (decisão da equipe) e pesos v3: ranking 83,6% vs busca simples 28,4% (`docs/ranking-log.md`)

## Fase 5 — Fluxo principal (Ativ. 5)
- [x] Cliente cria solicitação (categoria, descrição, quando) → vê lista recomendada
- [x] Contato direto: chat persistido no banco + botão WhatsApp; prestador vê e responde suas conversas
- [x] Marcar serviço como realizado → cliente avalia (1–5 + texto); média recalculada
- [x] Área do prestador: minhas conversas, meus serviços, minhas avaliações

## Fase 6 — Métricas (Ativ. 1, 8)
- [x] Registrar eventos: solicitação criada, lista exibida, perfil aberto, contato iniciado, resposta do prestador, avaliação (ver `docs/metricas.md`)
- [x] Página `/admin/metricas` (só admin): tempo até contato, taxa de contato, conversão, média de satisfação

## Fase 7 — Qualidade e segurança (Ativ. 7)
- [x] Validação de entrada (zod) em todas as rotas; rate limit no login
- [x] Testes de controle de acesso (cliente não acessa dados de outro, prestador não avalia, etc.)
- [x] Cobertura ≥ 70% nas regras de negócio (busca, ranking, auth) — hoje 91% linhas / 80% branches; `npm run coverage` falha abaixo de 70%

## Fase 8 — Deploy
- [x] Configuração pronta: `render.yaml` (Blueprint), CORS restrito por `CORS_ORIGIN`, `TRUST_PROXY`, guia `docs/DEPLOY.md`
- [x] Fork `EnricoAranha/arruma-aqui` para o deploy (o original é do Eduardo)
- [ ] (BLOQUEADO: alguém do grupo cria a conta — ver BLOCKED.md) Backend no Render com env vars
- ~~Frontend na Vercel~~ (decisão: o produto é app; sem link web)
- [ ] Smoke test no app apontando para o Render: cadastro → busca → contato → avaliação (depende do Render)

## Fase 9 — Acabamento (Ativ. 6)
- [x] Questionário de satisfação (1–5) dentro do app ao fim do fluxo
- [x] Estados vazios, carregamento e erros revisados em todas as telas
- [x] README atualizado (como rodar, como fazer deploy, credenciais de demo)

## Fase 10 — App Android (Capacitor, webview)
- [x] Capacitor 6 no frontend; projeto `android/`; nome "Arruma Aqui" (id `br.com.arrumaaqui.app`)
- [x] CORS libera as origens do app; barra de status escura; conteúdo fora da área da barra (target SDK 34)
- [x] APK de debug gerado (`npm run app:apk`, exige API https) e testado no emulador contra o backend local (`npm run app:apk:local`): login, Home e conversas OK
- [ ] Ícone próprio do app (hoje usa o ícone padrão do Capacitor)
- [ ] APK final apontando para o Render + smoke test no celular (depende do Render) — guia em `docs/APP.md`
- ~~iOS~~ (decisão da equipe: só Android por enquanto)
