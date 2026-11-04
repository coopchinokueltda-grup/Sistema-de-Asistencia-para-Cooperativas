'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Clock, 
  UserPlus, 
  Settings, 
  Printer, 
  Globe,
  Monitor,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Calendar,
  Radio,
  Sparkles,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Fingerprint,
  BarChart3,
  Download,
  Filter,
  ShieldCheck,
  MapPin,
  RefreshCw,
  QrCode,
  Pencil,
  Trash2,
  HeartPulse
} from 'lucide-react';
import AdminAttendanceTable from './AdminAttendanceTable';
import AdminAttendanceCharts from './AdminAttendanceCharts';
import EmployeeManagementModal from './EmployeeManagementModal';
import EditEmployeeModal from './EditEmployeeModal';
import ManageLeavesModal from './ManageLeavesModal';
import KioskDisplayModal from './KioskDisplayModal';
import EmployeeBadgeCard from './EmployeeBadgeCard';
import CoopLogo from './CoopLogo';
import { Profile } from '@/types';
import { exportAttendanceToExcel } from '@/lib/excel';

export default function AdminDashboard() {
  const { user, employees, attendance, settings, recordAttendanceMark, updateSettings, logout, deleteEmployee } = useAuth();
  
  // Navegación principal en el sidebar
  const [activeTab, setActiveTab] = useState<'inicio' | 'empleados' | 'marcaciones' | 'reportes' | 'configuracion'>('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Modales
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [selectedEmployeeForBadge, setSelectedEmployeeForBadge] = useState<Profile | null>(null);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Profile | null>(null);
  const [showLeavesModal, setShowLeavesModal] = useState(false);
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  // Reloj y fecha en tiempo real (Zona Horaria America/Asuncion)
  const [clockString, setClockString] = useState('');
  const [dateHeaderString, setDateHeaderString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const tz = settings.timezone || 'America/Asuncion';
        
        // Hora HH:mm:ss
        const timeFmt = new Intl.DateTimeFormat('es-PY', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);
        setClockString(timeFmt);

        // Fecha ej: "Hoy: Lun, 04 de Nov. 2026"
        const dateFmt = new Intl.DateTimeFormat('es-PY', {
          timeZone: tz,
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(now);
        setDateHeaderString(dateFmt.charAt(0).toUpperCase() + dateFmt.slice(1));
      } catch {
        const d = new Date();
        setClockString(d.toLocaleTimeString());
        setDateHeaderString(d.toLocaleDateString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.timezone]);

  // Cálculos estadísticos en tiempo real (con validación segura)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(r => (r?.timestamp_local || '').startsWith(todayStr));
  const todayEntradas = todayRecords.filter(r => r.record_type === 'entrada');
  const todaySalidas = todayRecords.filter(r => r.record_type === 'salida');
  const puntuales = todayEntradas.filter(r => r.status === 'puntual').length;
  const tardanzas = todayEntradas.filter(r => r.status === 'tardanza').length;
  const puntualidadPct = todayEntradas.length > 0 ? Math.round((puntuales / todayEntradas.length) * 100) : 100;

  // Manejador para eliminar empleado con confirmación
  const handleDeleteEmployee = async (emp: Profile) => {
    const ok = window.confirm(
      `¿Confirma que desea dar de baja y eliminar a "${emp.full_name}" (C.I. ${emp.document_id})?\n\nEsta acción revocará su acceso al sistema y eliminará su ficha.`
    );
    if (!ok) return;

    setDeletingEmpId(emp.id);
    const res = await deleteEmployee(emp.id);
    setDeletingEmpId(null);

    if (!res.success) {
      alert(res.error || 'No fue posible eliminar al empleado.');
    }
  };

  // Búsqueda en empleados
  const [employeeSearch, setEmployeeSearch] = useState('');
  const filteredEmployees = employees.filter(e => {
    const term = employeeSearch.toLowerCase();
    return !term || e.full_name.toLowerCase().includes(term) || e.document_id.includes(term) || e.position.toLowerCase().includes(term);
  });

  // Formulario de configuración
  const [companyNameInput, setCompanyNameInput] = useState(settings.company_name);
  const [timezoneInput, setTimezoneInput] = useState(settings.timezone);
  const [qrSecretInput, setQrSecretInput] = useState(settings.workplace_qr_secret);
  const [toleranceInput, setToleranceInput] = useState(settings.tolerance_minutes || 15);
  const [geofenceLat, setGeofenceLat] = useState(settings.geofence_lat || -25.7000);
  const [geofenceLng, setGeofenceLng] = useState(settings.geofence_lng || -57.6000);
  const [geofenceRadius, setGeofenceRadius] = useState(settings.geofence_radius_meters || 200);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      company_name: companyNameInput,
      timezone: timezoneInput,
      workplace_qr_secret: qrSecretInput,
      tolerance_minutes: Number(toleranceInput),
      geofence_lat: Number(geofenceLat),
      geofence_lng: Number(geofenceLng),
      geofence_radius_meters: Number(geofenceRadius),
    });
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 2500);
  };

  // Títulos dinámicos según pestaña
  const sectionMeta = {
    inicio: { title: 'Panel de Control', subtitle: 'Resumen general del sistema' },
    empleados: { title: 'Personal y Empleados', subtitle: 'Directorio institucional y carnets QR' },
    marcaciones: { title: 'Auditoría de Marcaciones', subtitle: 'Control horario con precisión GPS' },
    reportes: { title: 'Reportes y Estadísticas', subtitle: 'Análisis de asistencia y puntualidad' },
    configuracion: { title: 'Configuración Legal', subtitle: 'Huso horario legal y parámetros de sede' },
  }[activeTab];

  return (
    <div className="flex h-screen overflow-hidden bg-[#071512] text-[#F5F7F5] selection:bg-[#00A878] selection:text-white">
      
      {/* ============================================================ */}
      {/* 1. BARRA LATERAL (SIDEBAR)                                   */}
      {/* ============================================================ */}
      
      {/* Backdrop en dispositivos móviles */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-64 bg-[#071512] border-r border-[#203B30]
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Cabecera del Sidebar con Logo */}
        <div className="p-5 border-b border-[#203B30]">
          <div className="flex items-center space-x-3">
            <div className="relative shrink-0">
              <CoopLogo size={46} className="w-12 h-12" />
            </div>
            <div>
              <h2 className="font-black text-xs tracking-wider text-white uppercase leading-snug">
                COOPERATIVA<br />CHINOKUE LTDA
              </h2>
              <p className="text-[10px] text-[#A5B4AC] italic font-medium leading-tight mt-0.5">
                Sistema de Control de Asistencia y Personal
              </p>
            </div>
          </div>
        </div>

        {/* Enlaces de Navegación del Sidebar */}
        <div className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
          
          <button
            onClick={() => { setActiveTab('inicio'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'inicio'
                ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 font-extrabold'
                : 'text-[#A5B4AC] hover:text-white hover:bg-[#101E1A]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => { setActiveTab('empleados'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'empleados'
                ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 font-extrabold'
                : 'text-[#A5B4AC] hover:text-white hover:bg-[#101E1A]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Empleados</span>
          </button>

          <button
            onClick={() => { setActiveTab('marcaciones'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'marcaciones'
                ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 font-extrabold'
                : 'text-[#A5B4AC] hover:text-white hover:bg-[#101E1A]'
            }`}
          >
            <Fingerprint className="w-4 h-4 shrink-0" />
            <span>Marcaciones</span>
          </button>

          <button
            onClick={() => { setActiveTab('reportes'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'reportes'
                ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 font-extrabold'
                : 'text-[#A5B4AC] hover:text-white hover:bg-[#101E1A]'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Reportes</span>
          </button>

          <button
            onClick={() => { setActiveTab('configuracion'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'configuracion'
                ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 font-extrabold'
                : 'text-[#A5B4AC] hover:text-white hover:bg-[#101E1A]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configuración</span>
          </button>

        </div>

        {/* Pie del Sidebar: Estado del Sistema y Silueta de Pinos */}
        <div className="relative p-4 border-t border-[#203B30] bg-[#071512] overflow-hidden">
          
          {/* Silueta vectorial sutil de pinos en la base */}
          <div className="absolute -bottom-2 -left-2 opacity-15 pointer-events-none">
            <svg width="140" height="60" viewBox="0 0 140 60" fill="#00A878">
              <polygon points="20,50 35,20 50,50" />
              <polygon points="40,50 55,10 70,50" />
              <polygon points="60,50 75,25 90,50" />
              <polygon points="80,50 95,15 110,50" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00A878] animate-pulse"></span>
              <span className="text-[#A5B4AC] font-semibold">Sistema en línea</span>
            </div>
            <span className="text-[#A5B4AC]/60">v2.0.0</span>
          </div>

        </div>

      </aside>

      {/* ============================================================ */}
      {/* 2. ÁREA PRINCIPAL (HEADER + CONTENIDO)                      */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* ENCABEZADO SUPERIOR (TOPBAR) */}
        <header className="h-20 bg-[#071512] border-b border-[#203B30] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-30">
          
          {/* Izquierda: Botón Hamburguesa + Título Dinámico */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-[#101E1A] hover:bg-[#162720] border border-[#203B30] text-[#F5F7F5] transition-colors"
              title="Alternar barra lateral"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                {sectionMeta.title}
              </h1>
              <p className="text-xs text-[#A5B4AC] font-medium hidden sm:block">
                {sectionMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Derecha: Reloj en vivo, Notificaciones y Perfil */}
          <div className="flex items-center space-x-3">
            
            {/* Reloj y Fecha Oficial de Paraguay */}
            <div className="hidden md:flex items-center space-x-2 bg-[#101E1A] border border-[#203B30] px-3.5 py-1.5 rounded-2xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00A878] animate-pulse"></span>
              <span className="text-[#A5B4AC]">{dateHeaderString}</span>
              <span className="text-stone-600">•</span>
              <span className="text-white font-bold">{clockString}</span>
            </div>

            {/* Botón de Notificaciones con Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-2xl bg-[#101E1A] hover:bg-[#162720] border border-[#203B30] text-[#A5B4AC] hover:text-white transition-colors"
                title="Notificaciones del sistema"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF5350] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#071512]">
                  3
                </span>
              </button>

              {/* Menú flotante de notificaciones */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#101E1A] border border-[#203B30] rounded-2xl shadow-2xl p-4 text-xs z-50 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-[#203B30]">
                    <span className="font-bold text-white uppercase text-[11px]">Notificaciones</span>
                    <span className="text-[10px] text-[#00A878] font-mono">3 nuevas</span>
                  </div>
                  <div className="space-y-2 text-[#A5B4AC]">
                    <div className="p-2 bg-[#162720] rounded-xl border border-[#203B30]">
                      <div className="font-bold text-white">Sincronización con Supabase</div>
                      <div className="text-[11px]">Base de datos conectada en tiempo real.</div>
                    </div>
                    <div className="p-2 bg-[#162720] rounded-xl border border-[#203B30]">
                      <div className="font-bold text-[#F5B942]">Control de Puntualidad</div>
                      <div className="text-[11px]">{tardanzas} tardanza(s) registradas hoy en el turno matutino.</div>
                    </div>
                    <div className="p-2 bg-[#162720] rounded-xl border border-[#203B30]">
                      <div className="font-bold text-[#00A878]">Sello Horario Verificado</div>
                      <div className="text-[11px]">Huso horario activo: America/Asuncion.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil del Administrador */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2.5 p-1.5 sm:px-3 bg-[#101E1A] hover:bg-[#162720] border border-[#203B30] rounded-2xl transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A878] to-[#063D32] border border-[#00A878]/40 flex items-center justify-center text-white font-black text-xs shrink-0 shadow">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-xs text-white leading-tight truncate max-w-[120px]">
                    {user?.full_name || 'Pedro Martínez'}
                  </div>
                  <div className="text-[10px] text-[#00A878] font-medium leading-none">
                    Administrador
                  </div>
                </div>
              </button>

              {/* Menú de Usuario / Cerrar Sesión */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#101E1A] border border-[#203B30] rounded-2xl shadow-2xl p-2 text-xs z-50 space-y-1 animate-fadeIn">
                  <div className="p-2 border-b border-[#203B30] text-[11px]">
                    <div className="font-bold text-white">{user?.full_name}</div>
                    <div className="text-[#A5B4AC] font-mono text-[10px] truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (user) setSelectedEmployeeForBadge(user);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#F5F7F5] hover:bg-[#162720] flex items-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#00A878]" />
                    <span>Mi Carnet QR</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('configuracion');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#F5F7F5] hover:bg-[#162720] flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#A5B4AC]" />
                    <span>Configuración</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#EF5350] hover:bg-[#EF5350]/10 flex items-center gap-2 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* CONTENIDO INTERNO DESPLAZABLE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* ======================================================== */}
          {/* VISTA 1: INICIO (DASHBOARD PRINCIPAL)                   */}
          {/* ======================================================== */}
          {activeTab === 'inicio' && (
            <div className="space-y-6">
              
              {/* 1. TARJETAS DE MÉTRICAS (Exacto a la imagen de referencia) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Tarjeta 1: Verde Esmeralda (#008F68 / #00A878) - Nómina */}
                <div className="bg-gradient-to-br from-[#00A878] to-[#008F68] rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full font-mono">
                      <TrendingUp className="w-3 h-3" />
                      +0%
                    </span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white font-mono tracking-tight leading-none mb-1">
                      {employees.length}
                    </div>
                    <p className="text-xs text-white/90 font-medium">
                      Trabajadores registrados
                    </p>
                  </div>
                </div>

                {/* Tarjeta 2: Azul Cerúleo (#0284c7 / #0369a1) - Marcaciones Hoy */}
                <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full font-mono">
                      <TrendingUp className="w-3 h-3" />
                      +33%
                    </span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white font-mono tracking-tight leading-none mb-1">
                      {todayRecords.length}
                    </div>
                    <p className="text-xs text-white/90 font-medium">
                      Marcaciones hoy
                    </p>
                  </div>
                </div>

                {/* Tarjeta 3: Amarillo / Oro Ámbar (#d97706 / #b45309) - Puntualidad */}
                <div className="bg-gradient-to-br from-[#d97706] to-[#b45309] rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full font-mono">
                      {tardanzas > 0 ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          -100%
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          100%
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white font-mono tracking-tight leading-none mb-1">
                      {todayEntradas.length > 0 ? `${puntualidadPct}%` : '0%'}
                    </div>
                    <p className="text-xs text-white/90 font-medium">
                      Puntualidad
                    </p>
                  </div>
                </div>

                {/* Tarjeta 4: Violeta Profundo (#4f46e5 / #6366f1) - Zona Horaria Legal */}
                <div className="bg-gradient-to-br from-[#4f46e5] to-[#6366f1] rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
                  {/* Patrón de líneas sutiles de fondo (mapa del mundo) */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 60">
                      <path d="M10,20 Q30,10 50,30 T90,20" fill="none" stroke="white" strokeWidth="1" />
                      <path d="M15,40 Q40,30 65,45 T95,35" fill="none" stroke="white" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
                      <Globe className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-tight mb-1 truncate">
                      {settings.timezone}
                    </div>
                    <p className="text-[11px] text-white/80 font-medium">
                      15 min atrás • Última actualización
                    </p>
                  </div>
                </div>

              </div>

              {/* 2. GRÁFICOS ANALÍTICOS (Asistencia en el tiempo + Donut Asistencia) */}
              <AdminAttendanceCharts records={attendance} employees={employees} />

              {/* 3. BARRA DE ACCIÓN RÁPIDA (Botones + Buscador + Filtros) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                
                {/* Botones de Comando */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-[#00A878] hover:bg-[#008F68] active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#00A878]/30 transition-all"
                  >
                    <UserPlus className="w-4 h-4 text-white" />
                    <span>Registrar Empleado</span>
                  </button>

                  <button
                    onClick={() => setShowKioskModal(true)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-[#162720] hover:bg-[#203B30] active:scale-95 text-stone-200 hover:text-white font-bold text-xs rounded-2xl border border-[#203B30] transition-all"
                  >
                    <Monitor className="w-4 h-4 text-[#F5B942]" />
                    <span>Kiosco Central de Pantalla</span>
                  </button>
                </div>

                {/* Filtro y Exportación rápida */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportAttendanceToExcel(attendance, settings.company_name)}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#162720] hover:bg-[#203B30] text-[#00A878] text-xs font-bold rounded-2xl border border-[#203B30] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar</span>
                  </button>
                </div>

              </div>

              {/* 4. TABLA DE MARCACIONES RECIENTES */}
              <AdminAttendanceTable
                records={attendance}
                employees={employees}
                settings={settings}
                compact={true}
                limit={8}
                onManualMark={(type, empId) => recordAttendanceMark(type, empId, 'manual_admin')}
              />

            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 2: GESTIÓN DE PERSONAL Y CARNETS                  */}
          {/* ======================================================== */}
          {activeTab === 'empleados' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101E1A] p-4 rounded-3xl border border-[#203B30]">
                
                {/* Buscador de Empleados */}
                <div className="max-w-md w-full relative">
                  <Search className="w-4 h-4 text-[#A5B4AC] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar personal por nombre, cédula o cargo..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-2xl text-[#F5F7F5] placeholder-[#A5B4AC] focus:outline-none focus:border-[#00A878]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowLeavesModal(true)}
                    className="px-4 py-2 bg-[#162720] hover:bg-[#203B30] text-[#00A878] font-bold text-xs rounded-2xl border border-[#00A878]/40 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-[#F5B942]" />
                    <span>Gestionar Reposo / Vacaciones</span>
                  </button>

                  <button
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="px-4 py-2 bg-[#00A878] hover:bg-[#008F68] text-white font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5 shadow-lg shadow-[#00A878]/25"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Nuevo Empleado</span>
                  </button>
                </div>
              </div>

              {/* Tarjetas / Tabla de Empleados */}
              <div className="bg-[#101E1A] rounded-3xl border border-[#203B30] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#071512] text-[#A5B4AC] font-bold uppercase tracking-wider text-[10px] border-b border-[#203B30]">
                      <tr>
                        <th className="py-3.5 px-4">Trabajador</th>
                        <th className="py-3.5 px-3">Cédula CI</th>
                        <th className="py-3.5 px-3">Cargo & Área</th>
                        <th className="py-3.5 px-3">Horario</th>
                        <th className="py-3.5 px-3">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#203B30]/60 text-[#F5F7F5]">
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-[#A5B4AC]">
                            No hay empleados que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-[#162720]/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00A878] to-[#063D32] flex items-center justify-center text-white font-black text-xs shrink-0 overflow-hidden border border-[#00A878]/30 shadow">
                                  {emp.avatar_url ? (
                                    <img 
                                      src={emp.avatar_url} 
                                      alt={emp.full_name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <span>{emp.full_name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">{emp.full_name}</div>
                                  <div className="text-[10px] text-[#A5B4AC] font-mono">{emp.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#F5B942]">
                              {emp.document_id}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white">{emp.position}</div>
                              <div className="text-[10px] text-[#00A878]">{emp.department}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-stone-300 text-[11px]">
                              {emp.schedule_start?.substring(0, 5)} - {emp.schedule_end?.substring(0, 5)}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#063D32] text-[#00A878] border border-[#00A878]/30">
                                ● Activo
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedEmployeeForBadge(emp)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#162720] hover:bg-[#203B30] text-[#00A878] rounded-xl border border-[#203B30] text-xs font-bold transition-all"
                                  title="Ver / Imprimir Carnet QR CR80"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Carnet QR</span>
                                </button>

                                <button
                                  onClick={() => setSelectedEmployeeForEdit(emp)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#162720] hover:bg-[#203B30] text-stone-200 hover:text-white rounded-xl border border-[#203B30] text-xs font-bold transition-all"
                                  title="Editar datos y foto del empleado"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-[#00A878]" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteEmployee(emp)}
                                  disabled={deletingEmpId === emp.id || emp.role === 'admin'}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#162720] hover:bg-rose-950/60 text-[#EF5350] rounded-xl border border-[#203B30] hover:border-rose-900/60 text-xs font-bold transition-all disabled:opacity-40"
                                  title="Eliminar empleado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 3: AUDITORÍA DE MARCACIONES COMPLETA               */}
          {/* ======================================================== */}
          {activeTab === 'marcaciones' && (
            <div className="space-y-4">
              <AdminAttendanceTable
                records={attendance}
                employees={employees}
                settings={settings}
                compact={false}
                onManualMark={(type, empId) => recordAttendanceMark(type, empId, 'manual_admin')}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 4: REPORTES Y ESTADÍSTICAS                         */}
          {/* ======================================================== */}
          {activeTab === 'reportes' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#101E1A] p-5 rounded-3xl border border-[#203B30]">
                  <span className="text-[10px] font-bold uppercase text-[#00A878] tracking-widest block mb-1">
                    Total Marcaciones Históricas
                  </span>
                  <div className="text-3xl font-black font-mono text-white">
                    {attendance.length}
                  </div>
                  <p className="text-xs text-[#A5B4AC] mt-1">Registros auditados en el sistema</p>
                </div>

                <div className="bg-[#101E1A] p-5 rounded-3xl border border-[#203B30]">
                  <span className="text-[10px] font-bold uppercase text-[#F5B942] tracking-widest block mb-1">
                    Tasa de Cumplimiento
                  </span>
                  <div className="text-3xl font-black font-mono text-white">
                    {puntualidadPct}%
                  </div>
                  <p className="text-xs text-[#A5B4AC] mt-1">Puntualidad en ingresos laborales</p>
                </div>

                <div className="bg-[#101E1A] p-5 rounded-3xl border border-[#203B30]">
                  <span className="text-[10px] font-bold uppercase text-teal-400 tracking-widest block mb-1">
                    Exportación Oficial
                  </span>
                  <button
                    onClick={() => exportAttendanceToExcel(attendance, settings.company_name)}
                    className="mt-2 w-full py-2 bg-[#008F68] hover:bg-[#00A878] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Descargar Planilla Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              <AdminAttendanceCharts records={attendance} employees={employees} />

            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 5: CONFIGURACIÓN LEGAL E INSTITUCIONAL             */}
          {/* ======================================================== */}
          {activeTab === 'configuracion' && (
            <div className="max-w-3xl bg-[#101E1A] rounded-3xl p-6 border border-[#203B30] shadow-xl space-y-6">
              
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#00A878]" />
                  <span>Parámetros Legales y de Sede</span>
                </h3>
                <p className="text-xs text-[#A5B4AC] mt-1">
                  Valores utilizados para la validación horaria y geolocalización de las marcaciones.
                </p>
              </div>

              {savedSettingsNotice && (
                <div className="p-3 bg-[#063D32] border border-[#00A878] text-[#00A878] rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuración guardada y sincronizada correctamente.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                
                <div>
                  <label className="block font-bold text-[#A5B4AC] mb-1">
                    Razón Social de la Cooperativa
                  </label>
                  <input
                    type="text"
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    required
                    className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00A878]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#A5B4AC] mb-1">
                      Huso Horario Legal
                    </label>
                    <input
                      type="text"
                      value={timezoneInput}
                      onChange={(e) => setTimezoneInput(e.target.value)}
                      required
                      className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#00A878]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#A5B4AC] mb-1">
                      Minutos de Tolerancia para Ingreso
                    </label>
                    <input
                      type="number"
                      value={toleranceInput}
                      onChange={(e) => setToleranceInput(Number(e.target.value))}
                      min="0"
                      max="60"
                      required
                      className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#00A878]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#A5B4AC] mb-1">
                      Latitud Sede Central
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={geofenceLat}
                      onChange={(e) => setGeofenceLat(Number(e.target.value))}
                      className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00A878]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#A5B4AC] mb-1">
                      Longitud Sede Central
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={geofenceLng}
                      onChange={(e) => setGeofenceLng(Number(e.target.value))}
                      className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00A878]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#A5B4AC] mb-1">
                      Radio Permitido (metros)
                    </label>
                    <input
                      type="number"
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                      className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00A878]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#A5B4AC] mb-1">
                    Secreto de Validación QR Kiosco
                  </label>
                  <input
                    type="password"
                    value={qrSecretInput}
                    onChange={(e) => setQrSecretInput(e.target.value)}
                    required
                    className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#00A878]"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00A878] hover:bg-[#008F68] text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Guardar Configuración
                  </button>
                </div>

              </form>

            </div>
          )}

        </main>

      </div>

      {/* ============================================================ */}
      {/* 3. MODALES COMPLEMENTARIOS                                    */}
      {/* ============================================================ */}

      {/* Modal de Registro de Personal y Carga Masiva */}
      {showAddEmployeeModal && (
        <EmployeeManagementModal
          onClose={() => setShowAddEmployeeModal(false)}
        />
      )}

      {/* Modal de Kiosco Central de Recepción */}
      {showKioskModal && (
        <KioskDisplayModal
          settings={settings}
          onClose={() => setShowKioskModal(false)}
        />
      )}

      {/* Modal de Edición de Empleado y Foto */}
      {selectedEmployeeForEdit && (
        <EditEmployeeModal
          employee={selectedEmployeeForEdit}
          onClose={() => setSelectedEmployeeForEdit(null)}
        />
      )}

      {/* Modal de Gestión de Reposos y Vacaciones */}
      {showLeavesModal && (
        <ManageLeavesModal
          onClose={() => setShowLeavesModal(false)}
        />
      )}

      {/* Modal de Carnet QR Imprimible */}
      {selectedEmployeeForBadge && (
        <EmployeeBadgeCard
          employee={selectedEmployeeForBadge}
          settings={settings}
          onClose={() => setSelectedEmployeeForBadge(null)}
        />
      )}

    </div>
  );
}
