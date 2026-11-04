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
  AlertCircle
} from 'lucide-react';
import AdminAttendanceTable from './AdminAttendanceTable';
import EmployeeManagementModal from './EmployeeManagementModal';
import KioskDisplayModal from './KioskDisplayModal';
import EmployeeBadgeCard from './EmployeeBadgeCard';
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
  const puntuales = todayEntradas.filter(r => r.status === 'puntual').length;
  const tardanzas = todayEntradas.filter(r => r.status === 'tardanza').length;

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
    <div className="space-y-5">
      
      {/* Resumen del día */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Personal registrado
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
            {employees.length}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Trabajadores en nómina
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Marcaciones hoy
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
            {todayRecords.length}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            {todayEntradas.length} entradas procesadas
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Puntualidad
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono flex items-baseline gap-2">
            {puntuales}
            {tardanzas > 0 && (
              <span className="text-xs text-amber-700 font-semibold">
                ({tardanzas} con tardanza)
              </span>
            )}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Tolerancia: {settings.tolerance_minutes} min
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Zona horaria
          </span>
          <div className="text-base font-bold text-stone-900 mt-1.5 font-mono truncate">
            {settings.timezone.replace('_', ' ')}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Sello oficial de servidor
          </span>
        </div>

      </div>

      {/* Botones de acción principales */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setShowAddEmployeeModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Registrar empleado</span>
        </button>

        <button
          onClick={() => setShowKioskModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <Monitor className="w-3.5 h-3.5 text-stone-300" />
          <span>Abrir kiosco de marcación</span>
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-2xl px-5 pt-2">
        <button
          onClick={() => setActiveTab('asistencias')}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'asistencias'
              ? 'border-emerald-700 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Marcaciones ({attendance.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('empleados')}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'empleados'
              ? 'border-emerald-700 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Personal y carnets ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'config'
              ? 'border-emerald-700 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configuración</span>
        </button>
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'asistencias' && (
        <AdminAttendanceTable
          records={attendance}
          employees={employees}
          settings={settings}
          onManualMark={(type, empId) => recordAttendanceMark(type, empId, 'manual_admin')}
        />
      )}

      {activeTab === 'empleados' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-stone-200 overflow-hidden">
          
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="max-w-xs w-full relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o cargo..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo empleado</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Personal</th>
                  <th className="py-2.5 px-3">Cédula CI</th>
                  <th className="py-2.5 px-3">Cargo y departamento</th>
                  <th className="py-2.5 px-3">Horario</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-4 text-right">Carnet QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      No hay empleados registrados aún. Use el botón superior para agregar personal o importar un archivo Excel.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-stone-900">{emp.full_name}</div>
                        <div className="text-[10px] text-stone-400">{emp.phone || 'Sin teléfono'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-stone-800">
                        {emp.document_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-stone-800">{emp.position}</div>
                        <div className="text-[10px] text-stone-500">{emp.department}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">
                        {emp.schedule_start?.substring(0, 5)} - {emp.schedule_end?.substring(0, 5)}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 font-mono">
                        {emp.email}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedEmployeeForBadge(emp)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-lg border border-stone-300 transition-colors"
                          title="Ver carnet"
                        >
                          <Printer className="w-3 h-3 text-stone-500" />
                          <span>Carnet</span>
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

      {activeTab === 'config' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-stone-200 p-5 max-w-xl">
          <h3 className="font-bold text-stone-900 text-sm mb-1">
            Parámetros del sistema
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            Ajustes para el cálculo de horarios, zona horaria y código de la sede.
          </p>

          {savedSettingsNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configuración guardada correctamente.</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nombre de la entidad
              </label>
              <input
                type="text"
                required
                value={companyNameInput}
                onChange={(e) => setCompanyNameInput(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Zona horaria oficial
              </label>
              <select
                value={timezoneInput}
                onChange={(e) => setTimezoneInput(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tolerancia de entrada (minutos para considerar puntual)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={toleranceInput}
                onChange={(e) => setToleranceInput(Number(e.target.value))}
                className="w-full text-xs p-2 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Código secreto del QR de la sede
              </label>
              <input
                type="text"
                required
                value={qrSecretInput}
                onChange={(e) => setQrSecretInput(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}

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
