'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Camera, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  CreditCard,
  Building2,
  ArrowRight
} from 'lucide-react';
import QRScannerModal from './QRScannerModal';
import EmployeeBadgeCard from './EmployeeBadgeCard';

export default function EmployeePortal() {
  const { user, attendance, settings } = useAuth();
  const [activeScanner, setActiveScanner] = useState<'entrada' | 'salida' | null>(null);
  const [showBadge, setShowBadge] = useState(false);

  // Registros del empleado autenticado
  const myRecords = attendance.filter(rec => rec.employee_id === user?.id || rec.employee?.id === user?.id);

  // Fecha actual local
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntrada = myRecords.find(r => r.record_type === 'entrada' && r.timestamp_local.startsWith(todayStr));
  const todaySalida = myRecords.find(r => r.record_type === 'salida' && r.timestamp_local.startsWith(todayStr));

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">
      
      {/* Tarjeta de Identificación del Trabajador */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Personal activo
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {user?.full_name}
            </h2>
            <div className="text-xs text-stone-400 mt-0.5 space-x-2">
              <span>CI: <b className="text-stone-200 font-mono">{user?.document_id}</b></span>
              <span>&bull;</span>
              <span>{user?.position}</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Horario asignado: <span className="font-mono text-stone-300 font-semibold">{user?.schedule_start?.substring(0, 5)} a {user?.schedule_end?.substring(0, 5)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowBadge(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 rounded-xl border border-stone-700 text-xs font-semibold transition-all"
            title="Ver carnet con código QR"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Mi carnet</span>
          </button>
        </div>
      </div>

      {/* Marcación de Jornada */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Estado de hoy ({todayStr})</span>
          </h3>
          <span className="text-[11px] text-stone-500 font-mono">
            {settings.timezone.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Casilla Entrada */}
          <div className={`p-3.5 rounded-2xl border ${
            todayEntrada ? 'bg-emerald-50/80 border-emerald-200' : 'bg-stone-50 border-stone-200'
          }`}>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Entrada
            </span>
            <div className="font-mono text-base font-bold text-stone-900">
              {todayEntrada ? todayEntrada.timestamp_local.split(' ')[1] : '--:--:--'}
            </div>
            <div className="text-[11px] font-medium mt-1">
              {todayEntrada ? (
                <span className={todayEntrada.status === 'puntual' ? 'text-emerald-700' : 'text-amber-700'}>
                  {todayEntrada.status === 'puntual' ? 'Puntual' : 'Tardanza'}
                </span>
              ) : (
                <span className="text-stone-400">Sin marcar</span>
              )}
            </div>
          </div>

          {/* Casilla Salida */}
          <div className={`p-3.5 rounded-2xl border ${
            todaySalida ? 'bg-stone-100 border-stone-300' : 'bg-stone-50 border-stone-200'
          }`}>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Salida
            </span>
            <div className="font-mono text-base font-bold text-stone-900">
              {todaySalida ? todaySalida.timestamp_local.split(' ')[1] : '--:--:--'}
            </div>
            <div className="text-[11px] font-medium mt-1">
              {todaySalida ? (
                <span className="text-stone-700">Registrada</span>
              ) : (
                <span className="text-stone-400">Pendiente</span>
              )}
            </div>
          </div>
        </div>

        {/* Botones Grandes de Marcación con Cámara */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => setActiveScanner('entrada')}
            className="flex items-center justify-center space-x-2.5 py-3.5 px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Marcar entrada con QR</span>
          </button>

          <button
            onClick={() => setActiveScanner('salida')}
            className="flex items-center justify-center space-x-2.5 py-3.5 px-4 bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Marcar salida con QR</span>
          </button>
        </div>

      </div>

      {/* Historial de Asistencias (Solo Lectura) */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-600" />
            <span>Historial de marcaciones</span>
          </h3>
          <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
            <Lock className="w-3 h-3" /> Solo lectura
          </span>
        </div>

        <p className="text-[11px] text-stone-500 leading-relaxed">
          Las marcaciones son registradas por el reloj del sistema. Para justificaciones o correcciones de horario, consulte con Administración.
        </p>

        <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
          {myRecords.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              No cuenta con registros de asistencia aún.
            </div>
          ) : (
            myRecords.map((rec) => (
              <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rec.record_type === 'entrada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-800'
                    }`}>
                      {rec.record_type}
                    </span>
                    <span className="font-mono font-semibold text-stone-800">
                      {rec.timestamp_local}
                    </span>
                  </div>
                  {rec.accuracy && (
                    <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>GPS ±{Math.round(rec.accuracy)}m</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    rec.status === 'puntual'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : rec.status === 'tardanza'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}>
                    {rec.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Cámara */}
      {activeScanner && (
        <QRScannerModal
          recordType={activeScanner}
          onClose={() => setActiveScanner(null)}
          onSuccess={() => setActiveScanner(null)}
        />
      )}

      {/* Modal de Carnet */}
      {showBadge && user && (
        <EmployeeBadgeCard
          employee={user}
          settings={settings}
          onClose={() => setShowBadge(false)}
        />
      )}

    </div>
  );
}
