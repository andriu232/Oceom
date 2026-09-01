-- ============================================================
-- 0032_tienda_ecommerce.sql — OCEOM SHOP
--
-- Convierte la tienda interna (un producto = una orden, solo para alumnas)
-- en un ecommerce completo y PÚBLICO: carrito multi-producto, variantes,
-- inventario, envíos con dirección, estados del pedido y entrega digital
-- de infoproductos.
--
-- Compatibilidad: `store_orders` conserva `amount_cop`, `product_title`,
-- `product_kind`, `program_id` y `membership_days` como snapshot de la
-- PRIMERA línea, para que el webhook de Bold y las órdenes ya existentes
-- sigan funcionando sin tocarlas.
--
-- Idempotente.
-- ============================================================

-- ============================================================
-- 1. CATEGORÍAS (colecciones de la vitrina)
-- ============================================================
create table if not exists store_categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort integer not null default 0,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table store_categories enable row level security;
drop policy if exists "categorías: lectura pública" on store_categories;
create policy "categorías: lectura pública" on store_categories
  for select using (status = 'active' or is_mentor());
drop policy if exists "categorías: mentora gestiona" on store_categories;
create policy "categorías: mentora gestiona" on store_categories
  for all using (is_mentor()) with check (is_mentor());

-- ============================================================
-- 2. PRODUCTOS — campos de ecommerce real
-- ============================================================
alter table store_products
  add column if not exists short_description text,
  add column if not exists gallery jsonb not null default '[]',
  add column if not exists category_id uuid references store_categories(id) on delete set null,
  -- Chips de intención ("Calma", "Enraizar", "Claridad"…): taxonomía
  -- transversal que atraviesa físicos e infoproductos.
  add column if not exists intentions text[] not null default '{}',
  -- Físico: pide dirección y cobra envío.
  add column if not exists requires_shipping boolean not null default false,
  add column if not exists track_stock boolean not null default false,
  add column if not exists stock integer not null default 0,
  add column if not exists weight_g integer,
  -- Precio tachado (para mostrar descuento).
  add column if not exists compare_at_price_cop integer,
  -- Infoproducto descargable: ruta en el bucket privado `infoproductos`.
  add column if not exists digital_path text,
  add column if not exists digital_name text,
  add column if not exists featured boolean not null default false,
  -- Visible en la vitrina pública (sin sesión).
  add column if not exists is_public boolean not null default true,
  -- Aviso legal por producto (suplementos: no sustituye tratamiento médico).
  add column if not exists legal_note text;

create index if not exists idx_store_products_category on store_products (category_id);
create index if not exists idx_store_products_public
  on store_products (status, is_public, sort);

-- La vitrina es pública: cualquiera (anon) ve los productos activos y
-- públicos. La política vieja exigía sesión.
drop policy if exists "tienda: estudiantes ven activos" on store_products;
drop policy if exists "tienda: vitrina pública" on store_products;
create policy "tienda: vitrina pública" on store_products
  for select using ((status = 'active' and is_public) or is_mentor());

-- ============================================================
-- 3. VARIANTES (tamaño, presentación, fecha de una sesión…)
-- ============================================================
create table if not exists store_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references store_products(id) on delete cascade,
  title text not null,
  sku text,
  -- Nulo = hereda el precio del producto.
  price_cop integer check (price_cop is null or price_cop >= 1000),
  track_stock boolean not null default false,
  stock integer not null default 0,
  -- Un infoproducto puede entregar un archivo distinto por variante.
  digital_path text,
  digital_name text,
  image_url text,
  sort integer not null default 0,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_store_variants_product on store_variants (product_id, sort);

alter table store_variants enable row level security;
drop policy if exists "variantes: lectura pública" on store_variants;
create policy "variantes: lectura pública" on store_variants
  for select using (status = 'active' or is_mentor());
drop policy if exists "variantes: mentora gestiona" on store_variants;
create policy "variantes: mentora gestiona" on store_variants
  for all using (is_mentor()) with check (is_mentor());

-- ============================================================
-- 4. TARIFAS DE ENVÍO (por zona, con envío gratis desde X)
-- ============================================================
create table if not exists store_shipping_rates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  -- Departamentos que cubre esta tarifa. Vacío = tarifa por defecto
  -- (resto del país).
  states text[] not null default '{}',
  price_cop integer not null default 0 check (price_cop >= 0),
  -- Desde este subtotal, el envío es gratis. Nulo = nunca.
  free_over_cop integer,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table store_shipping_rates enable row level security;
drop policy if exists "envíos: lectura pública" on store_shipping_rates;
create policy "envíos: lectura pública" on store_shipping_rates
  for select using (active or is_mentor());
drop policy if exists "envíos: mentora gestiona" on store_shipping_rates;
create policy "envíos: mentora gestiona" on store_shipping_rates
  for all using (is_mentor()) with check (is_mentor());

-- Tarifas iniciales para Colombia (Valeria las edita desde el panel).
insert into store_shipping_rates (name, states, price_cop, free_over_cop, sort)
select * from (values
  ('Bogotá D.C.', array['Bogotá D.C.'], 12000, 250000, 1),
  ('Ciudades principales', array['Antioquia','Valle del Cauca','Atlántico','Santander','Cundinamarca'], 15000, 250000, 2),
  ('Resto del país', '{}'::text[], 19000, 250000, 3)
) as v(name, states, price_cop, free_over_cop, sort)
where not exists (select 1 from store_shipping_rates);

-- ============================================================
-- 5. ÓRDENES — cabecera de pedido (compra como invitada incluida)
-- ============================================================

-- El comprador puede no tener cuenta: `buyer_id` pasa a ser opcional.
alter table store_orders alter column buyer_id drop not null;

alter table store_orders
  -- Datos de contacto (siempre, tenga cuenta o no).
  add column if not exists email text,
  add column if not exists buyer_name text,
  add column if not exists phone text,
  -- Totales.
  add column if not exists subtotal_cop integer not null default 0,
  add column if not exists shipping_cop integer not null default 0,
  -- Envío.
  add column if not exists requires_shipping boolean not null default false,
  add column if not exists shipping_doc text,
  add column if not exists shipping_address text,
  add column if not exists shipping_address2 text,
  add column if not exists shipping_city text,
  add column if not exists shipping_state text,
  add column if not exists shipping_notes text,
  add column if not exists carrier text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  -- Estado logístico, independiente del estado del pago.
  add column if not exists fulfillment_status text not null default 'none',
  -- Enlace privado para que una invitada consulte su pedido y descargue
  -- sus infoproductos sin tener cuenta.
  add column if not exists claim_token uuid not null default uuid_generate_v4(),
  -- Cuántas líneas tiene (para la lista del panel).
  add column if not exists item_count integer not null default 1;

alter table store_orders drop constraint if exists store_orders_fulfillment_check;
alter table store_orders add constraint store_orders_fulfillment_check
  check (fulfillment_status in ('none','pending','preparing','shipped','delivered','cancelled'));

create unique index if not exists idx_store_orders_claim on store_orders (claim_token);
create index if not exists idx_store_orders_email on store_orders (email, created_at desc);
create index if not exists idx_store_orders_fulfillment
  on store_orders (fulfillment_status, created_at desc);

-- Las órdenes viejas (una línea) quedan coherentes con el nuevo modelo.
update store_orders
   set subtotal_cop = amount_cop
 where subtotal_cop = 0 and amount_cop > 0;

-- La compradora invitada no tiene sesión: la orden la crea el service client
-- desde el checkout. Esta política solo cubre a quien SÍ tiene cuenta.
drop policy if exists "tienda: comprador ve sus órdenes" on store_orders;
create policy "tienda: comprador ve sus órdenes" on store_orders
  for select using (
    (buyer_id is not null and buyer_id = auth.uid()) or is_mentor()
  );

-- ============================================================
-- 6. LÍNEAS DEL PEDIDO
-- ============================================================
create table if not exists store_order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references store_orders(id) on delete cascade,
  product_id uuid references store_products(id) on delete set null,
  variant_id uuid references store_variants(id) on delete set null,
  -- Snapshot: el producto puede cambiar de precio o desaparecer.
  title text not null,
  variant_title text,
  kind text not null,
  image_url text,
  qty integer not null default 1 check (qty > 0),
  unit_price_cop integer not null,
  total_cop integer not null,
  -- Entrega automática según el tipo.
  program_id uuid references programs(id) on delete set null,
  membership_days integer,
  digital_path text,
  digital_name text,
  requires_shipping boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_store_order_items_order on store_order_items (order_id);

alter table store_order_items enable row level security;
drop policy if exists "líneas: comprador y mentora" on store_order_items;
create policy "líneas: comprador y mentora" on store_order_items
  for select using (
    is_mentor() or exists (
      select 1 from store_orders o
       where o.id = order_id
         and o.buyer_id is not null
         and o.buyer_id = auth.uid()
    )
  );

-- ============================================================
-- 7. DESCARGAS DE INFOPRODUCTOS
-- Un permiso por línea comprada. El enlace se sirve desde
-- /api/descargas/<token>, que firma una URL temporal de Storage.
-- ============================================================
create table if not exists store_downloads (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references store_orders(id) on delete cascade,
  order_item_id uuid references store_order_items(id) on delete cascade,
  token uuid not null default uuid_generate_v4(),
  path text not null,
  name text,
  email text,
  downloads integer not null default 0,
  max_downloads integer not null default 25,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_store_downloads_token on store_downloads (token);
create index if not exists idx_store_downloads_order on store_downloads (order_id);

alter table store_downloads enable row level security;
drop policy if exists "descargas: mentora" on store_downloads;
create policy "descargas: mentora" on store_downloads
  for select using (is_mentor());

-- ============================================================
-- 8. INVENTARIO ATÓMICO
-- Descontar stock con `update ... set stock = stock - n` desde la app abre
-- una carrera entre dos compras simultáneas. Esta función descuenta dentro
-- de la transacción y devuelve false si ya no alcanza.
-- ============================================================
create or replace function store_take_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_qty integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean := false;
begin
  if p_qty is null or p_qty < 1 then
    return false;
  end if;

  if p_variant_id is not null then
    update store_variants
       set stock = stock - p_qty
     where id = p_variant_id
       and (not track_stock or stock >= p_qty)
    returning true into v_ok;
    return coalesce(v_ok, false);
  end if;

  update store_products
     set stock = stock - p_qty
   where id = p_product_id
     and (not track_stock or stock >= p_qty)
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- Disponibilidad para la vitrina (sin exponer el inventario exacto).
create or replace function store_in_stock(p_product_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when exists (select 1 from store_variants v
                  where v.product_id = p_product_id and v.status = 'active')
    then exists (select 1 from store_variants v
                  where v.product_id = p_product_id
                    and v.status = 'active'
                    and (not v.track_stock or v.stock > 0))
    else coalesce((select not p.track_stock or p.stock > 0
                     from store_products p where p.id = p_product_id), false)
  end;
$$;

-- ============================================================
-- 9. LOS SUPLEMENTOS YA CARGADOS ESTABAN MAL CLASIFICADOS
-- Valeria subió Cordyceps, Reishi, Chaga, Melena de León y Ashwagandha
-- como kind='program' (era la única opción del formulario), así que al
-- pagarlos no pedían dirección ni descontaban inventario. Se corrigen a
-- producto físico con envío.
-- ============================================================
update store_products
   set kind = 'product',
       requires_shipping = true,
       track_stock = false,
       program_id = null
 where kind = 'program'
   and program_id is null
   and title ~* '(suplemento|cordyceps|reishi|chaga|melena de leon|melena de león|ashwagandha)';

-- Categorías de arranque.
insert into store_categories (slug, name, description, sort)
select * from (values
  ('suplementos', 'Suplementos', 'Hongos funcionales y adaptógenos para sostener el cuerpo.', 1),
  ('rituales', 'Rituales', 'Objetos y herramientas para acompañar la práctica.', 2),
  ('infoproductos', 'Formación', 'Guías, audios y programas para descargar o vivir en el santuario.', 3),
  ('sesiones', 'Sesiones', 'Encuentros 1:1 y experiencias con Valeria.', 4)
) as v(slug, name, description, sort)
where not exists (select 1 from store_categories);

-- Los suplementos, a su categoría.
update store_products p
   set category_id = c.id
  from store_categories c
 where c.slug = 'suplementos'
   and p.category_id is null
   and p.title ~* '(suplemento|cordyceps|reishi|chaga|melena|ashwagandha)';
