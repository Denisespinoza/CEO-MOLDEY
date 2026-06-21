-- Migration 023: Gallery support for catalog products
-- SAFE: only creates new table, does not modify internal_catalog

CREATE TABLE IF NOT EXISTS public.catalog_product_images (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES public.internal_catalog(id) ON DELETE CASCADE,
  image_url   text        NOT NULL DEFAULT '',
  sort_order  integer     NOT NULL DEFAULT 0,
  is_main     boolean     NOT NULL DEFAULT false,
  alt_text    text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cpi_product_id ON public.catalog_product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_cpi_sort       ON public.catalog_product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_cpi_main       ON public.catalog_product_images(product_id, is_main);

ALTER TABLE public.catalog_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage product images"
  ON public.catalog_product_images FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon read product images"
  ON public.catalog_product_images FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_catalog
      WHERE id = catalog_product_images.product_id
        AND public_visible = true
    )
  );
