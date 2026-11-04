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
  Sparkles,
  ExternalLink
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
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#071710] via-[#0b2118] to-[#040e09] border border-emerald-700/40 p-5 sm:p-6 text-white">
        
        {/* Iluminación ambiental de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CoopLogo size={32} className="w-8 h-8" />
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                {settings.company_name}
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-[10px] text-emerald-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Personal Activo</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow">
                {user?.full_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-300 mt-1">
                <span className="text-emerald-400 font-semibold">{user?.position}</span>
                <span>&bull;</span>
                <span className="text-stone-400">{user?.department}</span>
              </div>
              <div className="text-xs font-mono text-stone-400 mt-2 flex items-center gap-1.5">
                <span className="text-stone-500">Cédula CI:</span>
                <span className="font-bold text-amber-300">{user?.document_id}</span>
              </div>
            </div>

            <button
              onClick={() => setShowBadge(true)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700/80 hover:border-emerald-500 text-stone-200 hover:text-white shadow-lg active:scale-95 transition-all p-2 flex-shrink-0"
              title="Abrir carnet oficial"
            >
              <QrCode className="w-5 h-5 text-emerald-400 mb-0.5" />
              <span className="text-[9px] font-bold tracking-tight">Carnet</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span>Horario: {user?.schedule_start?.substring(0, 5)} - {user?.schedule_end?.substring(0, 5)}</span>
            <span className="text-emerald-400/80">Tolerancia: {settings.tolerance_minutes}m</span>
          </div>
        </div>
      </div>

      {/* Terminal Táctil de Marcación */}
      <div className="bg-[#121815] border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2 text-stone-200">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-300">
              Jornada de hoy ({todayStr})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
            {settings.timezone.split('/')[1] || 'Asunción'}
          </span>
        </div>

        {/* Casillas de Estado Entrada / Salida */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Casilla Entrada */}
          <div className={`p-4 rounded-2xl border transition-all ${
            todayEntrada 
              ? 'bg-gradient-to-br from-[#0c2217] to-[#081810] border-emerald-600/40 shadow-inner shadow-emerald-950/50' 
              : 'bg-stone-900/70 border-stone-800'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/80 block mb-1">
              Entrada
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
              {todayEntrada ? todayEntrada.timestamp_local.split(' ')[1] : '--:--:--'}
            </div>
            <div className="text-[11px] font-medium mt-1">
              {todayEntrada ? (
                <span className={`inline-flex items-center gap-1 font-semibold ${
                  todayEntrada.status === 'puntual' ? 'text-emerald-400' : 'text-amber-400'
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
              ? 'bg-gradient-to-br from-[#241708] to-[#160e05] border-amber-600/40 shadow-inner shadow-amber-950/50' 
              : 'bg-stone-900/70 border-stone-800'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/80 block mb-1">
              Salida
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
              {todaySalida ? todaySalida.timestamp_local.split(' ')[1] : '--:--:--'}
            </div>
            <div className="text-[11px] font-medium mt-1">
              {todaySalida ? (
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
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
            className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white shadow-xl shadow-emerald-950/60 border border-emerald-500/40 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black tracking-wider uppercase text-white">
                  Marcar Entrada
                </span>
                <span className="block text-[10px] text-emerald-200">
                  Escanear código QR
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Botón Salida */}
          <button
            onClick={() => setActiveScanner('salida')}
            className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 active:scale-[0.98] text-white shadow-xl shadow-amber-950/60 border border-amber-500/40 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black tracking-wider uppercase text-white">
                  Marcar Salida
                </span>
                <span className="block text-[10px] text-amber-200">
                  Fin de jornada
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

      {/* Tira de Marcaciones Auditadas (Estilo Cinta de Reloj de Control) */}
      <div className="bg-[#121815] border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2 text-stone-200">
            <Calendar className="w-4 h-4 text-stone-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-300">
              Historial de marcaciones
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-stone-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-stone-500" /> Registro inmutable
          </span>
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          Las horas son selladas por el reloj oficial de la cooperativa. Para aclaraciones o constancias, acuda a la Administración.
        </p>

        <div className="divide-y divide-stone-800 max-h-64 overflow-y-auto">
          {myRecords.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs font-mono">
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        rec.record_type === 'entrada'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}>
                        {rec.record_type}
                      </span>
                      <span className="font-mono font-bold text-stone-200">
                        {rec.timestamp_local}
                      </span>
                    </div>

                    <div className="text-[10px] text-stone-500 font-mono flex items-center space-x-2">
                      <span>{rec.scan_method === 'qr_scan' ? 'Escaneo QR' : 'Kiosco'}</span>
                      {rec.accuracy && <span>&bull; GPS ±{Math.round(rec.accuracy)}m</span>}
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                        >
                          <span>Mapa</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      rec.status === 'puntual'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : rec.status === 'tardanza'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                        : 'bg-stone-900 text-stone-400 border border-stone-800'
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
