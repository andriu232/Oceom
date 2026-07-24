-- ============================================================
-- 0019_tienda.sql — Tienda de OCEOM (pagos con Bold).
-- Productos (programas, sesiones 1:1, packs, membresía), órdenes de compra y
-- membresías. Al confirmarse un pago (webhook de Bold) se auto-inscribe al
-- programa y se disparan las comisiones de referido.
-- Imágenes de producto en el bucket público `productos` (auto-creado).
-- Idempotente.
-- ============================================================

-- ---------- Productos (catálogo) ----------
create table if not exists store_products (
  id uuid primary key default uuid_generate_v4(),
  kind text not null default 'program'
    check (kind in ('program', 'session', 'pack', 'membership')),
  title text not null,
  slug text unique not null,
  subtitle text,
  description text,
  image_url text,
  price_cop integer not null check (price_cop >= 1000),
  -- Para kind='program': el programa al que se auto-inscribe al pagar.
  program_id uuid references programs(id) on delete set null,
  -- Para kind='membership': días de acceso que otorga cada compra.
  membership_days integer,
  benefits jsonb not null default '[]',
  status text not null default 'active' check (status in ('active', 'hidden')),
  sort integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_store_products_updated on store_products;
create trigger trg_store_products_updated
  before update on store_products
  for each row execute function set_updated_at();

alter table store_products enable row level security;
drop policy if exists "tienda: mentora gestiona productos" on store_products;
create policy "tienda: mentora gestiona productos" on store_products
  for all using (is_mentor()) with check (is_mentor());
drop policy if exists "tienda: estudiantes ven activos" on store_products;
create policy "tienda: estudiantes ven activos" on store_products
  for select to authenticated using (status = 'active' or is_mentor());

-- ---------- Órdenes ----------
create table if not exists store_orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references store_products(id) on delete set null,
  -- Snapshot al momento de la compra (el producto puede cambiar/borrarse).
  product_title text not null,
  product_kind text not null,
  program_id uuid references programs(id) on delete set null,
  membership_days integer,
  amount_cop integer not null,
  currency text not null default 'COP',
  -- Referencia única que se envía a Bold (data-order-id).
  reference text unique not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'rejected', 'cancelled')),
  bold_payment_id text,
  fulfilled boolean not null default false,
  meta jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz
);

create index if not exists idx_store_orders_buyer on store_orders (buyer_id, created_at desc);
create index if not exists idx_store_orders_reference on store_orders (reference);

alter table store_orders enable row level security;
-- El comprador ve/crea sus órdenes; la mentora ve todas. El webhook actualiza
-- con el service client (bypassa RLS).
drop policy if exists "tienda: comprador ve sus órdenes" on store_orders;
create policy "tienda: comprador ve sus órdenes" on store_orders
  for select using (buyer_id = auth.uid() or is_mentor());
drop policy if exists "tienda: comprador crea su orden" on store_orders;
create policy "tienda: comprador crea su orden" on store_orders
  for insert to authenticated with check (buyer_id = auth.uid());
drop policy if exists "tienda: mentora actualiza órdenes" on store_orders;
create policy "tienda: mentora actualiza órdenes" on store_orders
  for update using (is_mentor());

-- ---------- Membresías (acceso por tiempo) ----------
create table if not exists memberships (
  student_id uuid primary key references profiles(id) on delete cascade,
  active_until timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table memberships enable row level security;
drop policy if exists "membresía: dueño y mentora leen" on memberships;
create policy "membresía: dueño y mentora leen" on memberships
  for select using (student_id = auth.uid() or is_mentor());
drop policy if exists "membresía: mentora gestiona" on memberships;
create policy "membresía: mentora gestiona" on memberships
  for all using (is_mentor()) with check (is_mentor());
