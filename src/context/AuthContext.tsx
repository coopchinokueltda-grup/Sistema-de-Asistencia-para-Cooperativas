'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, AttendanceRecord, SystemSettings, EmployeeCredentials, EmployeeLeave } from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_ATTENDANCE, 
  INITIAL_SETTINGS, 
  INITIAL_LEAVES,
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
  leaves: EmployeeLeave[];
  hasAnyAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createInitialAdmin: (data: { full_name: string; document_id: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  registerEmployee: (data: Partial<Profile>) => Promise<{ success: boolean; credentials?: EmployeeCredentials; error?: string }>;
  updateEmployee: (id: string, updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean; error?: string }>;
  registerEmployeeLeave: (leaveData: Omit<EmployeeLeave, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  deleteEmployeeLeave: (id: string) => Promise<{ success: boolean; error?: string }>;
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
  const [leaves, setLeaves] = useState<EmployeeLeave[]>(INITIAL_LEAVES);
  const [generatedCredentials, setGeneratedCredentials] = useState<EmployeeCredentials[]>([]);

  const hasAnyAdmin = employees.some(e => e.role === 'admin');

  // Carga inicial de datos
  useEffect(() => {
    async function init() {
      try {
        let loadedEmployees: Profile[] = [];
        let loadedAttendance: AttendanceRecord[] = [];
        let loadedLeaves: EmployeeLeave[] = [];

        // 1. Cargar desde LocalStorage si existen con validación contra errores
        if (typeof window !== 'undefined') {
          try {
            const storedCreds = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
            if (storedCreds) setGeneratedCredentials(JSON.parse(storedCreds));

            const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
            if (storedProfiles) loadedEmployees = JSON.parse(storedProfiles);

            const storedAtt = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
            if (storedAtt) loadedAttendance = JSON.parse(storedAtt);

            const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (storedSettings) setSettings(JSON.parse(storedSettings));

            const storedLeaves = localStorage.getItem(STORAGE_KEYS.LEAVES);
            if (storedLeaves) loadedLeaves = JSON.parse(storedLeaves);

            const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
            if (storedUser) setUser(JSON.parse(storedUser));
          } catch (storageErr) {
            console.warn('Recuperación de almacenamiento local prevenida:', storageErr);
          }
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

        // 3. Procesar marcaciones automáticas por Vacaciones / Reposo Médico para el día actual
        const todayStr = new Date().toISOString().split('T')[0];
        const activeLeavesToday = loadedLeaves.filter(
          l => l.start_date <= todayStr && l.end_date >= todayStr
        );

        if (activeLeavesToday.length > 0) {
          let updatedAtt = [...loadedAttendance];
          let addedAny = false;

          for (const leave of activeLeavesToday) {
            const hasMarkToday = updatedAtt.some(
              r => r?.employee_id === leave.employee_id && (r?.timestamp_local || '').startsWith(todayStr)
            );

            if (!hasMarkToday) {
              const emp = loadedEmployees.find(e => e.id === leave.employee_id);
              const leaveLabel = leave.leave_type === 'vacaciones' ? 'Vacaciones' : 
                                 leave.leave_type === 'reposo_medico' ? 'Reposo Médico' : 'Permiso Especial';

              const autoRecord: AttendanceRecord = {
                id: `auto_leave_${leave.id}_${todayStr}`,
                employee_id: leave.employee_id,
                record_type: 'entrada',
                timestamp_utc: new Date().toISOString(),
                timestamp_local: `${todayStr} 08:00:00`,
                timezone: 'America/Asuncion',
                scan_method: 'manual_admin',
                status: 'justificado',
                notes: `Marcación automática: ${leaveLabel} (${leave.reason || 'Autorizado'})`,
                created_at: new Date().toISOString(),
                employee: emp,
              };

              updatedAtt.unshift(autoRecord);
              addedAny = true;
            }
          }

          if (addedAny) {
            loadedAttendance = updatedAtt;
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAtt));
            }
          }
        }

        setEmployees(loadedEmployees);
        setAttendance(loadedAttendance);
        setLeaves(loadedLeaves);
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Crear administrador inicial
  const createInitialAdmin = async (data: { full_name: string; document_id: string; email: string; password: string }) => {
    try {
      const res = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role: 'admin',
          position: 'Administrador General',
          department: 'Administración Central',
          schedule_start: '07:30:00',
          schedule_end: '17:30:00',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Error al crear el administrador');
      }

      const newAdmin: Profile = {
        id: resData.user?.id || `admin_${Date.now()}`,
        full_name: data.full_name.trim(),
        document_id: data.document_id.trim(),
        role: 'admin',
        email: data.email.trim(),
        position: 'Administrador General',
        department: 'Administración Central',
        schedule_start: '07:30:00',
        schedule_end: '17:30:00',
        qr_token: resData.user?.qr_token || `ADMIN-QR-${data.document_id}`,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const updatedList = [newAdmin, ...employees];
      setEmployees(updatedList);
      setUser(newAdmin);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedList));
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newAdmin));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al crear la cuenta' };
    }
  };

  // Inicio de sesión dual (Cédula o Correo)
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanInput = identifier.trim();
      let cleanEmail = cleanInput.toLowerCase();

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

      // 1. Intentar con Supabase Auth
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
        }
      }

      // 2. Verificación local
      const currentEmployees = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.PROFILES)
        ? JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES)!)
        : employees;

      const found = currentEmployees.find(
        (p: Profile) => p.email.toLowerCase() === cleanEmail || p.document_id === cleanInput
      );

      if (!found) {
        return { success: false, error: 'Usuario o documento no encontrado en el sistema.' };
      }

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

  // Registrar nuevo empleado
  const registerEmployee = async (data: Partial<Profile>): Promise<{ success: boolean; credentials?: EmployeeCredentials; error?: string }> => {
    try {
      if (!data.full_name || !data.document_id) {
        return { success: false, error: 'El nombre completo y el número de documento son obligatorios' };
      }

      const docClean = data.document_id.replace(/\D/g, '');
      const email = data.email?.trim() || `emp.${docClean}@cooperativa.com`;
      
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
        avatar_url: data.avatar_url || undefined,
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

  // Actualizar datos de un empleado existente (incluida foto, horarios, cargo, etc.)
  const updateEmployee = async (id: string, updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Sincronización directa con Supabase desde el cliente si está disponible
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: dbErr } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id);
          if (dbErr) {
            console.warn('Actualización cliente Supabase avisó:', dbErr.message);
          }
        } catch (dbEx) {
          console.warn('Excepción de actualización cliente Supabase:', dbEx);
        }
      }

      // 2. Llamar al endpoint administrativo para sincronización completa y auth.users
      const res = await fetch('/api/admin/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'No fue posible actualizar el empleado');
      }

      const updatedList = employees.map(emp => emp.id === id ? { ...emp, ...updates, updated_at: new Date().toISOString() } : emp);
      setEmployees(updatedList);

      if (user?.id === id) {
        setUser({ ...user, ...updates });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedList));
        if (user?.id === id) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...user, ...updates }));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al actualizar empleado' };
    }
  };

  // Eliminar un empleado
  const deleteEmployee = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Eliminación directa desde el cliente si está disponible
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('profiles').delete().eq('id', id);
        } catch (dErr) {
          console.warn('Eliminación directa cliente Supabase:', dErr);
        }
      }

      // 2. Llamar al endpoint administrativo
      const res = await fetch(`/api/admin/employee?id=${id}`, {
        method: 'DELETE',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'No fue posible eliminar al empleado');
      }

      const updatedList = employees.filter(emp => emp.id !== id);
      setEmployees(updatedList);

      // Eliminar también las marcaciones asociadas en la vista local
      const updatedAtt = attendance.filter(att => att.employee_id !== id);
      setAttendance(updatedAtt);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedList));
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAtt));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al eliminar empleado' };
    }
  };

  // Registrar período de Licencia / Vacaciones / Reposo Médico
  const registerEmployeeLeave = async (leaveData: Omit<EmployeeLeave, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const newLeave: EmployeeLeave = {
        ...leaveData,
        id: `leave_${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      const updatedLeaves = [newLeave, ...leaves];
      setLeaves(updatedLeaves);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(updatedLeaves));
      }

      // Si la licencia abarca el día de hoy, generar automáticamente la marcación justificada
      const todayStr = new Date().toISOString().split('T')[0];
      if (newLeave.start_date <= todayStr && newLeave.end_date >= todayStr) {
        const emp = employees.find(e => e.id === newLeave.employee_id);
        const leaveLabel = newLeave.leave_type === 'vacaciones' ? 'Vacaciones' : 
                           newLeave.leave_type === 'reposo_medico' ? 'Reposo Médico' : 'Permiso Especial';

        const autoRecord: AttendanceRecord = {
          id: `auto_leave_${newLeave.id}_${todayStr}`,
          employee_id: newLeave.employee_id,
          record_type: 'entrada',
          timestamp_utc: new Date().toISOString(),
          timestamp_local: `${todayStr} 08:00:00`,
          timezone: 'America/Asuncion',
          scan_method: 'manual_admin',
          status: 'justificado',
          notes: `Marcación automática: ${leaveLabel} (${newLeave.reason || 'Autorizado por Administración'})`,
          created_at: new Date().toISOString(),
          employee: emp,
        };

        const updatedAtt = [autoRecord, ...attendance];
        setAttendance(updatedAtt);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAtt));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar licencia' };
    }
  };

  // Eliminar período de Licencia
  const deleteEmployeeLeave = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedLeaves = leaves.filter(l => l.id !== id);
      setLeaves(updatedLeaves);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(updatedLeaves));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al eliminar licencia' };
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
          // Si el usuario no otorga GPS, se registra igualmente
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
        leaves,
        hasAnyAdmin,
        login,
        logout,
        createInitialAdmin,
        registerEmployee,
        updateEmployee,
        deleteEmployee,
        registerEmployeeLeave,
        deleteEmployeeLeave,
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
