export type UserRole = 'admin' | 'employee' | 'supervisor';

export type RecordType = 'entrada' | 'salida';

export type AttendanceStatus = 'puntual' | 'tardanza' | 'salida_anticipada' | 'salida_normal' | 'tiempo_extra' | 'justificado';

export type LeaveType = 'vacaciones' | 'reposo_medico' | 'permiso_especial';

export interface EmployeeLeave {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  reason?: string;
  approved_by?: string;
  is_active: boolean;
  created_at: string;
  employee?: Profile;
}

export interface Profile {
  id: string;
  full_name: string;
  document_id: string; // CI / DNI
  role: UserRole;
  email: string;
  phone?: string;
  position: string; // Cargo
  department: string; // Departamento
  schedule_start: string; // "08:00:00"
  schedule_end: string; // "17:00:00"
  qr_token: string; // Token único para su carnet QR
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  record_type: RecordType;
  timestamp_utc: string; // ISO 8601 UTC
  timestamp_local: string; // e.g. "2026-11-04 08:05:12"
  timezone: string; // e.g. "America/Asuncion"
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null; // Precisión en metros
  location_address?: string | null;
  device_info?: string | null;
  ip_address?: string | null;
  scan_method: 'qr_scan' | 'kiosk_scan' | 'manual_admin';
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
  // Relación con el empleado
  employee?: Profile;
}

export interface SystemSettings {
  id: string;
  company_name: string;
  company_ruc: string;
  timezone: string;
  geofence_enabled: boolean;
  geofence_lat: number;
  geofence_lng: number;
  geofence_radius_meters: number;
  workplace_qr_secret: string;
  tolerance_minutes: number;
  updated_at: string;
}

export interface EmployeeCredentials {
  email: string;
  password: string;
  full_name: string;
  document_id: string;
}
