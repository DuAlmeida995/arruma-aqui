# Arruma Aqui

Protótipo de uma plataforma que conecta clientes a prestadores de serviços domésticos em São Paulo. Recomenda profissionais por distância, reputação e disponibilidade, explica as recomendações e permite combinar o serviço diretamente pelo chat ou WhatsApp.

## Tecnologias e estrutura

- `frontend/`: React 18, Vite e Tailwind; interface em português e navegação com HashRouter.
- `backend/`: Node.js 22, Express, autenticação JWT e consultas com `pg`.
- Banco: PostgreSQL com PostGIS no Supabase. Dados persistidos; o seed contém apenas pessoas fictícias.
- `backend/db/migrations/`: evolução do banco; `backend/config/ranking.json`: pesos da recomendação.
- `TASKS.md`: andamento; `BLOCKED.md`: decisões e acessos pendentes.

## Executar localmente

Pré-requisitos: Node.js 22 e um banco PostgreSQL com PostGIS acessível. O projeto usa Supabase; obtenha a conexão em Connect → Transaction pooler (porta 6543).

```bash
npm ci --prefix backend
npm ci --prefix frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Preencha `backend/.env` com `DATABASE_URL` e um `JWT_SECRET` próprio. Use o certificado CA do seu banco; `DB_CA_CERT` permite indicar o caminho. A verificação TLS fica ativa. Não versione arquivos `.env` nem credenciais reais.

```bash
npm run db:migrate --prefix backend
```

Em um banco exclusivo para demonstração, você pode carregar os dados fictícios com o comando abaixo. **Ele apaga os dados existentes e recria a base**; não o execute em um banco com dados que queira preservar.

```bash
npm run db:seed --prefix backend
```

Em dois terminais:

```bash
npm start --prefix backend
npm run dev --prefix frontend
```

Frontend: `http://localhost:5173`; API: `http://localhost:4000/api`. `GET /api/health` deve informar `db: "ok"`. `VITE_API_URL` deve terminar em `/api`.

## Demonstração

Após carregar o seed, todas estas contas usam a senha fictícia `demo1234`:

| Papel | E-mail |
|---|---|
| Cliente | `cliente@exemplo.com` |
| Administrador | `admin@exemplo.com` |
| Prestador | `yara.lima@exemplo.com` |

Fluxo: entrar como cliente → criar pedido → abrir um recomendado → conversar → marcar o serviço como realizado → avaliar o profissional → responder opcionalmente à satisfação com o app. O prestador acompanha conversas, serviços e avaliações em seu painel. A administração acompanha métricas em `/#/admin/metricas`.

## Validação

```bash
npm test --prefix backend
npm run coverage --prefix backend
npm run build --prefix frontend
npm run eval --prefix backend
npm run eval:robusto --prefix backend
```

Os testes de integração usam o banco configurado em `backend/.env` e criam/removem registros fictícios. Use um banco de desenvolvimento com migrations e seed aplicados. Sem conexão e certificado configurados, parte dos testes é pulada. Os testes rodam em sequência para reduzir concorrência no Supabase. A cobertura exige pelo menos 70% para linhas, funções, comandos e ramos nas regras de negócio.

## Funcionalidades

- Cadastro e login de clientes e prestadores; edição e exclusão da conta com anonimização.
- Perfis profissionais com categorias, raio de atendimento e disponibilidade semanal.
- Busca geográfica com PostGIS, filtros e ampliação gradual do raio.
- Ranking explicável, com avaliação robusta documentada em `docs/ranking-log.md`.
- Pedidos, chat persistido, contato por WhatsApp, conclusão e avaliação do serviço.
- Questionário opcional de satisfação com o app, registrado uma vez por serviço.
- Métricas administrativas de contato, resposta, conversão e satisfação.
- Validação de entradas, controle de acesso, limite de tentativas de autenticação e CORS configurável.

A localização pública mostra bairro e distância arredondada. Preço, prazo e pagamento são combinados diretamente entre cliente e profissional.

## Publicação e limitações

Siga [o guia de deploy](docs/DEPLOY.md) para publicar a API no Render e o frontend na Vercel, configurar as variáveis e verificar o fluxo no link público. O banco deve receber todas as migrations antes de usar a nova versão. Instabilidades de conexão têm limites de espera; a API não repete SQL automaticamente.

Ainda dependem do grupo: configurar as contas de hospedagem, fornecer os links públicos e escolher um critério de adequação do ranking que considere distância. O teste completo no ambiente publicado depende desses links. Consulte [os bloqueios](BLOCKED.md) e [as tarefas](TASKS.md).
