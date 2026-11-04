-- ========================================================
-- SISTEMA DE CONTROL DE ASISTENCIA CON QR (NORMATIVA LEGAL)
-- COOPERATIVA CHINOKUE LTDA
-- Script de Base de Datos para Supabase
-- ========================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla de perfiles de usuario (Empleados y Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    document_id TEXT UNIQUE NOT NULL, -- CI / DNI
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'supervisor')),
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT DEFAULT 'Empleado', -- Cargo
    department TEXT DEFAULT 'General', -- Departamento / Sucursal
    schedule_start TIME DEFAULT '08:00:00',
    schedule_end TIME DEFAULT '17:00:00',
    qr_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'), -- Código QR único del carnet
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla de registros de asistencia (Auditoría legal de control horario)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('entrada', 'salida')),
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    timestamp_local TEXT NOT NULL, -- Fecha y hora formateada con timezone legal (Ej: 2026-11-04 08:00:00)
    timezone TEXT NOT NULL DEFAULT 'America/Asuncion',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION, -- Precisión GPS en metros
    location_address TEXT,
    device_info TEXT, -- Dispositivo / Navegador
    ip_address TEXT,
    scan_method TEXT DEFAULT 'qr_scan' CHECK (scan_method IN ('qr_scan', 'kiosk_scan', 'manual_admin')),
    status TEXT DEFAULT 'puntual' CHECK (status IN ('puntual', 'tardanza', 'salida_anticipada', 'salida_normal', 'tiempo_extra', 'justificado')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabla de licencias, reposos médicos y vacaciones
CREATE TABLE IF NOT EXISTS public.employee_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('vacaciones', 'reposo_medico', 'permiso_especial')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabla de configuración de la empresa y normativa
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'config',
    company_name TEXT NOT NULL DEFAULT 'Cooperativa Chinokue Ltda',
    company_ruc TEXT DEFAULT '80000000-0',
    timezone TEXT NOT NULL DEFAULT 'America/Asuncion',
    geofence_enabled BOOLEAN DEFAULT false,
    geofence_lat DOUBLE PRECISION DEFAULT -25.2637,
    geofence_lng DOUBLE PRECISION DEFAULT -57.5759,
    geofence_radius_meters INTEGER DEFAULT 250,
    workplace_qr_secret TEXT NOT NULL DEFAULT 'CHINOKUE-SEDE-CENTRAL-QR-2026',
    tolerance_minutes INTEGER DEFAULT 15,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar configuración inicial por defecto
INSERT INTO public.system_settings (id, company_name, company_ruc, timezone, workplace_qr_secret)
VALUES ('config', 'Cooperativa Chinokue Ltda', '80000000-0', 'America/Asuncion', 'CHINOKUE-SEDE-CENTRAL-QR-2026')
ON CONFLICT (id) DO NOTHING;

-- 5. Trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_settings_updated
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Helper function: verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Activar Row Level Security (RLS) para proteger los datos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de seguridad (RLS) para PROFILES
-- Administrador: control total
CREATE POLICY "Admin full access on profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Empleado: puede ver su propio perfil
CREATE POLICY "Employee view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- 9. Políticas de seguridad (RLS) para ATTENDANCE_RECORDS
-- Administrador: ver y gestionar todas las asistencias
CREATE POLICY "Admin full access on attendance"
    ON public.attendance_records
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Empleados: SOLO pueden VER sus propios registros (No pueden modificar ni borrar)
CREATE POLICY "Employee view own attendance"
    ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (employee_id = auth.uid());

-- Empleados: pueden REGISTRAR (INSERT) su propia asistencia
CREATE POLICY "Employee insert own attendance"
    ON public.attendance_records
    FOR INSERT
    TO authenticated
    WITH CHECK (employee_id = auth.uid());

-- 10. Políticas de seguridad (RLS) para SYSTEM_SETTINGS
-- Todos los usuarios autenticados pueden leer la configuración (para validar QR y Timezone)
CREATE POLICY "Authenticated users can read settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Solo el administrador puede modificar la configuración
CREATE POLICY "Admin update settings"
    ON public.system_settings
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- 11. Índices para reportes rápidos y filtros de auditoría
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance_records(timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_qr_token ON public.profiles(qr_token);
CREATE INDEX IF NOT EXISTS idx_profiles_document_id ON public.profiles(document_id);

-- 12. Row Level Security y Políticas para EMPLOYEE_LEAVES
ALTER TABLE public.employee_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on employee_leaves"
    ON public.employee_leaves
    FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Employee view own leaves"
    ON public.employee_leaves
    FOR SELECT
    TO authenticated
    USING (employee_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_leaves_employee ON public.employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON public.employee_leaves(start_date, end_date);

-- 13. Configuración opcional de Supabase Storage para fotos de carnet
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir lectura pública de las fotos del carnet
CREATE POLICY "Public Access for Employee Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-photos');

-- Permitir a usuarios autenticados y administradores subir fotos
CREATE POLICY "Authenticated users can upload employee photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-photos');

CREATE POLICY "Admin can update or delete employee photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'employee-photos' AND public.is_admin());
