// Métricas da pesquisa calculadas a partir da tabela events (fórmulas em docs/metricas.md).
// Filtros: período (from/to) e, só para testes, um conjunto de usuários.
const db = require("../db");

const num = (v) => (v == null ? null : Number(v));
const ratio = (a, b) => (Number(b) > 0 ? Number(a) / Number(b) : null);

async function compute({ from = null, to = null, userIds = null } = {}) {
  // CTE com os eventos do recorte; os demais cálculos partem dela
  const base = `
    with ev as (
      select * from events
       where ($1::timestamptz is null or created_at >= $1)
         and ($2::timestamptz is null or created_at < $2)
         and ($3::bigint[] is null or user_id = any($3))
         -- uso da administração não entra nas métricas
         and (user_id is null or user_id not in (select id from users where role = 'admin'))
    )`;
  const params = [from, to, userIds];

  const counts = await db.query(`${base} select type, count(*) as n, count(distinct user_id) as users from ev group by type`, params);
  const by = Object.fromEntries(counts.rows.map((r) => [r.type, { n: Number(r.n), users: Number(r.users) }]));
  const get = (t) => by[t] || { n: 0, users: 0 };

  // Tempo até o contato: do último list_shown/request_created do mesmo usuário até o contact_started
  const ttc = await db.query(
    `${base}
     select percentile_cont(0.5) within group (order by mins) as mediana, avg(mins) as media, count(*) as n from (
       select extract(epoch from (c.created_at - prev.created_at)) / 60 as mins
         from ev c
         cross join lateral (
           select created_at from ev p
            where p.user_id = c.user_id and p.type in ('list_shown', 'request_created') and p.created_at <= c.created_at
            order by p.created_at desc limit 1
         ) prev
        where c.type = 'contact_started'
     ) t`,
    params
  );

  // Pedidos que viraram contato
  const conv = await db.query(
    `${base}
     select count(distinct (payload->>'requestId')) as n from ev
      where type = 'contact_started' and payload ? 'requestId' and payload->>'requestId' is not null`,
    params
  );

  // Tempo de resposta do prestador
  const reply = await db.query(
    `${base}
     select percentile_cont(0.5) within group (order by (payload->>'minutes')::numeric) as mediana from ev where type = 'provider_replied'`,
    params
  );

  // Satisfação (avaliações feitas no app)
  const sat = await db.query(`${base} select avg((payload->>'stars')::numeric) as media from ev where type = 'review_created'`, params);

  // Posição, na última lista vista, do profissional que o cliente contatou
  const pos = await db.query(
    `${base}
     select avg(position) as media, count(*) filter (where position <= 3) as top3, count(*) as n from (
       select (select ord from jsonb_array_elements_text(l.payload->'top') with ordinality as t(id, ord)
                where t.id = c.payload->>'providerId') as position
         from ev c
         cross join lateral (
           select payload from ev p
            where p.user_id = c.user_id and p.type = 'list_shown' and p.created_at <= c.created_at
            order by p.created_at desc limit 1
         ) l
        where c.type = 'contact_started'
     ) x where position is not null`,
    params
  );

  const t = ttc.rows[0];
  const p = pos.rows[0];
  return {
    period: { from, to },
    totals: {
      requestsCreated: get("request_created").n,
      listsShown: get("list_shown").n,
      profilesOpened: get("profile_opened").n,
      contactsStarted: get("contact_started").n,
      providerReplies: get("provider_replied").n,
      reviews: get("review_created").n,
    },
    contactRate: ratio(get("contact_started").users, get("list_shown").users),
    timeToContactMinutes: { median: num(t.mediana), mean: num(t.media), n: Number(t.n) },
    requestConversion: ratio(conv.rows[0].n, get("request_created").n),
    providerResponseRate: ratio(get("provider_replied").n, get("contact_started").n),
    providerResponseMinutesMedian: num(reply.rows[0].mediana),
    satisfactionMean: num(sat.rows[0].media),
    contactedPosition: { mean: num(p.media), top3Share: ratio(p.top3, p.n), n: Number(p.n) },
  };
}

module.exports = { compute };
