# Bloqueios (precisam de um humano)

## Deixar o código privado
1. **Render** → serviço `arruma-aqui-api` → **Settings → Build & Deploy → Repository**: troque para `EnricoAranha/arruma-aqui-app` (privado) e salve. Se ele não aparecer, em **Account Settings → GitHub** dê acesso ao repo novo.
2. Confirme um deploy verde e `https://arruma-aqui-api.onrender.com/api/health` com `"db":"ok"`.
3. Só depois: GitHub → `EnricoAranha/arruma-aqui` (fork público) → **Settings → Delete this repository**.
4. **Eduardo**: `DuAlmeida995/arruma-aqui` → **Settings → Danger Zone → Change visibility → Private** (só o dono pode).


Resolvidos: certificado CA do Supabase (`backend/db/supabase-ca.crt`) e senha do `DATABASE_URL`. Migration 001 aplicada e seed carregado (77 usuários, 60 prestadores, 257 avaliações).
