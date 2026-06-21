-- ============================================================
-- Moldey Agenda System — Migration
-- Created: 2026-06-21
-- ============================================================

-- ─── moldey_tasks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moldey_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  task_type         TEXT NOT NULL DEFAULT 'lanzamiento_pack',
  status            TEXT NOT NULL DEFAULT 'ideas',
  priority          TEXT NOT NULL DEFAULT 'media',
  start_date        DATE,
  due_date          DATE,
  launch_date       DATE,
  delivery_date     DATE,
  responsible       TEXT NOT NULL DEFAULT '',
  client_name       TEXT NOT NULL DEFAULT '',
  client_contact    TEXT NOT NULL DEFAULT '',
  category          TEXT,
  related_product   TEXT NOT NULL DEFAULT '',
  related_pack      TEXT NOT NULL DEFAULT '',
  sale_channels     TEXT[] NOT NULL DEFAULT '{}',
  marketing_channels TEXT[] NOT NULL DEFAULT '{}',
  estimated_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_payment   NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance           NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales_goal        INTEGER NOT NULL DEFAULT 0,
  sales_result      INTEGER NOT NULL DEFAULT 0,
  pending_files     TEXT NOT NULL DEFAULT '',
  completed_files   TEXT NOT NULL DEFAULT '',
  internal_notes    TEXT NOT NULL DEFAULT '',
  client_notes      TEXT NOT NULL DEFAULT '',
  reference_link    TEXT NOT NULL DEFAULT '',
  payment_status    TEXT NOT NULL DEFAULT 'pendiente',
  delivery_status   TEXT NOT NULL DEFAULT 'pendiente',
  -- Checklist stored as JSONB
  checklist         JSONB NOT NULL DEFAULT '{
    "molde_terminado": false,
    "talles_revisados": false,
    "pdf_a4": false,
    "pdf_plotter": false,
    "cdr": false,
    "dxf": false,
    "plt": false,
    "pds": false,
    "mrk": false,
    "imagen_portada": false,
    "fotos_mockups": false,
    "descripcion_comercial": false,
    "precio_definido": false,
    "prueba_descarga": false,
    "producto_publicado": false,
    "link_descarga_probado": false,
    "archivos_verificados": false
  }'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moldey_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moldey_tasks_select" ON public.moldey_tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "moldey_tasks_insert" ON public.moldey_tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "moldey_tasks_update" ON public.moldey_tasks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "moldey_tasks_delete" ON public.moldey_tasks
  FOR DELETE TO authenticated USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER moldey_tasks_updated_at
  BEFORE UPDATE ON public.moldey_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── moldey_launches ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moldey_launches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  type               TEXT NOT NULL DEFAULT 'pack',
  target_date        DATE,
  status             TEXT NOT NULL DEFAULT 'planificado',
  price              NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales_goal         INTEGER NOT NULL DEFAULT 0,
  related_campaign   TEXT NOT NULL DEFAULT '',
  products_included  TEXT NOT NULL DEFAULT '',
  pending_files      TEXT NOT NULL DEFAULT '',
  notes              TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moldey_launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moldey_launches_select" ON public.moldey_launches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "moldey_launches_insert" ON public.moldey_launches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "moldey_launches_update" ON public.moldey_launches
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "moldey_launches_delete" ON public.moldey_launches
  FOR DELETE TO authenticated USING (true);

-- ─── moldey_campaigns ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moldey_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  promoted_product    TEXT NOT NULL DEFAULT '',
  start_date          DATE,
  end_date            DATE,
  main_channel        TEXT,
  secondary_channels  TEXT[] NOT NULL DEFAULT '{}',
  offer               TEXT NOT NULL DEFAULT '',
  main_message        TEXT NOT NULL DEFAULT '',
  sales_goal          INTEGER NOT NULL DEFAULT 0,
  final_result        INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'borrador',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moldey_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moldey_campaigns_select" ON public.moldey_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "moldey_campaigns_insert" ON public.moldey_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "moldey_campaigns_update" ON public.moldey_campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "moldey_campaigns_delete" ON public.moldey_campaigns
  FOR DELETE TO authenticated USING (true);

-- ─── moldey_custom_orders ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moldey_custom_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name         TEXT NOT NULL,
  client_contact      TEXT NOT NULL DEFAULT '',
  order_name          TEXT NOT NULL,
  garment_type        TEXT NOT NULL DEFAULT '',
  category            TEXT,
  description         TEXT NOT NULL DEFAULT '',
  client_references   TEXT NOT NULL DEFAULT '',
  requested_sizes     TEXT NOT NULL DEFAULT '',
  requested_formats   TEXT NOT NULL DEFAULT '',
  order_date          DATE,
  promised_delivery   DATE,
  price               NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance             NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance             NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status      TEXT NOT NULL DEFAULT 'pendiente',
  status              TEXT NOT NULL DEFAULT 'consulta',
  final_files         TEXT NOT NULL DEFAULT '',
  internal_notes      TEXT NOT NULL DEFAULT '',
  client_notes        TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moldey_custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moldey_custom_orders_select" ON public.moldey_custom_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "moldey_custom_orders_insert" ON public.moldey_custom_orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "moldey_custom_orders_update" ON public.moldey_custom_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "moldey_custom_orders_delete" ON public.moldey_custom_orders
  FOR DELETE TO authenticated USING (true);

-- ─── moldey_free_products ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moldey_free_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          TEXT,
  formats           TEXT[] NOT NULL DEFAULT '{}',
  file_status       TEXT NOT NULL DEFAULT 'pendiente',
  download_link     TEXT NOT NULL DEFAULT '',
  related_campaign  TEXT NOT NULL DEFAULT '',
  objective         TEXT NOT NULL DEFAULT 'captar_clientes',
  publish_date      DATE,
  result            TEXT NOT NULL DEFAULT '',
  next_action       TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moldey_free_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moldey_free_products_select" ON public.moldey_free_products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "moldey_free_products_insert" ON public.moldey_free_products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "moldey_free_products_update" ON public.moldey_free_products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "moldey_free_products_delete" ON public.moldey_free_products
  FOR DELETE TO authenticated USING (true);
