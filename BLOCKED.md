# Bloqueios (precisam de um humano)


Resolvidos: certificado CA do Supabase (`backend/db/supabase-ca.crt`) e senha do `DATABASE_URL`. Migration 001 aplicada e seed carregado (77 usuários, 60 prestadores, 257 avaliações).

## Decisão da equipe: critério de "adequado" do ranking (Fase 4)
Com a avaliação robusta (96 cenários × 20 bases), o ranking v2 fica em **~74%** (busca simples ~13%). Mas ordenar **só por nota** dá 100%, porque o critério atual ignora a distância. Subir a meta "otimizando para a métrica" faria o app deixar de ser geo-consciente.
**O grupo precisa escolher** um dos critérios sugeridos em `docs/ranking-log.md` (ou outro). Depois disso o loop ajusta os pesos e reavalia.

