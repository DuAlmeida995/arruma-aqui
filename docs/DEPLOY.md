# Deploy gratuito (Render + Vercel + Supabase)

Arquitetura: **frontend** (React/Vite) na **Vercel** → chama a **API** (Express) no **Render** → que usa o **Postgres/PostGIS** do **Supabase**. Tudo no plano gratuito.

O banco já está pronto (migration aplicada e seed carregado). Faltam só as duas contas abaixo, que precisam ser criadas por uma pessoa do grupo.

## 1. Backend no Render (~5 min)

1. Entre em <https://render.com> com o GitHub (conta gratuita).
2. **New → Blueprint** → escolha o repositório `arruma-aqui`. O Render lê o arquivo `render.yaml` da raiz e cria o serviço `arruma-aqui-api`.
3. Ele vai pedir os valores marcados como "sync: false":
   - `DATABASE_URL`: a mesma connection string do `backend/.env` (Supabase → Connect → Transaction pooler, porta 6543).
   - `CORS_ORIGIN`: deixe `http://localhost:5173` por enquanto; você troca no passo 3.
   (`JWT_SECRET` é gerado sozinho; `TRUST_PROXY=1` e `NODE_VERSION=22` já vêm prontos.)
4. Espere o deploy terminar e abra `https://<seu-servico>.onrender.com/api/health`. Tem que aparecer `{"status":"ok","db":"ok"}`.

> O plano gratuito "dorme" depois de 15 min sem uso; a primeira requisição depois disso demora ~50 s. **Antes da apresentação, abra o link um minuto antes.**

## 2. Frontend na Vercel (~3 min)

1. Entre em <https://vercel.com> com o GitHub (plano Hobby, gratuito).
2. **Add New → Project** → importe `arruma-aqui`.
3. Em **Root Directory** escolha `frontend` (o `vercel.json` já define Vite, build e pasta `dist`).
4. Em **Environment Variables** adicione:
   - `VITE_API_URL` = `https://<seu-servico>.onrender.com/api`
5. Deploy. Anote o endereço, ex.: `https://arruma-aqui.vercel.app`.

O app usa rotas com `#` (HashRouter), então recarregar qualquer página funciona sem configuração extra.

## 3. Liberar o front na API

No Render → serviço → **Environment** → `CORS_ORIGIN` = endereço da Vercel (sem barra no final). Pode listar mais de um separado por vírgula, ex.:
`https://arruma-aqui.vercel.app,http://localhost:5173`
Salvar faz o Render reiniciar o serviço.

## 4. Conferir (smoke test)

No link da Vercel:
1. **Entrar** com `cliente@exemplo.com` / `demo1234` → a Home mostra "Recomendados para você".
2. **Descreva o que você precisa** → crie um pedido → aparece a lista recomendada.
3. Abra um profissional → **Conversar** → mande uma mensagem.
4. No chat, **Marcar como realizado** → avalie com estrelas.
5. Saia e entre com `admin@exemplo.com` / `demo1234` → **Métricas da pesquisa** mostra os eventos acima.

Contas de demo (todas fictícias, senha `demo1234`): `cliente@exemplo.com`, `admin@exemplo.com` e qualquer prestador do seed (ex.: `yara.lima@exemplo.com`).

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "Não foi possível conectar ao servidor" | `VITE_API_URL` errado na Vercel (precisa terminar em `/api`) ou o Render ainda acordando |
| Erro de CORS no console do navegador | `CORS_ORIGIN` no Render diferente do endereço exato da Vercel |
| `/api/health` mostra `db: erro: ...password...` | `DATABASE_URL` com a senha errada |
| `/api/health` mostra `self-signed certificate` | o arquivo `backend/db/supabase-ca.crt` não foi para o repositório |

## Antes do piloto

- Apague os eventos de teste: no Supabase → SQL Editor → `delete from events;`
- Se quiser recomeçar a base fictícia: `npm run db:seed` dentro de `backend/` (apaga tudo e recria).

## Diagnóstico de conexão

A API limita a conexão a 10 segundos e a espera por consulta a 8 segundos
(`DB_QUERY_TIMEOUT_MS`). Mantém TCP keepalive e descarta conexões que falham.
Não repete consultas automaticamente: uma resposta perdida não significa que
uma escrita deixou de ser aplicada. Confira o estado antes de repetir uma ação.

`DB_POOL_MAX` controla o máximo de conexões por processo (5 por padrão; 2 nos testes).
Os arquivos de teste rodam em sequência para reduzir a concorrência no banco.
Uma falha de rede não confirma defeito no código nem garante que ele esteja correto:
execute a suíte completa e o build antes de publicar.
