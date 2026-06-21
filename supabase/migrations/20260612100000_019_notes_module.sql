/*
  # Módulo de Notas
  Tabla para guardar notas, ideas y apuntes personales.
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#8B5CF6',
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read notes" ON notes;
DROP POLICY IF EXISTS "Auth insert notes" ON notes;
DROP POLICY IF EXISTS "Auth update notes" ON notes;
DROP POLICY IF EXISTS "Auth delete notes" ON notes;

CREATE POLICY "Auth read notes"   ON notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert notes" ON notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update notes" ON notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete notes" ON notes FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_notes_pinned     ON notes(pinned DESC);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

CREATE OR REPLACE FUNCTION set_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_notes_updated_at();

SELECT 'Módulo Notas listo.' AS status;
