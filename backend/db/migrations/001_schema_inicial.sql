-- 001: schema inicial do Arruma Aqui (Postgres + PostGIS no Supabase)
-- Coordenadas em geography(Point, 4326): distâncias em metros com ST_Distance / ST_DWithin.
-- LGPD: guardamos coordenada aproximada (centro do bairro/CEP), nunca o endereço completo.

create extension if not exists postgis;

-- Usuários (clientes, prestadores e admin) -----------------------------------
create table users (
  id            bigserial primary key,
  name          text        not null check (length(trim(name)) > 0),
  email         text        not null unique,
  password_hash text        not null,
  role          text        not null check (role in ('client', 'provider', 'admin')),
  phone         text,
  bairro        text,
  city          text,
  location      geography(Point, 4326),
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index users_role_idx on users (role) where deleted_at is null;

-- Categorias de serviço ------------------------------------------------------
create table categories (
  id    text primary key,          -- ex.: 'eletrica'
  label text not null,
  icon  text not null
);

-- Perfil do prestador --------------------------------------------------------
create table provider_profiles (
  user_id              bigint primary key references users (id) on delete cascade,
  role_title           text          not null,              -- ex.: 'Eletricista'
  description          text          not null default '',
  experience_years     smallint      check (experience_years >= 0),
  bairro               text          not null,
  city                 text          not null,
  location             geography(Point, 4326) not null,
  radius_km            numeric(5, 1) not null default 10 check (radius_km > 0),
  active               boolean       not null default true,
  whatsapp             text,
  avg_response_minutes integer       check (avg_response_minutes >= 0),
  created_at           timestamptz   not null default now()
);
create index provider_profiles_location_gix on provider_profiles using gist (location);
create index provider_profiles_active_idx on provider_profiles (active);

create table provider_categories (
  provider_id bigint not null references provider_profiles (user_id) on delete cascade,
  category_id text   not null references categories (id),
  services    text[] not null default '{}',
  primary key (provider_id, category_id)
);
create index provider_categories_category_idx on provider_categories (category_id);

-- Disponibilidade semanal (0 = domingo ... 6 = sábado)
create table availability (
  id          bigserial primary key,
  provider_id bigint   not null references provider_profiles (user_id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time     not null,
  end_time    time     not null,
  check (end_time > start_time)
);
create index availability_provider_weekday_idx on availability (provider_id, weekday);

-- Solicitação do cliente -----------------------------------------------------
create table requests (
  id           bigserial primary key,
  client_id    bigint      not null references users (id) on delete cascade,
  category_id  text        not null references categories (id),
  description  text        not null default '',
  desired_date date,
  location     geography(Point, 4326),
  status       text        not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at   timestamptz not null default now()
);
create index requests_client_idx on requests (client_id);

-- Contato direto cliente ↔ prestador (uma conversa) --------------------------
create table contacts (
  id           bigserial primary key,
  request_id   bigint      references requests (id) on delete set null,
  client_id    bigint      not null references users (id) on delete cascade,
  provider_id  bigint      not null references provider_profiles (user_id) on delete cascade,
  created_at   timestamptz not null default now(),
  responded_at timestamptz,                       -- primeira resposta do prestador
  unique (client_id, provider_id, request_id)
);
create index contacts_provider_idx on contacts (provider_id);
create index contacts_client_idx on contacts (client_id);

create table messages (
  id         bigserial primary key,
  contact_id bigint      not null references contacts (id) on delete cascade,
  sender_id  bigint      not null references users (id) on delete cascade,
  text       text        not null check (length(trim(text)) > 0),
  created_at timestamptz not null default now()
);
create index messages_contact_idx on messages (contact_id, created_at);

-- Serviço realizado e avaliação ---------------------------------------------
create table services (
  id           bigserial primary key,
  contact_id   bigint      not null unique references contacts (id) on delete cascade,
  client_id    bigint      not null references users (id) on delete cascade,
  provider_id  bigint      not null references provider_profiles (user_id) on delete cascade,
  status       text        not null default 'done' check (status in ('done', 'cancelled')),
  completed_at timestamptz not null default now()
);
create index services_provider_idx on services (provider_id);

create table reviews (
  id          bigserial primary key,
  service_id  bigint      not null unique references services (id) on delete cascade,
  client_id   bigint      not null references users (id) on delete cascade,
  provider_id bigint      not null references provider_profiles (user_id) on delete cascade,
  stars       smallint    not null check (stars between 1 and 5),
  text        text        not null default '',
  created_at  timestamptz not null default now()
);
create index reviews_provider_idx on reviews (provider_id);

-- Eventos para as métricas da pesquisa ---------------------------------------
create table events (
  id         bigserial primary key,
  user_id    bigint      references users (id) on delete set null,
  type       text        not null check (type in (
               'request_created', 'list_shown', 'profile_opened',
               'contact_started', 'provider_replied', 'review_created',
               'satisfaction_answered')),
  payload    jsonb       not null default '{}',
  created_at timestamptz not null default now()
);
create index events_type_created_idx on events (type, created_at);

-- Visão de reputação usada pela busca/ranking --------------------------------
create view provider_stats as
select
  p.user_id                              as provider_id,
  coalesce(avg(r.stars), 0)::numeric(3, 2) as rating_avg,
  count(r.id)                            as rating_count,
  (select count(*) from contacts c where c.provider_id = p.user_id)  as contacts_count,
  (select count(*) from services s where s.provider_id = p.user_id and s.status = 'done') as services_done
from provider_profiles p
left join reviews r on r.provider_id = p.user_id
group by p.user_id;
