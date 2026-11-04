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
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  Fingerprint
} from 'lucide-react';
import QRScannerModal from './QRScannerModal';
import EmployeeBadgeCard from './EmployeeBadgeCard';
import { ErrorBoundary } from './ErrorBoundary';
import CoopLogo from './CoopLogo';

export default function EmployeePortal() {
  const { user, attendance, settings } = useAuth();
  const [activeScanner, setActiveScanner] = useState<'entrada' | 'salida' | null>(null);
  const [showBadge, setShowBadge] = useState(false);

  // Registros exclusivos de este empleado
  const myRecords = attendance.filter(rec => rec.employee_id === user?.id || rec.employee?.id === user?.id);

  // Fecha de hoy local
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntrada = myRecords.find(r => r.record_type === 'entrada' && r.timestamp_local.startsWith(todayStr));
  const todaySalida = myRecords.find(r => r.record_type === 'salida' && r.timestamp_local.startsWith(todayStr));

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-10">
      
      {/* Credencial Digital de Campo */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#101E1A] border border-[#203B30] p-5 sm:p-6 text-white">
        
        {/* Iluminación ambiental sutil */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A878]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <CoopLogo size={34} className="w-9 h-9" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-white">
                  {settings.company_name}
                </div>
                <div className="text-[9px] text-[#A5B4AC]">
                  Control de Asistencia Laboral
                </div>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#063D32] border border-[#00A878]/30 text-[10px] text-[#00A878] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-pulse"></span>
              <span>Personal Activo</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {user?.full_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#A5B4AC] mt-1">
                <span className="text-[#00A878] font-semibold">{user?.position}</span>
                <span>&bull;</span>
                <span>{user?.department}</span>
              </div>
              <div className="text-xs font-mono text-[#A5B4AC] mt-2 flex items-center gap-1.5">
                <span>Cédula CI:</span>
                <span className="font-bold text-[#F5B942]">{user?.document_id}</span>
              </div>
            </div>

            <button
              onClick={() => setShowBadge(true)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-[#162720] hover:bg-[#203B30] border border-[#203B30] hover:border-[#00A878] text-[#F5F7F5] shadow-lg active:scale-95 transition-all p-2 shrink-0"
              title="Abrir carnet oficial"
            >
              <QrCode className="w-5 h-5 text-[#00A878] mb-0.5" />
              <span className="text-[9px] font-bold">Carnet</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#203B30] flex items-center justify-between text-[11px] text-[#A5B4AC] font-mono">
            <span>Horario: {user?.schedule_start?.substring(0, 5)} - {user?.schedule_end?.substring(0, 5)}</span>
            <span className="text-[#00A878]">Tolerancia: {settings.tolerance_minutes} min</span>
          </div>
        </div>
      </div>

      {/* Terminal Táctil de Marcación */}
      <div className="bg-[#101E1A] border border-[#203B30] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#203B30]">
          <div className="flex items-center space-x-2 text-[#F5F7F5]">
            <Radio className="w-4 h-4 text-[#00A878] animate-pulse" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Jornada de hoy ({todayStr})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#A5B4AC] bg-[#162720] px-2.5 py-0.5 rounded-full border border-[#203B30]">
            {settings.timezone}
          </span>
        </div>

        {/* Casillas de Estado Entrada / Salida */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Casilla Entrada */}
          <div className={`p-4 rounded-2xl border transition-all ${
            todayEntrada 
              ? 'bg-[#063D32]/50 border-[#00A878]/40 shadow-inner' 
              : 'bg-[#162720] border-[#203B30]'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00A878] block mb-1">
              Entrada
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
              {todayEntrada ? todayEntrada.timestamp_local.split(' ')[1] : '--:--:--'}
            </div>
            <div className="text-[11px] font-medium mt-1">
              {todayEntrada ? (
                <span className={`inline-flex items-center gap-1 font-semibold ${
                  todayEntrada.status === 'puntual' ? 'text-[#00A878]' : 'text-[#F5B942]'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="capitalize">{todayEntrada.status}</span>
                </span>
              ) : (
                <span className="text-stone-500 font-mono text-[10px]">Sin registrar</span>
              )}
            </div>
          </div>

          {/* Casilla Salida */}
          <div className={`p-4 rounded-2xl border transition-all ${
            todaySalida 
              ? 'bg-amber-950/40 border-amber-600/40 shadow-inner' 
              : 'bg-[#162720] border-[#203B30]'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F5B942] block mb-1">
              Salida
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
              {todaySalida ? todaySalida.timestamp_local.split(' ')[1] : '--:--:--'}
            </div>
            <div className="text-[11px] font-medium mt-1">
              {todaySalida ? (
                <span className="inline-flex items-center gap-1 text-[#F5B942] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Registrada</span>
                </span>
              ) : (
                <span className="text-stone-500 font-mono text-[10px]">Pendiente</span>
              )}
            </div>
          </div>

        </div>

        {/* Botones Grandes de Marcación Táctil (Ergonómicos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          
          {/* Botón Entrada */}
          <button
            onClick={() => setActiveScanner('entrada')}
            className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#00A878] to-[#008F68] hover:from-[#008F68] hover:to-[#063D32] active:scale-[0.98] text-white shadow-xl shadow-[#00A878]/30 border border-emerald-400/30 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black tracking-wider uppercase text-white">
                  Marcar Entrada
                </span>
                <span className="block text-[10px] text-white/80">
                  Escanear código QR
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Botón Salida */}
          <button
            onClick={() => setActiveScanner('salida')}
            className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#78350f] active:scale-[0.98] text-white shadow-xl shadow-amber-950/60 border border-amber-400/30 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black tracking-wider uppercase text-white">
                  Marcar Salida
                </span>
                <span className="block text-[10px] text-white/80">
                  Fin de jornada
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

      {/* Tira de Marcaciones Auditadas */}
      <div className="bg-[#101E1A] border border-[#203B30] rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#203B30]">
          <div className="flex items-center space-x-2 text-[#F5F7F5]">
            <Calendar className="w-4 h-4 text-[#A5B4AC]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Historial de marcaciones
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[#A5B4AC] flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#00A878]" /> Registro inmutable
          </span>
        </div>

        <p className="text-[11px] text-[#A5B4AC] leading-relaxed">
          Las horas son selladas por el reloj oficial de Cooperativa Chinokue Ltda.
        </p>

        <div className="divide-y divide-[#203B30] max-h-64 overflow-y-auto">
          {myRecords.length === 0 ? (
            <div className="py-8 text-center text-[#A5B4AC] text-xs font-mono">
              Sin registros de marcación en el historial.
            </div>
          ) : (
            myRecords.map((rec) => {
              const mapsUrl = rec.latitude && rec.longitude 
                ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` 
                : null;

              return (
                <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        rec.record_type === 'entrada'
                          ? 'bg-[#063D32] text-[#00A878] border border-[#00A878]/30'
                          : 'bg-amber-950 text-[#F5B942] border border-[#F5B942]/30'
                      }`}>
                        {rec.record_type}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {rec.timestamp_local}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#A5B4AC] font-mono flex items-center space-x-2">
                      <span>{rec.scan_method === 'qr_scan' ? 'Escaneo QR' : 'Kiosco'}</span>
                      {rec.accuracy && <span>&bull; GPS ±{Math.round(rec.accuracy)}m</span>}
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00A878] hover:underline flex items-center gap-0.5"
                        >
                          <span>Mapa</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      rec.status === 'puntual'
                        ? 'bg-emerald-950/60 text-[#00A878] border border-emerald-800/60'
                        : rec.status === 'tardanza'
                        ? 'bg-yellow-950/60 text-[#F5B942] border border-yellow-800/60'
                        : 'bg-[#162720] text-[#A5B4AC] border border-[#203B30]'
                    }`}>
                      {rec.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Cámara Seguro */}
      {activeScanner && (
        <ErrorBoundary fallbackTitle="Lector de cámara">
          <QRScannerModal
            recordType={activeScanner}
            onClose={() => setActiveScanner(null)}
            onSuccess={() => setActiveScanner(null)}
          />
        </ErrorBoundary>
      )}

      {/* Carnet Modal */}
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
