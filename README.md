# Arruma Aqui — MVP

MVP funcional com frontend React e backend Express (dados mockados em memória). Nenhum dado pessoal real é usado.

## Estrutura

```
arruma-aqui-mvp/
  backend/     # API REST em Node + Express
  frontend/    # App em React + Vite + Tailwind
```

## Como rodar

Abra dois terminais.

### 1. Backend (API)

```bash
cd backend
npm install
npm start
```

Sobe em `http://localhost:4000`. Endpoints:

- `GET /api/categories`
- `GET /api/professionals?q=&cat=&maxDist=&sort=rating|dist`
- `GET /api/professionals/:id`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages` — body `{ "text": "..." }`
- `GET /api/user/me`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. Já aponta para a API em `http://localhost:4000/api` (configurável via variável de ambiente `VITE_API_URL`, num arquivo `.env` na pasta `frontend`).

## O que já funciona

- Busca de profissionais (nome, profissão, descrição) e filtro por categoria.
- Filtro por distância e ordenação por avaliação/proximidade.
- Navegação Home → Buscar → Perfil do profissional → Chat.
- Chat com envio de mensagens (persistido em memória no backend enquanto o servidor estiver rodando).
- Perfil do usuário com histórico de solicitações e avaliações.
- Tela de configurações.

## Observações sobre o MVP

- Os dados (profissionais, avaliações, conversas, usuário) são mockados em `backend/data/mockData.js` e vivem em memória — reiniciar o backend reseta tudo.
- Não há autenticação: o "usuário logado" é fixo (Mariana Costa), como ponto de partida para um login futuro.
- Para evoluir para produção: trocar o armazenamento em memória por um banco de dados (Postgres, por exemplo), adicionar autenticação, e versionar a API.
