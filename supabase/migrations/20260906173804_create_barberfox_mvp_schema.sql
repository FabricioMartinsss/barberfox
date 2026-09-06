create extension if not exists btree_gist with schema extensions;

create type public.appointment_status as enum (
  'AGENDADO',
  'CONCLUIDO',
  'CANCELADO',
  'NAO_COMPARECEU'
);

create type public.intended_payment_method as enum (
  'PIX',
  'DINHEIRO',
  'CARTAO'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.set_appointment_status_changed_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;

  return new;
end;
$$;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  duration_minutes integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_not_blank check (btrim(name) <> ''),
  constraint services_price_cents_positive check (price_cents > 0),
  constraint services_duration_minutes_range check (duration_minutes between 15 and 240)
);

create unique index services_normalized_name_key
  on public.services (lower(btrim(name)));

create index services_active_idx
  on public.services (active)
  where active;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_not_blank check (btrim(name) <> ''),
  constraint customers_phone_brazilian_e164 check (
    phone ~ '^\\+55[1-9][0-9](?:[2-5][0-9]{7}|9[0-9]{8})$'
  )
);

create unique index customers_phone_key on public.customers (phone);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null,
  starts_at time without time zone not null,
  ends_at time without time zone not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_hours_weekday_range check (weekday between 0 and 6),
  constraint business_hours_interval_valid check (starts_at < ends_at),
  constraint business_hours_minute_precision check (
    extract(second from starts_at) = 0
    and extract(second from ends_at) = 0
  ),
  constraint business_hours_no_overlap_or_touch exclude using gist (
    weekday with =,
    tsrange(
      timestamp '2000-01-01' + starts_at,
      timestamp '2000-01-01' + ends_at,
      '[]'
    ) with &&
  )
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_price_cents_positive check (price_cents > 0),
  constraint products_image_path_not_blank check (image_path is null or btrim(image_path) <> '')
);

create index products_active_idx
  on public.products (active)
  where active;

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_title_not_blank check (btrim(title) <> ''),
  constraint promotions_interval_valid check (starts_at <= ends_at),
  constraint promotions_image_path_not_blank check (image_path is null or btrim(image_path) <> '')
);

create index promotions_active_period_idx
  on public.promotions (starts_at, ends_at)
  where active;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  service_name_snapshot text not null,
  service_price_cents_snapshot integer not null,
  service_duration_minutes_snapshot integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  intended_payment_method public.intended_payment_method not null,
  status public.appointment_status not null default 'AGENDADO',
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_service_name_snapshot_not_blank check (btrim(service_name_snapshot) <> ''),
  constraint appointments_service_price_snapshot_positive check (service_price_cents_snapshot > 0),
  constraint appointments_service_duration_snapshot_range check (
    service_duration_minutes_snapshot between 15 and 240
  ),
  constraint appointments_interval_valid check (starts_at < ends_at),
  constraint appointments_no_overlapping_occupied_intervals exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'CANCELADO')
);

create index appointments_customer_id_idx on public.appointments (customer_id);
create index appointments_service_id_idx on public.appointments (service_id);
create index appointments_status_starts_at_idx on public.appointments (status, starts_at);

create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_blocks_interval_valid check (starts_at < ends_at),
  constraint schedule_blocks_reason_not_blank check (reason is null or btrim(reason) <> ''),
  constraint schedule_blocks_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  )
);

create table public.product_interests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint product_interests_appointment_product_key unique (appointment_id, product_id)
);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger business_hours_set_updated_at
before update on public.business_hours
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger appointments_set_status_changed_at
before update on public.appointments
for each row execute function public.set_appointment_status_changed_at();

create trigger schedule_blocks_set_updated_at
before update on public.schedule_blocks
for each row execute function public.set_updated_at();

alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.business_hours enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.product_interests enable row level security;

revoke all on table public.services from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.business_hours from anon, authenticated;
revoke all on table public.schedule_blocks from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.promotions from anon, authenticated;
revoke all on table public.product_interests from anon, authenticated;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_appointment_status_changed_at() from public;
