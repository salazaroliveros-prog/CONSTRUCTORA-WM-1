-- Supabase Initial Schema for CONSTRUCTORA WM/M&S Platform

-- ENUMS
CREATE TYPE project_typology AS ENUM ('Residential', 'Commercial', 'Industrial', 'Civil', 'Public');
CREATE TYPE project_status AS ENUM ('Planning', 'Active', 'Delayed', 'Completed', 'On Hold');
CREATE TYPE apu_type AS ENUM ('Material', 'Labor', 'Equipment');
CREATE TYPE expense_category AS ENUM ('Materials', 'Labor', 'Equipment', 'Health', 'Education', 'Savings', 'Entertainment', 'Other');
CREATE TYPE alert_type AS ENUM ('Info', 'Warning', 'Critical');

-- PROFILES
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CLIENTS
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'Lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROJECTS
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    typology project_typology DEFAULT 'Residential',
    status project_status DEFAULT 'Planning',
    start_date DATE,
    end_date DATE,
    total_budget NUMERIC(12, 2) DEFAULT 0.00,
    financial_deployed NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- APUS (Unit Price Analysis Rows)
CREATE TABLE apus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 0.00,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- APU DETAILS (Materials, Labor, Equipment breakdown)
CREATE TABLE apu_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    apu_id UUID REFERENCES apus(id) ON DELETE CASCADE,
    type apu_type NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 0.00,
    yield_factor NUMERIC(10, 4) DEFAULT 1.0000,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    total_cost NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- EXPENSES (Operational & Personal)
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- NULL means personal/company expense
    category expense_category NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ALERTS
CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type alert_type DEFAULT 'Info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE apus ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Creating basic policies (assuming authenticated users can read/write everything for their org for now)
-- In a real scenario, this would be scoped to user orgs or ownership
CREATE POLICY "Enable read access for all authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON apus FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON apu_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIGGERS
-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
