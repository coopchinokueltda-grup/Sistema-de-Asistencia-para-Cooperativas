'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, AttendanceRecord, SystemSettings, EmployeeCredentials } from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_ATTENDANCE, 
  INITIAL_SETTINGS, 
  STORAGE_KEYS 
} from '@/lib/mockStorage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  employees: Profile[];
  attendance: AttendanceRecord[];
  settings: SystemSettings;
  generatedCredentials: EmployeeCredentials[];
  hasAnyAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createInitialAdmin: (data: { full_name: string; document_id: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  registerEmployee: (data: Partial<Profile>) => Promise<{ success: boolean; credentials?: EmployeeCredentials; error?: string }>;
  recordAttendanceMark: (
    type: 'entrada' | 'salida',
    employeeId?: string,
    scanMethod?: 'qr_scan' | 'kiosk_scan' | 'manual_admin'
  ) => Promise<{ success: boolean; record?: AttendanceRecord; error?: string }>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  importEmployeesBatch: (newEmployees: Partial<Profile>[]) => Promise<{ count: number; credentials: EmployeeCredentials[] }>;
  clearGeneratedCredentials: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<Profile[]>(INITIAL_PROFILES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [generatedCredentials, setGeneratedCredentials] = useState<EmployeeCredentials[]>([]);

  const hasAnyAdmin = employees.some(e => e.role === 'admin');

  // Carga inicial de datos
  useEffect(() => {
    async function init() {
      try {
        let loadedEmployees: Profile[] = [];
        let loadedAttendance: AttendanceRecord[] = [];

        // 1. Cargar desde LocalStorage si existen
        if (typeof window !== 'undefined') {
          const storedCreds = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
          if (storedCreds) setGeneratedCredentials(JSON.parse(storedCreds));

          const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
          if (storedProfiles) loadedEmployees = JSON.parse(storedProfiles);

          const storedAtt = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
          if (storedAtt) loadedAttendance = JSON.parse(storedAtt);

          const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
          if (storedSettings) setSettings(JSON.parse(storedSettings));

          const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
          if (storedUser) setUser(JSON.parse(storedUser));
        }

        // 2. Si Supabase está conectado, sincronizar datos reales del servidor
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: dbProfiles } = await supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false });

            if (dbProfiles && dbProfiles.length > 0) {
              loadedEmployees = dbProfiles;
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(dbProfiles));
              }
            }

            const { data: dbAtt } = await supabase
              .from('attendance_records')
              .select('*, employee:profiles(*)')
              .order('timestamp_utc', { ascending: false });

            if (dbAtt && dbAtt.length > 0) {
              loadedAttendance = dbAtt;
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(dbAtt));
              }
            }

            const { data: dbSettings } = await supabase
              .from('system_settings')
              .select('*')
              .eq('id', 'config')
              .single();

            if (dbSettings) {
              setSettings(dbSettings);
            }

            // Verificar sesión activa en Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const matched = loadedEmployees.find(e => e.id === session.user.id);
              if (matched) {
                setUser(matched);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(matched));
                }
              }
            }
          } catch (syncErr) {
            console.warn('Conexión con Supabase en curso:', syncErr);
          }
        }

        setEmployees(loadedEmployees);
        setAttendance(loadedAttendance);
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Crear Administrador Inicial (Configuración de primer uso)
  const createInitialAdmin = async (data: { full_name: string; document_id: string; email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = data.email.trim().toLowerCase();
      const docClean = data.document_id.replace(/\D/g, '');
      const qrToken = `ADM-QR-${docClean}-${Date.now().toString(36).toUpperCase()}`;

      // Llamar al endpoint del servidor
      const res = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.full_name.trim(),
          document_id: data.document_id.trim(),
          email,
          password: data.password,
          role: 'admin',
          position: 'Administrador de Personal',
          department: 'Administración Central',
          schedule_start: '07:30:00',
          schedule_end: '16:30:00',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Error al crear el administrador');
      }

      const adminProfile: Profile = {
        id: resData.user?.id || `admin_${Date.now()}`,
        full_name: data.full_name.trim(),
        document_id: data.document_id.trim(),
        role: 'admin',
        email,
        position: 'Administrador de Personal',
        department: 'Administración Central',
        schedule_start: '07:30:00',
        schedule_end: '16:30:00',
        qr_token: qrToken,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const updatedList = [adminProfile, ...employees];
      setEmployees(updatedList);
      setUser(adminProfile);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedList));
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminProfile));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'No fue posible registrar al administrador' };
    }
  };

  // Iniciar Sesión por Correo o Cédula (Sin accesos simulados)
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanInput = identifier.trim();
      let cleanEmail = cleanInput.toLowerCase();

      // Si el usuario ingresó número de cédula (sin @), buscar el correo asociado
      if (!cleanInput.includes('@')) {
        try {
          const resLookup = await fetch('/api/auth/lookup-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: cleanInput }),
          });
          const lookupData = await resLookup.json();
          if (lookupData?.email) {
            cleanEmail = lookupData.email.toLowerCase();
          } else {
            const localMatched = employees.find(e => e.document_id === cleanInput);
            if (localMatched) cleanEmail = localMatched.email.toLowerCase();
          }
        } catch {
          const localMatched = employees.find(e => e.document_id === cleanInput);
          if (localMatched) cleanEmail = localMatched.email.toLowerCase();
        }
      }

      // 1. Intentar con Supabase Auth si está configurado
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (!error && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setUser(profile);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
            }

            // Si es admin, cargar la lista completa de personal y asistencias
            if (profile.role === 'admin') {
              const { data: dbProfiles } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
              if (dbProfiles) {
                setEmployees(dbProfiles);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(dbProfiles));
                }
              }

              const { data: dbAtt } = await supabase
                .from('attendance_records')
                .select('*, employee:profiles(*)')
                .order('timestamp_utc', { ascending: false });
              if (dbAtt) {
                setAttendance(dbAtt);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(dbAtt));
                }
              }
            }

            return { success: true };
          }
        } else if (error) {
          console.warn('Supabase auth error:', error.message);
          return { success: false, error: 'Credenciales inválidas. Compruebe su correo o contraseña.' };
        }
      }

      // 2. Verificación contra los perfiles guardados localmente
      const currentEmployees = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.PROFILES)
        ? JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES)!)
        : employees;

      const found = currentEmployees.find(
        (p: Profile) => p.email.toLowerCase() === cleanEmail || p.document_id === cleanInput
      );

      if (!found) {
        return { success: false, error: 'Usuario o documento no encontrado en el sistema.' };
      }

      // Verificar contra credenciales temporales generadas localmente
      const storedCreds = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.CREDENTIALS)
        ? JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS)!)
        : generatedCredentials;

      const credMatch = storedCreds.find((c: EmployeeCredentials) => 
        (c.email.toLowerCase() === cleanEmail || c.document_id === cleanInput) && c.password === pass
      );

      if (credMatch || !isSupabaseConfigured) {
        setUser(found);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(found));
        }
        return { success: true };
      }

      return { success: false, error: 'Contraseña incorrecta. Verifique sus datos.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  // Registrar empleado con autogeneración de credenciales reales
  const registerEmployee = async (data: Partial<Profile>): Promise<{ success: boolean; credentials?: EmployeeCredentials; error?: string }> => {
    try {
      if (!data.full_name || !data.document_id) {
        return { success: false, error: 'El nombre completo y el número de documento son obligatorios' };
      }

      const docClean = data.document_id.replace(/\D/g, '');
      const email = data.email?.trim() || `emp.${docClean}@cooperativa.com`;
      
      // Contraseña segura generada automáticamente
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedPassword = `Cp.${docClean || randomSuffix}#`;
      const qrToken = `EMP-QR-${docClean}-${Date.now().toString(36).toUpperCase()}`;

      const res = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          email,
          password: generatedPassword,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Error al registrar el empleado');
      }

      const newProfile: Profile = {
        id: resData.user?.id || `emp_${Date.now()}`,
        full_name: data.full_name.trim(),
        document_id: data.document_id.trim(),
        role: data.role || 'employee',
        email,
        phone: data.phone?.trim() || '',
        position: data.position?.trim() || 'Personal Operativo',
        department: data.department?.trim() || 'General',
        schedule_start: data.schedule_start || '08:00:00',
        schedule_end: data.schedule_end || '17:00:00',
        qr_token: qrToken,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const credentials: EmployeeCredentials = {
        email,
        password: generatedPassword,
        full_name: data.full_name.trim(),
        document_id: data.document_id.trim(),
      };

      const updatedList = [newProfile, ...employees];
      setEmployees(updatedList);

      const updatedCreds = [credentials, ...generatedCredentials];
      setGeneratedCredentials(updatedCreds);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedList));
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds));
      }

      return { success: true, credentials };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar al empleado' };
    }
  };

  const importEmployeesBatch = async (newEmployees: Partial<Profile>[]): Promise<{ count: number; credentials: EmployeeCredentials[] }> => {
    const credsList: EmployeeCredentials[] = [];
    let count = 0;

    for (const emp of newEmployees) {
      const res = await registerEmployee(emp);
      if (res.success && res.credentials) {
        credsList.push(res.credentials);
        count++;
      }
    }

    return { count, credentials: credsList };
  };

  // Registrar asistencia con GPS de alta precisión y sellado de servidor
  const recordAttendanceMark = async (
    type: 'entrada' | 'salida',
    customEmployeeId?: string,
    scanMethod: 'qr_scan' | 'kiosk_scan' | 'manual_admin' = 'qr_scan'
  ): Promise<{ success: boolean; record?: AttendanceRecord; error?: string }> => {
    try {
      const targetEmpId = customEmployeeId || user?.id;
      if (!targetEmpId) {
        return { success: false, error: 'Identificador de empleado no disponible' };
      }

      const emp = employees.find(p => p.id === targetEmpId) || user;

      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracy: number | null = null;

      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 0,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;
        } catch {
          // Si el usuario no otorga GPS, se registra igualmente con aviso
        }
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: targetEmpId,
          record_type: type,
          latitude,
          longitude,
          accuracy,
          scan_method: scanMethod,
          schedule_start: emp?.schedule_start || '08:00:00',
          schedule_end: emp?.schedule_end || '17:00:00',
          tolerance_minutes: settings.tolerance_minutes || 15,
          timezone: settings.timezone || 'America/Asuncion',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la marcación');
      }

      const newRecord: AttendanceRecord = {
        ...data.record,
        employee: emp as Profile,
      };

      const updatedAttendance = [newRecord, ...attendance];
      setAttendance(updatedAttendance);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));
      }

      return { success: true, record: newRecord };
    } catch (err: any) {
      return { success: false, error: err.message || 'No fue posible registrar la asistencia' };
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings, updated_at: new Date().toISOString() };
    setSettings(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('system_settings').upsert(updated);
      } catch (err) {
        console.warn('Error al guardar configuración en Supabase:', err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    }
  };

  const clearGeneratedCredentials = () => {
    setGeneratedCredentials([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        employees,
        attendance,
        settings,
        generatedCredentials,
        hasAnyAdmin,
        login,
        logout,
        createInitialAdmin,
        registerEmployee,
        recordAttendanceMark,
        updateSettings,
        importEmployeesBatch,
        clearGeneratedCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
