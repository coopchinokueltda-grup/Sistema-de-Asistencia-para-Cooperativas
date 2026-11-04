'use client';

import React, { useState } from 'react';
import { AttendanceRecord, Profile, SystemSettings } from '@/types';
import { 
  FileSpreadsheet, 
  Search, 
  MapPin, 
  ExternalLink, 
  PlusCircle, 
  Printer, 
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { exportAttendanceToExcel } from '@/lib/excel';
import EmployeeBadgeCard from './EmployeeBadgeCard';

interface Props {
  records: AttendanceRecord[];
  employees: Profile[];
  settings: SystemSettings;
  onManualMark?: (type: 'entrada' | 'salida', employeeId: string) => void;
}

export default function AdminAttendanceTable({ records, employees, settings, onManualMark }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployeeForBadge, setSelectedEmployeeForBadge] = useState<Profile | null>(null);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualType, setManualType] = useState<'entrada' | 'salida'>('entrada');

  const filteredRecords = records.filter(rec => {
    const empName = rec.employee?.full_name?.toLowerCase() || '';
    const empDoc = rec.employee?.document_id?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || empName.includes(term) || empDoc.includes(term) || rec.timestamp_local.includes(term);
    const matchesType = typeFilter === 'all' || rec.record_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportExcel = () => {
    exportAttendanceToExcel(filteredRecords, settings.company_name);
  };

  const handleBackupJson = () => {
    const backupData = {
      fecha_exportacion: new Date().toISOString(),
      entidad: settings.company_name,
      configuracion: settings,
      personal: employees,
      asistencias: records,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_${settings.company_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitManualMark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmpId || !onManualMark) return;
    onManualMark(manualType, manualEmpId);
    setShowManualModal(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Controles de Búsqueda y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0a120e] p-3.5 rounded-2xl border border-stone-800">
        
        {/* Buscador */}
        <div className="flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por trabajador, cédula o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>

        {/* Filtros y Exportación */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-[11px]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                typeFilter === 'all' ? 'bg-emerald-800 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('entrada')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                typeFilter === 'entrada' ? 'bg-emerald-800 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setTypeFilter('salida')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                typeFilter === 'salida' ? 'bg-amber-800 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Salidas
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-stone-300 focus:outline-none focus:border-emerald-600 font-medium"
          >
            <option value="all">Calificación: Todas</option>
            <option value="puntual">Puntual</option>
            <option value="tardanza">Tardanza</option>
            <option value="salida_anticipada">Salida anticipada</option>
            <option value="salida_normal">Salida normal</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white text-xs font-bold rounded-xl border border-emerald-600/40 shadow-sm transition-all"
            title="Exportar a planilla Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleBackupJson}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold rounded-xl border border-stone-800 transition-colors"
            title="Copia completa JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          {onManualMark && (
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 text-xs font-bold rounded-xl border border-amber-700/50 transition-colors"
              title="Registrar marcación administrativa autorizada"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Marca Manual</span>
            </button>
          )}

        </div>

      </div>

      {/* Tabla de Registros */}
      <div className="overflow-x-auto rounded-2xl border border-stone-800/80 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0b140f] text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
              <th className="py-3 px-4">Trabajador & Puesto</th>
              <th className="py-3 px-3">Cédula CI</th>
              <th className="py-3 px-3">Tipo</th>
              <th className="py-3 px-3">Fecha & Hora Auditada</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-3">Ubicación GPS</th>
              <th className="py-3 px-3">Método</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50 text-stone-300">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-500 font-mono">
                  No hay registros de asistencia que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const hasCoords = rec.latitude && rec.longitude;
                const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` : null;

                return (
                  <tr key={rec.id} className="hover:bg-stone-900/50 transition-colors">
                    
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">
                        {rec.employee?.full_name || 'Trabajador no vinculado'}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <span>{rec.employee?.position || 'Personal'}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400">{rec.employee?.department || 'General'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {rec.employee?.document_id || 'N/A'}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        rec.record_type === 'entrada'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}>
                        {rec.record_type}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-stone-200">
                        {rec.timestamp_local}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {rec.timezone}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec.status === 'puntual'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : rec.status === 'tardanza'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-stone-900 text-stone-400 border border-stone-800'
                      }`}>
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {hasCoords ? (
                        <a
                          href={mapsUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-emerald-400 text-[11px] font-mono border border-stone-800 hover:border-emerald-600 transition-colors"
                          title="Abrir ubicación en Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rec.accuracy ? `±${Math.round(rec.accuracy)}m` : 'Ver mapa'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-stone-500" />
                        </a>
                      ) : (
                        <span className="text-stone-500 text-[11px] italic font-mono">Sin GPS</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-stone-400 text-[11px] font-mono">
                      {rec.scan_method === 'qr_scan' ? 'Móvil' : rec.scan_method === 'kiosk_scan' ? 'Kiosco' : 'Manual'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {rec.employee && (
                        <button
                          onClick={() => setSelectedEmployeeForBadge(rec.employee!)}
                          className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                          title="Ver carnet de este empleado"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie Informativo */}
      <div className="p-3 bg-[#0a120e] rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 font-mono gap-1">
        <span>
          Mostrando <b>{filteredRecords.length}</b> de <b>{records.length}</b> marcaciones auditadas
        </span>
        <span className="text-stone-500">
          Servidor: UTC sellado a {settings.timezone}
        </span>
      </div>

      {/* Modal Carnet Empleado */}
      {selectedEmployeeForBadge && (
        <EmployeeBadgeCard
          employee={selectedEmployeeForBadge}
          settings={settings}
          onClose={() => setSelectedEmployeeForBadge(null)}
        />
      )}

      {/* Modal Registro Manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-[#121815] rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-emerald-800/40 text-stone-100">
            <h3 className="font-bold text-white text-sm mb-1">
              Registro Manual de Asistencia
            </h3>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Facultad exclusiva de administración para asentar marcaciones justificadas fuera de escaneo.
            </p>

            <form onSubmit={submitManualMark} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Trabajador
                </label>
                <select
                  required
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Seleccionar personal...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} (CI: {emp.document_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Tipo de Marca
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('entrada')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      manualType === 'entrada'
                        ? 'bg-emerald-800 text-white border-emerald-600 shadow'
                        : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('salida')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      manualType === 'salida'
                        ? 'bg-amber-800 text-white border-amber-600 shadow'
                        : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                  >
                    Salida
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!manualEmpId}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
                >
                  Confirmar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
