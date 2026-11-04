'use client';

import React from 'react';
import { AttendanceRecord, Profile } from '@/types';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Monitor, 
  Fingerprint, 
  ExternalLink,
  ShieldCheck,
  User
} from 'lucide-react';
import CoopLogo from './CoopLogo';

interface Props {
  record: AttendanceRecord;
  employee?: Profile;
  onClose: () => void;
  onViewBadge?: () => void;
}

export default function RecordDetailModal({ record, employee, onClose, onViewBadge }: Props) {
  const isEntrada = record.record_type === 'entrada';
  const hasCoords = record.latitude && record.longitude;
  const mapsUrl = hasCoords 
    ? `https://www.google.com/maps?q=${record.latitude},${record.longitude}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#101E1A] border border-[#203B30] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-[#F5F7F5] relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente institucional */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#063D32] to-[#162720] border-b border-[#203B30] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CoopLogo size={32} className="w-8 h-8" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                Detalle de Marcación
              </h3>
              <p className="text-[11px] text-[#A5B4AC] font-mono">
                ID Registro: {record.id.substring(0, 13)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B4AC] hover:text-white p-1.5 rounded-xl hover:bg-[#203B30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Tarjeta del Trabajador */}
          <div className="flex items-center justify-between p-4 bg-[#162720] rounded-2xl border border-[#203B30]">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00A878] to-[#008F68] flex items-center justify-center text-white font-black text-lg shadow-lg border border-white/20">
                {record.employee?.full_name?.charAt(0) || employee?.full_name?.charAt(0) || 'T'}
              </div>
              <div>
                <h4 className="font-bold text-white text-base leading-tight">
                  {record.employee?.full_name || employee?.full_name || 'Trabajador'}
                </h4>
                <p className="text-xs text-[#00A878] font-medium">
                  {record.employee?.position || employee?.position || 'Personal de la Cooperativa'}
                </p>
                <div className="text-[11px] text-[#A5B4AC] font-mono mt-0.5">
                  CI: <span className="text-[#F5B942] font-bold">{record.employee?.document_id || employee?.document_id || 'N/D'}</span>
                </div>
              </div>
            </div>

            {onViewBadge && (
              <button
                onClick={onViewBadge}
                className="px-3 py-1.5 bg-[#101E1A] hover:bg-[#203B30] text-[#00A878] text-xs font-bold rounded-xl border border-[#203B30] transition-colors flex items-center gap-1.5"
              >
                <span>Carnet</span>
              </button>
            )}
          </div>

          {/* Estado y Tipo de Marcación */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl border ${
              isEntrada 
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' 
                : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1 flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Tipo de Marcación</span>
              </div>
              <div className="text-base font-black uppercase">
                {isEntrada ? '🟢 Entrada Laboral' : '🟠 Salida Laboral'}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              record.status === 'puntual' || record.status === 'salida_normal'
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                : 'bg-yellow-950/40 border-yellow-800/40 text-[#F5B942]'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1 flex items-center gap-1">
                {record.status === 'puntual' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>Calificación</span>
              </div>
              <div className="text-base font-black uppercase">
                {record.status === 'puntual' ? '✓ Puntual' : 
                 record.status === 'tardanza' ? '⚠ Tardanza' : 
                 record.status === 'salida_anticipada' ? '⚠ Anticipada' : '✓ Normal'}
              </div>
            </div>
          </div>

          {/* Fecha, Hora y Zona Horaria Oficial */}
          <div className="bg-[#162720] rounded-2xl p-4 border border-[#203B30] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#203B30]">
              <span className="text-[#A5B4AC] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00A878]" />
                Hora Local (Paraguay):
              </span>
              <span className="font-black text-white text-sm">
                {record.timestamp_local}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#203B30]">
              <span className="text-[#A5B4AC] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00A878]" />
                Sello Horario UTC:
              </span>
              <span className="text-[#A5B4AC]">
                {record.timestamp_utc}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A5B4AC] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00A878]" />
                Huso Horario Legal:
              </span>
              <span className="text-[#00A878] font-bold">
                {record.timezone || 'America/Asuncion'}
              </span>
            </div>
          </div>

          {/* Geolocalización y Dispositivo */}
          <div className="bg-[#162720] rounded-2xl p-4 border border-[#203B30] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${hasCoords ? 'text-[#00A878]' : 'text-stone-500'}`} />
                <span className="text-xs font-bold text-white">Geolocalización GPS</span>
              </div>
              {hasCoords && mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A878] hover:text-[#008F68] transition-colors"
                >
                  <span>Abrir en Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {hasCoords ? (
              <div className="p-3 bg-[#101E1A] rounded-xl border border-[#203B30] font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#A5B4AC]">Coordenadas:</span>
                  <span className="text-white font-bold">{record.latitude?.toFixed(6)}, {record.longitude?.toFixed(6)}</span>
                </div>
                {record.accuracy && (
                  <div className="flex justify-between">
                    <span className="text-[#A5B4AC]">Precisión del satélite:</span>
                    <span className="text-[#00A878] font-bold">±{Math.round(record.accuracy)} metros</span>
                  </div>
                )}
                {record.location_address && (
                  <div className="pt-1 text-[11px] text-stone-300">
                    {record.location_address}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#A5B4AC] italic">
                Marcación registrada sin captura de coordenadas GPS.
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#203B30] text-xs text-[#A5B4AC]">
              <span className="flex items-center gap-1.5">
                {record.scan_method === 'kiosk_scan' ? (
                  <Monitor className="w-3.5 h-3.5 text-[#F5B942]" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-[#00A878]" />
                )}
                Método de registro:
              </span>
              <span className="font-bold text-white uppercase">
                {record.scan_method === 'kiosk_scan' ? 'Kiosco Central' : 
                 record.scan_method === 'manual_admin' ? 'Manual (Admin)' : 'Móvil Escáner'}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#162720] border-t border-[#203B30] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#203B30] hover:bg-[#008F68] text-white text-xs font-bold rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
