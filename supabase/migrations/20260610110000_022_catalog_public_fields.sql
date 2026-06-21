-- Migration 022: Public catalog fields
-- SAFE: only adds columns, does not modify or delete anything existing
-- CEO Modeltex is not affected — it ignores unknown columns

ALTER TABLE public.internal_catalog
  ADD COLUMN IF NOT EXISTS public_visible         boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS product_type           text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fabric_recommendation  text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS public_description     text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_offer               boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new                 boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_seller         boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium             boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order             integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slug                   text;

-- Make all currently active items public by default
UPDATE public.internal_catalog
SET public_visible = true
WHERE status = 'active';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_catalog_public_visible ON public.internal_catalog(public_visible);
CREATE INDEX IF NOT EXISTS idx_catalog_sort_order    ON public.internal_catalog(sort_order);
CREATE INDEX IF NOT EXISTS idx_catalog_slug          ON public.internal_catalog(slug);

-- Allow anonymous (public) users to READ only visible items
-- This is what the public catalog uses — read-only, no login needed
DROP POLICY IF EXISTS "Anon read public catalog" ON public.internal_catalog;
CREATE POLICY "Anon read public catalog"
  ON public.internal_catalog FOR SELECT
  TO anon
  USING (public_visible = true);
