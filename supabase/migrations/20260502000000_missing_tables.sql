-- ============================================================
-- CONSTRUCTORA WM/M&S — Tablas adicionales
-- SIN dependencias externas — ejecutar solo este archivo
-- Supabase SQL Editor → seleccionar TODO → RUN
-- ============================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE payroll_status AS ENUM ('Pending','Authorized','Paid','Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE phase_status AS ENUM ('Pending','In Progress','Completed','Delayed','On Hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('Upcoming','In Progress','Completed','Critical','Delayed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('Contract','Plan','Report','Invoice','Photo','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employee_role AS ENUM ('Capataz','Oficial','Ayudante','Operador','Seguridad','Administrativo','Subcontrato','Otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── project_tracking ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_tracking (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id     UUID,
    snapshot_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    physical_pct   NUMERIC(5,2) DEFAULT 0.00,
    financial_pct  NUMERIC(5,2) DEFAULT 0.00,
    income         NUMERIC(12,2) DEFAULT 0.00,
    expenses_total NUMERIC(12,2) DEFAULT 0.00,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── schedule_phases ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_phases (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id   UUID,
    phase_number INTEGER NOT NULL DEFAULT 1,
    name         TEXT NOT NULL,
    description  TEXT,
    start_day    INTEGER NOT NULL DEFAULT 1,
    end_day      INTEGER NOT NULL DEFAULT 10,
    status       phase_status DEFAULT 'Pending',
    is_critical  BOOLEAN DEFAULT false,
    color        TEXT DEFAULT '#1a2b44',
    created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── milestones ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id  UUID,
    name        TEXT NOT NULL,
    description TEXT,
    due_date    DATE NOT NULL,
    status      milestone_status DEFAULT 'Upcoming',
    is_critical BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── employees ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id    UUID,
    full_name     TEXT NOT NULL,
    employee_code TEXT,
    role          employee_role DEFAULT 'Ayudante',
    daily_rate    NUMERIC(10,2) DEFAULT 0.00,
    phone         TEXT,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── payroll ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id   UUID,
    project_id    UUID,
    period_start  DATE NOT NULL DEFAULT CURRENT_DATE,
    period_end    DATE NOT NULL DEFAULT CURRENT_DATE,
    days_worked   NUMERIC(5,1) DEFAULT 0,
    gross_amount  NUMERIC(10,2) DEFAULT 0.00,
    deductions    NUMERIC(10,2) DEFAULT 0.00,
    net_amount    NUMERIC(10,2) DEFAULT 0.00,
    status        payroll_status DEFAULT 'Pending',
    authorized_at TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── documents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id   UUID,
    name         TEXT NOT NULL,
    type         document_type DEFAULT 'Other',
    file_url     TEXT,
    file_size_kb INTEGER,
    created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── notifications (sin FK a alerts) ─────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_ref  UUID,
    channel    TEXT NOT NULL DEFAULT 'app',
    recipient  TEXT,
    title      TEXT,
    message    TEXT,
    sent_at    TIMESTAMPTZ,
    delivered  BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE project_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_phases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- ── Políticas ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "rls_project_tracking" ON project_tracking
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_schedule_phases" ON schedule_phases
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_milestones" ON milestones
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_employees" ON employees
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_payroll" ON payroll
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_documents" ON documents
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "rls_notifications" ON notifications
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pt_project    ON project_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_sp_project    ON schedule_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_ms_project    ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_ms_due        ON milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_emp_project   ON employees(project_id);
CREATE INDEX IF NOT EXISTS idx_pay_employee  ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_status    ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_doc_project   ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_notif_channel ON notifications(channel);
