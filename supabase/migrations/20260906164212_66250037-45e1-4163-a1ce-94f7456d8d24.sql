create table if not exists public.rate_limits (
  bucket_key   text        not null,
  fn           text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (bucket_key, fn, window_start)
);

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

create table if not exists public.shadow_daily (
  day     date   not null,
  fn      text   not null,
  outcome text   not null,
  hits    bigint not null default 0,
  primary key (day, fn, outcome)
);

alter table public.rate_limits  enable row level security;
alter table public.shadow_daily enable row level security;

revoke all on public.rate_limits  from anon, authenticated;
revoke all on public.shadow_daily from anon, authenticated;

grant  all on public.rate_limits  to service_role;
grant  all on public.shadow_daily to service_role;

create or replace function public.shadow_outcome_bucket(p_outcome text)
returns text
language sql
immutable
set search_path = pg_temp
as $$
  select case
    when p_outcome is null or p_outcome = '' then 'unknown'
    when p_outcome in (
      'identified','no-header','malformed','expired','not-yet-valid',
      'bad-iss','bad-aud','no-sub','no-kid','unknown-kid','bad-jwk',
      'bad-signature','bad-sig-format','jwks-unavailable',
      'verifier-crashed','shadow-crashed',
      'alg:none','alg:HS256','alg:RS256',
      'role:anon','role:service_role','role:none'
    ) then p_outcome
    when p_outcome like 'alg:%'  then 'alg:other'
    when p_outcome like 'role:%' then 'role:other'
    else 'other'
  end;
$$;

create or replace function public.bump_rate(p_key text, p_fn text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_hits   integer;
begin
  if p_key is null or p_fn is null then
    return null;
  end if;

  insert into public.rate_limits (bucket_key, fn, window_start, hits, updated_at)
  values (left(p_key, 80), left(p_fn, 40), v_window, 1, now())
  on conflict (bucket_key, fn, window_start)
  do update set hits = public.rate_limits.hits + 1, updated_at = now()
  returning hits into v_hits;

  if random() < 0.005 then
    delete from public.rate_limits where window_start < now() - interval '7 days';
  end if;

  return v_hits;
end;
$$;

create or replace function public.record_shadow(p_fn text, p_outcome text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.shadow_daily (day, fn, outcome, hits)
  values (
    current_date,
    left(coalesce(p_fn, 'unknown'), 40),
    public.shadow_outcome_bucket(p_outcome),
    1
  )
  on conflict (day, fn, outcome)
  do update set hits = public.shadow_daily.hits + 1;
end;
$$;

create or replace function public.record_request(p_fn text, p_outcome text, p_key text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hits integer;
begin
  perform public.record_shadow(p_fn, p_outcome);
  v_hits := public.bump_rate(p_key, p_fn);
  return v_hits;
end;
$$;

create or replace function public.rate_metrics(p_days integer default 7)
returns table (
  day            date,
  fn             text,
  kind           text,
  buckets        bigint,
  reqs           bigint,
  max_hits_hour  integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    window_start::date,
    fn,
    case when bucket_key like 'user:%' then 'user' else 'ip' end,
    count(distinct bucket_key),
    sum(hits)::bigint,
    max(hits)
  from public.rate_limits
  where window_start >= (current_date - greatest(coalesce(p_days, 7), 1))
  group by 1, 2, 3
  order by 1 desc, 2, 3;
$$;

revoke execute on function public.shadow_outcome_bucket(text)      from public;
revoke execute on function public.bump_rate(text, text)            from public;
revoke execute on function public.record_shadow(text, text)        from public;
revoke execute on function public.record_request(text, text, text) from public;
revoke execute on function public.rate_metrics(integer)            from public;

grant execute on function public.record_request(text, text, text) to service_role;
grant execute on function public.bump_rate(text, text)            to service_role;
grant execute on function public.record_shadow(text, text)        to service_role;
grant execute on function public.rate_metrics(integer)            to service_role;