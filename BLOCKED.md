# Bloqueios (precisam de um humano)

## 1. ~~Certificado CA do Supabase~~ — resolvido
`backend/db/supabase-ca.crt` salvo; a conexão TLS verificada funciona.

## 2. Senha do banco incorreta (Fase 0.3)
O Supabase responde `password authentication failed for user "postgres"`. Usuário, host e porta do `DATABASE_URL` estão no formato certo; só a senha não confere.
1. Supabase Dashboard → **Project Settings → Database → Reset database password** (use só letras e números para evitar problemas de URL).
2. Troque a senha no `DATABASE_URL` do `backend/.env`.
3. Dentro de `backend/`: `node -e 'require("./db").checkDb().then(console.log)'` deve imprimir `ok`.
