-- ============================================================
-- OCEOM by E-MOTION® — Pagos / Órdenes (Sprint: Tienda)
-- Habilita la compra self-serve de programas con pasarela (Bold, luego Wompi).
--
-- Modelo: el estudiante crea una orden 'pending' al iniciar el checkout.
-- El WEBHOOK del proveedor (con service role key, que bypassa RLS) es el
-- ÚNICO que puede pasarla a 'approved' y disparar la inscripción. Así nadie
-- puede auto-aprobarse una orden ni acceder a un programa sin pagar.
-- ============================================================

-- Estado de pago de una orden
create type payment_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  program_id uuid not null references programs(id) on delete restrict,
  amount_cop integer not null check (amount_cop >= 0), -- precio congelado al comprar
  status payment_status not null default 'pending',
  provider text not null default 'bold',               -- 'bold' | 'wompi' (futuro)
  provider_reference text unique,                       -- referencia que enviamos y el webhook devuelve
  provider_txn_id text,                                 -- id de transacción del proveedor
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_orders_student on orders(student_id);
create index idx_orders_program on orders(program_id);
create index idx_orders_reference on orders(provider_reference);

create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ---------- RLS ----------
alter table orders enable row level security;

-- El estudiante ve sus propias órdenes; la mentora/super admin ven todas.
create policy "ordenes: estudiante ve las suyas / mentora todas" on orders
  for select using (student_id = auth.uid() or is_mentor());

-- El estudiante solo puede crear SU propia orden y siempre en estado 'pending'.
create policy "ordenes: estudiante crea la suya (pending)" on orders
  for insert with check (student_id = auth.uid() and status = 'pending');

-- Sin policy de UPDATE/DELETE para usuarios normales: la aprobación y la
-- inscripción las hace el webhook con la service role key. Intencional.
