-- ============================================================
-- FIX: Actualizar expense_category ENUM a español
--      Agregar columna notes a project_tracking
--      Agregar columna project_id a expenses (si no existe)
-- Ejecutar en Supabase SQL Editor → RUN
-- ============================================================

-- 1. Cambiar expense_category a TEXT para no depender del ENUM rígido
--    (más flexible, permite cualquier categoría)
ALTER TABLE expenses
  ALTER COLUMN category TYPE TEXT;

-- 2. Agregar columna notes a project_tracking (para ingresos rápidos)
ALTER TABLE project_tracking
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Agregar project_id a expenses si no existe
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 4. Asegurar RLS en project_tracking
ALTER TABLE project_tracking ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "rls_v3_project_tracking" ON project_tracking
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Asegurar RLS en expenses (re-crear política limpia)
DO $$ BEGIN DROP POLICY IF EXISTS "rls_v2_expenses" ON expenses; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "rls_v3_expenses" ON expenses; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "rls_v3_expenses" ON expenses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Asegurar RLS en milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "rls_v3_milestones" ON milestones
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Asegurar RLS en todas las tablas principales
DO $$ BEGIN CREATE POLICY "rls_v3_clients"     ON clients     FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "rls_v3_projects"    ON projects    FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "rls_v3_apus"        ON apus        FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "rls_v3_apu_details" ON apu_details FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "rls_v3_alerts"      ON alerts      FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
