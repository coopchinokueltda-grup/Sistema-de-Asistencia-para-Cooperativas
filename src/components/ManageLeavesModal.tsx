'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LeaveType, Profile } from '@/types';
import { 
  X, 
  Calendar, 
  HeartPulse, 
  Palmtree, 
  ShieldCheck, 
  Check, 
  Trash2, 
  AlertCircle,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import CoopLogo from './CoopLogo';

interface Props {
  onClose: () => void;
  preselectedEmployee?: Profile;
}

export default function ManageLeavesModal({ onClose, preselectedEmployee }: Props) {
  const { employees, leaves, registerEmployeeLeave, deleteEmployeeLeave } = useAuth();

  const [selectedEmpId, setSelectedEmpId] = useState(preselectedEmployee?.id || (employees[0]?.id || ''));
  const [leaveType, setLeaveType] = useState<LeaveType>('reposo_medico');
  
  const todayIso = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedEmpId) {
      setErrorMsg('Debe seleccionar un empleado.');
      return;
    }

    if (startDate > endDate) {
      setErrorMsg('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setLoading(true);

    const res = await registerEmployeeLeave({
      employee_id: selectedEmpId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || undefined,
      is_active: true,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'No fue posible registrar la licencia.');
      setLoading(false);
      return;
    }

    setSuccessMsg(true);
    setReason('');
    setLoading(false);
    setTimeout(() => setSuccessMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#101E1A] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#203B30] text-[#F5F7F5]">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#071512] border-b border-[#203B30] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CoopLogo size={28} className="w-7 h-7" />
            <div>
              <h3 className="font-bold text-sm text-white">Gestión de Reposo y Vacaciones</h3>
              <p className="text-[11px] text-[#A5B4AC]">Marcación automática justificada de asistencia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B4AC] hover:text-white p-1 rounded-xl hover:bg-[#162720] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-[#EF5350]/40 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF5350] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#063D32] border border-[#00A878] rounded-2xl text-xs text-[#00A878] font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Período registrado. El sistema justificará la asistencia diaria de forma automática.</span>
            </div>
          )}

          {/* Formulario de Alta de Licencia */}
          <form onSubmit={handleSubmit} className="p-4 bg-[#162720] rounded-2xl border border-[#203B30] space-y-3.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-[#203B30]">
              <PlusCircle className="w-4 h-4 text-[#00A878]" />
              <span>Asignar nuevo período de reposo o vacaciones</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#A5B4AC] mb-1">
                  Empleado Beneficiario *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                  className="w-full bg-[#101E1A] border border-[#203B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A878]"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.document_id}) - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A5B4AC] mb-1">
                  Tipo de Justificación *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full bg-[#101E1A] border border-[#203B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A878]"
                >
                  <option value="reposo_medico">🏥 Reposo Médico / IPS</option>
                  <option value="vacaciones">🏖️ Vacaciones Anuales</option>
                  <option value="permiso_especial">📄 Permiso Especial Autorizado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#A5B4AC] mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#101E1A] border border-[#203B30] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A5B4AC] mb-1">
                  Fecha de Culminación *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#101E1A] border border-[#203B30] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#00A878]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A5B4AC] mb-1">
                Detalle / Justificativo (Nº Certificado, médico o resolución)
              </label>
              <input
                type="text"
                placeholder="Ej: Certificado Médico IPS Nº 8492 - Reposo 5 días"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#101E1A] border border-[#203B30] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00A878]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[#A5B4AC] italic">
                Marcación automática activada hasta la fecha de culminación.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#00A878] hover:bg-[#008F68] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Guardando...' : 'Autorizar Período'}</span>
              </button>
            </div>
          </form>

          {/* Listado de Períodos Activos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A5B4AC]">
              Períodos Registrados ({leaves.length})
            </h4>

            {leaves.length === 0 ? (
              <p className="text-xs text-[#A5B4AC] italic py-3 text-center bg-[#162720] rounded-2xl border border-[#203B30]">
                No hay períodos de reposo o vacaciones activos en este momento.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {leaves.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employee_id);
                  const isCurrent = leave.start_date <= todayIso && leave.end_date >= todayIso;

                  return (
                    <div 
                      key={leave.id}
                      className="p-3 bg-[#162720] rounded-2xl border border-[#203B30] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{emp?.full_name || 'Empleado'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            leave.leave_type === 'vacaciones' 
                              ? 'bg-amber-950 text-[#F5B942] border border-[#F5B942]/30'
                              : 'bg-[#063D32] text-[#00A878] border border-[#00A878]/30'
                          }`}>
                            {leave.leave_type.replace('_', ' ')}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00A878] text-white animate-pulse">
                              En Curso
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#A5B4AC] font-mono">
                          Vigencia: <span className="text-white font-semibold">{leave.start_date}</span> hasta <span className="text-white font-semibold">{leave.end_date}</span>
                        </div>

                        {leave.reason && (
                          <div className="text-[10px] text-stone-300 italic">
                            {leave.reason}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => deleteEmployeeLeave(leave.id)}
                        className="p-1.5 text-[#A5B4AC] hover:text-[#EF5350] hover:bg-[#101E1A] rounded-xl transition-colors"
                        title="Eliminar período"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
