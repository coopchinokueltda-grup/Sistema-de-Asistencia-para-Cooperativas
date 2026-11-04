'use client';

import React, { useState } from 'react';
import { AttendanceRecord, Profile, SystemSettings } from '@/types';
import { 
  FileSpreadsheet, 
  Search, 
  MapPin, 
  ExternalLink, 
  PlusCircle, 
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  Monitor,
  Fingerprint,
  Eye,
  X
} from 'lucide-react';
import { exportAttendanceToExcel } from '@/lib/excel';
import RecordDetailModal from './RecordDetailModal';
import EmployeeBadgeCard from './EmployeeBadgeCard';

interface Props {
  records: AttendanceRecord[];
  employees: Profile[];
  settings: SystemSettings;
  onManualMark?: (type: 'entrada' | 'salida', employeeId: string) => void;
  compact?: boolean;
  limit?: number;
}

export default function AdminAttendanceTable({ 
  records, 
  employees, 
  settings, 
  onManualMark,
  compact = false,
  limit
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AttendanceRecord | null>(null);
  const [selectedEmployeeForBadge, setSelectedEmployeeForBadge] = useState<Profile | null>(null);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualType, setManualType] = useState<'entrada' | 'salida'>('entrada');

  // Filtrado de registros
  const filteredRecords = records.filter(rec => {
    const empName = rec.employee?.full_name?.toLowerCase() || '';
    const empDoc = rec.employee?.document_id?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || empName.includes(term) || empDoc.includes(term) || rec.timestamp_local.includes(term);
    const matchesType = typeFilter === 'all' || rec.record_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const displayedRecords = limit ? filteredRecords.slice(0, limit) : filteredRecords;

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

  // Función para formatear fecha secundaria (ej: "Mar, 04 de Noviembre")
  const formatSecondaryDate = (localIso: string) => {
    try {
      const parts = localIso.split(' ')[0].split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const formatted = d.toLocaleDateString('es-PY', {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return localIso.split(' ')[0];
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Controles de Búsqueda, Filtro y Exportación (Cuando no es compacto o en vista completa) */}
      {!compact && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#101E1A] p-4 rounded-2xl border border-[#203B30] shadow-md">
          
          {/* Buscador */}
          <div className="flex-1 max-w-sm relative">
            <Search className="w-4 h-4 text-[#A5B4AC] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por trabajador, cédula o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-[#F5F7F5] placeholder-[#A5B4AC] focus:outline-none focus:border-[#00A878] font-medium"
            />
          </div>

          {/* Filtros de Tipo y Estado */}
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="flex items-center space-x-1 bg-[#162720] p-1 rounded-xl border border-[#203B30] text-[11px]">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  typeFilter === 'all' 
                    ? 'bg-[#00A878] text-white shadow-sm' 
                    : 'text-[#A5B4AC] hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('entrada')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  typeFilter === 'entrada' 
                    ? 'bg-[#008F68] text-white shadow-sm' 
                    : 'text-[#A5B4AC] hover:text-white'
                }`}
              >
                Entradas
              </button>
              <button
                onClick={() => setTypeFilter('salida')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  typeFilter === 'salida' 
                    ? 'bg-amber-700 text-white shadow-sm' 
                    : 'text-[#A5B4AC] hover:text-white'
                }`}
              >
                Salidas
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-[#162720] border border-[#203B30] rounded-xl px-3 py-1.5 text-[#F5F7F5] focus:outline-none focus:border-[#00A878] font-medium"
            >
              <option value="all">Calificación: Todas</option>
              <option value="puntual">Puntual</option>
              <option value="tardanza">Tardanza</option>
              <option value="salida_anticipada">Salida anticipada</option>
              <option value="salida_normal">Salida normal</option>
            </select>

            {onManualMark && (
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#162720] hover:bg-[#203B30] text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/40 transition-all"
                title="Cargar marcación administrativa manual"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#008F68] hover:bg-[#00A878] text-white text-xs font-bold rounded-xl border border-emerald-500/40 shadow-sm transition-all"
              title="Exportar a planilla Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Exportar</span>
            </button>

            <button
              onClick={handleBackupJson}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#162720] hover:bg-[#203B30] text-[#A5B4AC] hover:text-white text-xs font-semibold rounded-xl border border-[#203B30] transition-colors"
              title="Copia completa JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      )}

      {/* Contenedor de la Tabla Principal */}
      <div className="bg-[#101E1A] rounded-3xl border border-[#203B30] overflow-hidden shadow-xl">
        
        {/* Cabecera interna si es vista compacta */}
        {compact && (
          <div className="px-5 py-4 border-b border-[#203B30] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[#00A878] font-bold text-sm">👥</span>
              <h3 className="text-white font-bold text-sm tracking-tight">
                Marcaciones Recientes
              </h3>
            </div>
            <span className="text-xs font-mono text-[#A5B4AC]">
              Mostrando {displayedRecords.length} de {records.length}
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071512] text-[#A5B4AC] font-bold uppercase tracking-wider text-[10px] border-b border-[#203B30]">
              <tr>
                <th className="py-3.5 px-4">Trabajador & Puesto</th>
                <th className="py-3.5 px-3">Cédula CI</th>
                <th className="py-3.5 px-3">Tipo</th>
                <th className="py-3.5 px-4">Fecha & Hora</th>
                <th className="py-3.5 px-3">Estado</th>
                <th className="py-3.5 px-3">Ubicación GPS</th>
                <th className="py-3.5 px-3">Método</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#203B30]/60 text-[#F5F7F5]">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A5B4AC]">
                    No se encontraron registros de marcación con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((rec) => {
                  const emp = rec.employee || employees.find(e => e.id === rec.employee_id);
                  const isEntrada = rec.record_type === 'entrada';
                  const hasGps = rec.latitude && rec.longitude;
                  const gmapsUrl = hasGps ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` : null;

                  return (
                    <tr 
                      key={rec.id} 
                      className="hover:bg-[#162720]/80 transition-colors group"
                    >
                      {/* Trabajador & Puesto con Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A878] to-[#063D32] border border-[#203B30] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {emp?.full_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-[#00A878] transition-colors">
                              {emp?.full_name || 'Trabajador'}
                            </div>
                            <div className="text-[10px] text-[#A5B4AC]">
                              {emp?.position || 'Personal Operativo'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cédula CI */}
                      <td className="py-3 px-3 font-mono font-bold text-stone-200">
                        {emp?.document_id || 'N/D'}
                      </td>

                      {/* Tipo de Marcación (Píldora con ícono) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isEntrada ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#063D32] text-[#00A878] border border-[#00A878]/30">
                            <Fingerprint className="w-3 h-3" />
                            Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/70 text-[#F5B942] border border-[#F5B942]/30">
                            <Fingerprint className="w-3 h-3" />
                            Salida
                          </span>
                        )}
                      </td>

                      {/* Fecha & Hora */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-white text-xs font-semibold">
                          {rec.timestamp_local}
                        </div>
                        <div className="text-[10px] text-[#A5B4AC]">
                          {formatSecondaryDate(rec.timestamp_local)}
                        </div>
                      </td>

                      {/* Estado / Calificación */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {rec.status === 'puntual' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-[#00A878] border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" />
                            Puntual
                          </span>
                        ) : rec.status === 'tardanza' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-950/60 text-[#F5B942] border border-yellow-800/40">
                            <AlertTriangle className="w-3 h-3" />
                            Tardanza
                          </span>
                        ) : rec.status === 'salida_anticipada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-stone-300 border border-stone-700">
                            <Clock className="w-3 h-3" />
                            Salida Anticipada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-stone-300 border border-stone-800">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Ubicación GPS con pin interactivo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {hasGps ? (
                          <a
                            href={gmapsUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#00A878] hover:underline"
                            title="Ver en Google Maps"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#00A878]" />
                            <span>{rec.latitude?.toFixed(1)}, {rec.longitude?.toFixed(1)}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#A5B4AC]">
                            <MapPin className="w-3.5 h-3.5 opacity-40" />
                            <span>Sin GPS</span>
                          </span>
                        )}
                      </td>

                      {/* Método */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-300">
                          {rec.scan_method === 'kiosk_scan' ? (
                            <>
                              <Monitor className="w-3.5 h-3.5 text-[#F5B942]" />
                              <span>Kiosco</span>
                            </>
                          ) : rec.scan_method === 'manual_admin' ? (
                            <>
                              <PlusCircle className="w-3.5 h-3.5 text-stone-400" />
                              <span>Manual</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3.5 h-3.5 text-[#00A878]" />
                              <span>Móvil</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Botón Acción (Ver Detalle) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecordForDetail(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#162720] hover:bg-[#203B30] text-[#00A878] hover:text-white rounded-lg border border-[#203B30] transition-all text-[11px] font-bold"
                          title="Ver detalle completo de marcación"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal de Detalle Completo de la Marcación */}
      {selectedRecordForDetail && (
        <RecordDetailModal
          record={selectedRecordForDetail}
          employee={employees.find(e => e.id === selectedRecordForDetail.employee_id) || selectedRecordForDetail.employee}
          onClose={() => setSelectedRecordForDetail(null)}
          onViewBadge={() => {
            const emp = employees.find(e => e.id === selectedRecordForDetail.employee_id) || selectedRecordForDetail.employee;
            if (emp) setSelectedEmployeeForBadge(emp);
          }}
        />
      )}

      {/* Modal para Visualizar Carnet QR */}
      {selectedEmployeeForBadge && (
        <EmployeeBadgeCard
          employee={selectedEmployeeForBadge}
          settings={settings}
          onClose={() => setSelectedEmployeeForBadge(null)}
        />
      )}

      {/* Modal de Registro Manual Administrativo */}
      {showManualModal && onManualMark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101E1A] border border-[#203B30] rounded-3xl max-w-md w-full p-6 text-[#F5F7F5] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#203B30] mb-4">
              <h3 className="font-bold text-sm text-white">Registro Administrativo Manual</h3>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-[#A5B4AC] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitManualMark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                  Seleccionar Trabajador
                </label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  required
                  className="w-full bg-[#162720] border border-[#203B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A878]"
                >
                  <option value="">Seleccione un empleado...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.document_id}) - {e.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                  Tipo de Marcación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('entrada')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      manualType === 'entrada'
                        ? 'bg-[#008F68] text-white border-[#00A878]'
                        : 'bg-[#162720] text-[#A5B4AC] border-[#203B30]'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('salida')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      manualType === 'salida'
                        ? 'bg-amber-700 text-white border-amber-600'
                        : 'bg-[#162720] text-[#A5B4AC] border-[#203B30]'
                    }`}
                  >
                    Salida
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#A5B4AC]">
                Esta acción registrará la hora actual del servidor con el huso horario legal de Paraguay.
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-[#162720] text-[#A5B4AC] hover:text-white text-xs font-bold rounded-xl border border-[#203B30]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00A878] hover:bg-[#008F68] text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
