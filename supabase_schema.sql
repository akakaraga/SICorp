-- ============================================================
-- SICorp HRIS Lite - Supabase Database Schema
-- Run this in: Supabase > SQL Editor
-- ============================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. EMPLOYEES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'hrd')),
  department_id uuid NOT NULL REFERENCES departments(id),
  manager_id uuid REFERENCES employees(id),
  leave_balance_annual integer NOT NULL DEFAULT 12,
  leave_balance_sick integer NOT NULL DEFAULT 14,
  created_at timestamptz DEFAULT now()
);

-- 3. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type varchar(50) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'maternity', 'unpaid')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  attachment_url varchar(500),
  manager_notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- ============================================================
-- PERMISSIONS / GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid infinite recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_hrd()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = auth.uid() AND role = 'hrd'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ---- DEPARTMENTS POLICIES ----
DROP POLICY IF EXISTS "departments_read_all" ON departments;
DROP POLICY IF EXISTS "departments_hrd_write" ON departments;
CREATE POLICY "departments_read_all" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_hrd_write" ON departments FOR ALL TO authenticated
  USING (public.is_hrd())
  WITH CHECK (public.is_hrd());

-- ---- EMPLOYEES POLICIES ----
DROP POLICY IF EXISTS "employees_read_own" ON employees;
DROP POLICY IF EXISTS "employees_manager_read_subordinates" ON employees;
DROP POLICY IF EXISTS "employees_hrd_read_all" ON employees;
DROP POLICY IF EXISTS "employees_hrd_write" ON employees;
DROP POLICY IF EXISTS "employees_update_own" ON employees;

CREATE POLICY "employees_read_own" ON employees FOR SELECT TO authenticated 
  USING (id = auth.uid());
CREATE POLICY "employees_manager_read_subordinates" ON employees FOR SELECT TO authenticated 
  USING (manager_id = auth.uid());
CREATE POLICY "employees_hrd_read_all" ON employees FOR SELECT TO authenticated
  USING (public.is_hrd());
CREATE POLICY "employees_hrd_write" ON employees FOR ALL TO authenticated
  USING (public.is_hrd())
  WITH CHECK (public.is_hrd());
CREATE POLICY "employees_update_own" ON employees FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ---- LEAVE REQUESTS POLICIES ----
DROP POLICY IF EXISTS "leave_read_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_insert_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_manager_read_subordinates" ON leave_requests;
DROP POLICY IF EXISTS "leave_manager_update_subordinates" ON leave_requests;
DROP POLICY IF EXISTS "leave_hrd_read_all" ON leave_requests;
DROP POLICY IF EXISTS "leave_hrd_update_all" ON leave_requests;

CREATE POLICY "leave_read_own" ON leave_requests FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "leave_insert_own" ON leave_requests FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "leave_manager_read_subordinates" ON leave_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM employees WHERE employees.id = leave_requests.employee_id AND employees.manager_id = auth.uid()));
CREATE POLICY "leave_manager_update_subordinates" ON leave_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees WHERE employees.id = leave_requests.employee_id AND employees.manager_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM employees WHERE employees.id = leave_requests.employee_id AND employees.manager_id = auth.uid()));
CREATE POLICY "leave_hrd_read_all" ON leave_requests FOR SELECT TO authenticated
  USING (public.is_hrd());
CREATE POLICY "leave_hrd_update_all" ON leave_requests FOR UPDATE TO authenticated
  USING (public.is_hrd())
  WITH CHECK (public.is_hrd());

-- ============================================================
-- SEED DATA (for development)
-- ============================================================
INSERT INTO departments (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Human Resources'),
  ('00000000-0000-0000-0000-000000000002', 'Engineering'),
  ('00000000-0000-0000-0000-000000000003', 'Finance')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE SETUP (run in Supabase Dashboard > Storage)
-- ============================================================
-- 1. Create bucket named "leave-attachments" (Private)
-- 2. Add storage policy for authenticated users to upload their own files:
--    INSERT: bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]
-- 3. Add storage policy for owners/managers/HRD to read files.

-- ============================================================
-- SUPABASE REALTIME (Enable WebSocket broadcasts)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees, public.departments, public.leave_requests;


