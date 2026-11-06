# Bloqueios (precisam de um humano)

## Eduardo: tornar o repositório original privado
`DuAlmeida995/arruma-aqui` → **Settings → Danger Zone → Change visibility → Private** (só o dono pode).
O deploy não depende dele: o Render já publica a partir do repo privado `EnricoAranha/arruma-aqui-app`.

Resolvidos: certificado CA do Supabase (`backend/db/supabase-ca.crt`) e senha do `DATABASE_URL`. Migration 001 aplicada e seed carregado (77 usuários, 60 prestadores, 257 avaliações).
