# Arruma Aqui — instruções para o Claude

Plataforma que conecta clientes a prestadores de serviços domésticos com **recomendação geo-consciente** (distância + confiança/avaliações) e **contato direto** (sem leilão de leads, sem comissão). Projeto de disciplina baseado na proposta FAPESP do grupo. Meta: protótipo **funcional e publicado online** até o fim da disciplina.

## Stack (decidido — não trocar)
- `frontend/`: React 18 + Vite + Tailwind + react-router. Mobile-first (largura máx. 430px). Deploy: Vercel.
- `backend/`: Node + Express. Migração gradual para TypeScript (arquivos novos em `.ts`, rodando com `tsx`). Deploy: Render (free).
- Banco: **Supabase (Postgres + PostGIS)**, acessado do backend via `pg` com `DATABASE_URL`. Migrations SQL versionadas em `backend/db/migrations/`, seed fictício em `backend/db/seed/`.
- Auth própria: senha com bcrypt, JWT com expiração, papéis `client` e `provider`.
- Testes: Vitest + Supertest no backend; `npm run build` no frontend tem que passar.

## Regras do loop
1. Leia `TASKS.md`, pegue a **primeira tarefa não marcada** e faça só ela.
2. Antes de commitar: `npm test --prefix backend` e `npm run build --prefix frontend` passando. Teste visualmente no preview quando mexer em tela.
3. Marque a tarefa como `[x]` no `TASKS.md`, commit pequeno em português (`feat: ...`, `fix: ...`) e `git push` na `main`. Faça `git pull --rebase` antes de pushar (colegas também commitam). Depois do push, rode `git push deploy main` (repo privado `EnricoAranha/arruma-aqui-app`, usado no deploy do Render).
4. Se travar por algo que só o humano resolve (senha, conta, decisão de produto), escreva em `BLOCKED.md` o que precisa e **pule para a próxima tarefa independente**. Nunca invente credenciais.
5. Nunca commitar `.env`, chaves ou dados pessoais reais. Só dados fictícios.
6. Interface e mensagens de erro em português, explicando o problema e o que fazer.
7. LGPD: endereço exato nunca aparece na lista/perfil público — só bairro e distância arredondada.
8. Pesos do ranking ficam em `backend/config/ranking.json`; toda mudança de peso registra o motivo em `docs/ranking-log.md`.
