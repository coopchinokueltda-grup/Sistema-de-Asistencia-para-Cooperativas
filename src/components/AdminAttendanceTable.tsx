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
  Calendar
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
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
      
      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Buscador */}
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">Todas las marcas</option>
            <option value="entrada">Solo entradas</option>
            <option value="salida">Solo salidas</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">Todos los estados</option>
            <option value="puntual">Puntual</option>
            <option value="tardanza">Tardanza</option>
            <option value="salida_anticipada">Salida anticipada</option>
            <option value="salida_normal">Salida normal</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all"
            title="Descargar reporte en Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleBackupJson}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl transition-all"
            title="Descargar copia de seguridad en JSON"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Copia JSON</span>
          </button>

          {onManualMark && (
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all"
              title="Registrar marcación administrativa"
            >
              <PlusCircle className="w-3.5 h-3.5 text-stone-300" />
              <span>Registro manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-100/70 text-stone-600 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <th className="py-2.5 px-4">Personal</th>
              <th className="py-2.5 px-3">Cédula CI</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Fecha y hora</th>
              <th className="py-2.5 px-3">Calificación</th>
              <th className="py-2.5 px-3">Ubicación GPS</th>
              <th className="py-2.5 px-3">Método</th>
              <th className="py-2.5 px-4 text-right">Carnet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-400">
                  No hay registros de asistencia para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const hasCoords = rec.latitude && rec.longitude;
                const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` : null;

                return (
                  <tr key={rec.id} className="hover:bg-stone-50 transition-colors">
                    
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-stone-900">
                        {rec.employee?.full_name || 'Personal no vinculado'}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {rec.employee?.position || 'Sin cargo'} &bull; {rec.employee?.department || 'General'}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-medium text-stone-800">
                      {rec.employee?.document_id || 'N/A'}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.record_type === 'entrada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}>
                        {rec.record_type}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-stone-800">
                      {rec.timestamp_local}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                        rec.status === 'puntual'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.status === 'tardanza'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {hasCoords ? (
                        <a
                          href={mapsUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono border border-stone-200 transition-colors"
                          title="Ver en Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-stone-500" />
                          <span>{rec.accuracy ? `±${Math.round(rec.accuracy)}m` : 'Ver'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                        </a>
                      ) : (
                        <span className="text-stone-400 text-[11px] italic">No registrada</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-stone-500">
                      {rec.scan_method === 'qr_scan' ? 'Móvil' : rec.scan_method === 'kiosk_scan' ? 'Kiosco' : 'Manual'}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      {rec.employee && (
                        <button
                          onClick={() => setSelectedEmployeeForBadge(rec.employee!)}
                          className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                          title="Ver carnet de este empleado"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* Pie de tabla */}
      <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-1">
        <span>
          {filteredRecords.length} registros en lista
        </span>
        <span className="font-mono text-stone-400">
          Huso horario: {settings.timezone}
        </span>
      </div>

      {/* Modal Carnet */}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm mb-1">
              Registro manual de marcación
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Uso administrativo para registrar asistencia no procesada por escáner.
            </p>

            <form onSubmit={submitManualMark} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Empleado
                </label>
                <select
                  required
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Seleccionar personal...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.document_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tipo de marcación
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('entrada')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border ${
                      manualType === 'entrada'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('salida')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border ${
                      manualType === 'salida'
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
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
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!manualEmpId}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
