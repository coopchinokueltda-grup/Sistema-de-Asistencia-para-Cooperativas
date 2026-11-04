import { Profile, AttendanceRecord, SystemSettings, EmployeeLeave } from '@/types';

export const INITIAL_SETTINGS: SystemSettings = {
  id: 'config',
  company_name: 'Cooperativa Chinokue Ltda',
  company_ruc: '80054321-7',
  timezone: 'America/Asuncion',
  geofence_enabled: false,
  geofence_lat: -25.2867,
  geofence_lng: -57.6333,
  geofence_radius_meters: 300,
  workplace_qr_secret: 'CHINOKUE-SEDE-CENTRAL-QR-2026',
  tolerance_minutes: 15,
  updated_at: new Date().toISOString(),
};

// Sin datos simulados ni empleados ficticios
export const INITIAL_PROFILES: Profile[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_LEAVES: EmployeeLeave[] = [];

export const STORAGE_KEYS = {
  USER: 'chinokue_auth_user',
  PROFILES: 'chinokue_profiles',
  ATTENDANCE: 'chinokue_attendance',
  SETTINGS: 'chinokue_settings',
  CREDENTIALS: 'chinokue_generated_credentials',
  LEAVES: 'chinokue_employee_leaves',
};
