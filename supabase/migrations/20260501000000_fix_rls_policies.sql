-- ============================================================
-- FIX DEFINITIVO RLS — compatible con sb_publishable_ key
-- Ejecutar en Supabase SQL Editor → RUN (no Explain)
-- ============================================================

-- La key sb_publishable_ NO es un JWT — Supabase la usa solo para
-- identificar el proyecto. El JWT real viene del OAuth de Google.
-- Las políticas deben usar (auth.role() = 'authenticated') que es
-- lo que Supabase establece cuando hay sesión activa válida.

-- ── Limpiar políticas anteriores ─────────────────────────────
DO $$ BEGIN DROP POLICY IF EXISTS "Enable all access for authenticated users" ON clients;      EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Enable all access for authenticated users" ON projects;     EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Enable all access for authenticated users" ON apus;         EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Enable all access for authenticated users" ON apu_details;  EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Enable all access for authenticated users" ON expenses;     EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Enable all access for authenticated users" ON alerts;       EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "auth_full_clients"     ON clients;      EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "auth_full_projects"    ON projects;     EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "auth_full_apus"        ON apus;         EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "auth_full_apu_details" ON apu_details;  EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "auth_full_expenses"    ON expenses;     EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "auth_full_alerts"      ON alerts;       EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- ── Políticas nuevas usando auth.role() ──────────────────────
-- Esto funciona con Google OAuth + Supabase JS v2 + sb_publishable_ key

DO $$ BEGIN
  CREATE POLICY "rls_clients" ON clients
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_projects" ON projects
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_apus" ON apus
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_apu_details" ON apu_details
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_expenses" ON expenses
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_alerts" ON alerts
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
