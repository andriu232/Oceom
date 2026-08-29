-- ============================================================
-- OCEOM by E-MOTION® — Tienda: nuevo tipo de producto 'product'
--
-- Hasta ahora `store_products.kind` solo admitía program/session/pack/
-- membership, así que la mentora no podía cargar un producto suelto
-- (libro, kit, cuarzos, ebook…). 'product' no otorga acceso automático:
-- se comporta como session/pack — la mentora coordina la entrega.
-- ============================================================

alter table store_products
  drop constraint if exists store_products_kind_check;

alter table store_products
  add constraint store_products_kind_check
  check (kind in ('program', 'session', 'pack', 'membership', 'product'));
