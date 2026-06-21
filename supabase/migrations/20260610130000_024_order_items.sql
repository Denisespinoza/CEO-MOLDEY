-- Migration 024: Multiple articles per order
-- SAFE: only adds a JSONB column. Existing orders keep working with their
-- top-level fields (garment_type, sizes, quantity, price). The items column
-- holds the per-article breakdown for new multi-article orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
