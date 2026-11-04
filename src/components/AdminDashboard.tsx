'use client';

import React, { useState } from 'react';
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
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Calendar,
  Radio,
  Sparkles
} from 'lucide-react';
import AdminAttendanceTable from './AdminAttendanceTable';
import EmployeeManagementModal from './EmployeeManagementModal';
import KioskDisplayModal from './KioskDisplayModal';
import EmployeeBadgeCard from './EmployeeBadgeCard';
import { ErrorBoundary } from './ErrorBoundary';
import CoopLogo from './CoopLogo';
import { Profile } from '@/types';

export default function AdminDashboard() {
  const { employees, attendance, settings, recordAttendanceMark, updateSettings } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'asistencias' | 'empleados' | 'config'>('asistencias');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [selectedEmployeeForBadge, setSelectedEmployeeForBadge] = useState<Profile | null>(null);

  const [employeeSearch, setEmployeeSearch] = useState('');

  // Estadísticas del día en curso
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(r => r.timestamp_local.startsWith(todayStr));
  const todayEntradas = todayRecords.filter(r => r.record_type === 'entrada');
  const todaySalidas = todayRecords.filter(r => r.record_type === 'salida');
  const puntuales = todayEntradas.filter(r => r.status === 'puntual').length;
  const tardanzas = todayEntradas.filter(r => r.status === 'tardanza').length;
  const puntualidadPct = todayEntradas.length > 0 ? Math.round((puntuales / todayEntradas.length) * 100) : 100;

  // Formulario de configuración
  const [companyNameInput, setCompanyNameInput] = useState(settings.company_name);
  const [timezoneInput, setTimezoneInput] = useState(settings.timezone);
  const [qrSecretInput, setQrSecretInput] = useState(settings.workplace_qr_secret);
  const [toleranceInput, setToleranceInput] = useState(settings.tolerance_minutes || 15);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      company_name: companyNameInput,
      timezone: timezoneInput,
      workplace_qr_secret: qrSecretInput,
      tolerance_minutes: Number(toleranceInput),
    });
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 2500);
  };

  const filteredEmployees = employees.filter(e => {
    const term = employeeSearch.toLowerCase();
    return !term || e.full_name.toLowerCase().includes(term) || e.document_id.includes(term) || e.position.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      
      {/* Panel Superior de Control y Métricas Ejecutivas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Métrica 1: Nómina */}
        <div className="bg-[#101713] rounded-3xl p-5 border border-emerald-900/40 shadow-xl relative overflow-hidden group hover:border-emerald-700/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Nómina Activa
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {employees.length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Trabajadores registrados
          </p>
        </div>

        {/* Métrica 2: Marcaciones del Día */}
        <div className="bg-[#101713] rounded-3xl p-5 border border-emerald-900/40 shadow-xl relative overflow-hidden group hover:border-emerald-700/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
              Marcaciones Hoy
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-700/40 flex items-center justify-center text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            {todayRecords.length}
            <span className="text-xs font-semibold text-stone-400">
              ({todayEntradas.length} ent / {todaySalidas.length} sal)
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Actividad de la fecha
          </p>
        </div>

        {/* Métrica 3: Puntualidad */}
        <div className="bg-[#101713] rounded-3xl p-5 border border-emerald-900/40 shadow-xl relative overflow-hidden group hover:border-emerald-700/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Puntualidad
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-700/40 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            {todayEntradas.length > 0 ? `${puntualidadPct}%` : '100%'}
            {tardanzas > 0 && (
              <span className="text-xs text-rose-400 font-bold font-mono">
                ({tardanzas} con retraso)
              </span>
            )}
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${puntualidadPct}%` }}
            />
          </div>
        </div>

        {/* Métrica 4: Zona Horaria Legal */}
        <div className="bg-[#101713] rounded-3xl p-5 border border-emerald-900/40 shadow-xl relative overflow-hidden group hover:border-emerald-700/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Sello Horario
            </span>
            <div className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-base font-black text-stone-100 font-mono tracking-tight mt-1 truncate">
            {settings.timezone.replace('_', ' ')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1 font-mono">
            Tolerancia: {settings.tolerance_minutes} minutos
          </p>
        </div>

      </div>

      {/* Botones de Comando Rápido */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950/60 border border-emerald-500/40 transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-200" />
            <span>Registrar Empleado</span>
          </button>

          <button
            onClick={() => setShowKioskModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-200 hover:text-white font-bold text-xs rounded-2xl shadow-lg border border-stone-700 transition-all"
          >
            <Monitor className="w-4 h-4 text-amber-400" />
            <span>Kiosco Central de Pantalla</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-stone-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Base de datos sincronizada</span>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="bg-[#101713] rounded-3xl border border-emerald-900/40 overflow-hidden shadow-xl">
        
        <div className="flex border-b border-stone-800/80 bg-[#0d1410] px-4 sm:px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('asistencias')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'asistencias'
                ? 'bg-[#101713] text-white border-t-2 border-emerald-500 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Marcaciones ({attendance.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('empleados')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'empleados'
                ? 'bg-[#101713] text-white border-t-2 border-emerald-500 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Personal & Carnets QR ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-[#101713] text-white border-t-2 border-emerald-500 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configuración Legal</span>
          </button>
        </div>

        {/* Pestaña: Auditoría de Asistencias */}
        {activeTab === 'asistencias' && (
          <div className="p-3 sm:p-5">
            <AdminAttendanceTable
              records={attendance}
              employees={employees}
              settings={settings}
              onManualMark={(type, empId) => recordAttendanceMark(type, empId, 'manual_admin')}
            />
          </div>
        )}

        {/* Pestaña: Nómina de Personal & Carnets */}
        {activeTab === 'empleados' && (
          <div className="p-4 sm:p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a120e] p-3 rounded-2xl border border-stone-800">
              <div className="max-w-sm w-full relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar personal por nombre, cédula o cargo..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Agregar Personal</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b140f] text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Trabajador</th>
                    <th className="py-3 px-3">Cédula CI</th>
                    <th className="py-3 px-3">Cargo & Área</th>
                    <th className="py-3 px-3">Horario</th>
                    <th className="py-3 px-3">Usuario</th>
                    <th className="py-3 px-4 text-right">Credencial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-500">
                        No hay empleados registrados que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-stone-900/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{emp.full_name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{emp.phone || 'Sin teléfono'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-300">
                          {emp.document_id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-stone-200">{emp.position}</div>
                          <div className="text-[10px] text-emerald-400">{emp.department}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-stone-400">
                          {emp.schedule_start?.substring(0, 5)} - {emp.schedule_end?.substring(0, 5)}
                        </td>
                        <td className="py-3 px-3 text-stone-400 font-mono text-[11px]">
                          {emp.email}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedEmployeeForBadge(emp)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-stone-800 to-stone-900 hover:from-emerald-900 hover:to-teal-900 text-stone-200 hover:text-white font-bold rounded-xl border border-stone-700/80 hover:border-emerald-500 transition-all shadow-sm"
                            title="Ver carnet oficial con código QR"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ver Carnet</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Pestaña: Configuración */}
        {activeTab === 'config' && (
          <div className="p-6 max-w-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm">
                Parámetros Institucionales & Control de Tolerancia
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Valores que rigen el sello de hora del servidor y los criterios de puntualidad.
              </p>
            </div>

            {savedSettingsNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuración guardada correctamente.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nombre oficial de la entidad
                </label>
                <input
                  type="text"
                  required
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Huso horario auditado (IANA Timezone)
                </label>
                <select
                  value={timezoneInput}
                  onChange={(e) => setTimezoneInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="America/Asuncion">America/Asuncion (Paraguay)</option>
                  <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos Aires</option>
                  <option value="America/Sao_Paulo">America/Sao Paulo</option>
                  <option value="America/Santiago">America/Santiago</option>
                  <option value="America/Montevideo">America/Montevideo</option>
                  <option value="America/La_Paz">America/La Paz</option>
                  <option value="America/Lima">America/Lima</option>
                  <option value="America/Bogota">America/Bogota</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Tolerancia de ingreso (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={toleranceInput}
                  onChange={(e) => setToleranceInput(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Llegadas dentro de este margen se califican como Puntual.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Código secreto del QR del Kiosco de la Sede
                </label>
                <input
                  type="text"
                  required
                  value={qrSecretInput}
                  onChange={(e) => setQrSecretInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {showAddEmployeeModal && (
        <EmployeeManagementModal
          onClose={() => setShowAddEmployeeModal(false)}
        />
      )}

      {showKioskModal && (
        <KioskDisplayModal
          settings={settings}
          onClose={() => setShowKioskModal(false)}
        />
      )}

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
