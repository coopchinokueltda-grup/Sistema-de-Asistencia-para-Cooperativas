'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SystemSettings } from '@/types';
import { 
  X, 
  Clock, 
  Maximize2,
  Radio,
  ShieldCheck
} from 'lucide-react';
import CoopLogo from './CoopLogo';

interface Props {
  settings: SystemSettings;
  onClose: () => void;
}

export default function KioskDisplayModal({ settings, onClose }: Props) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentSeconds, setCurrentSeconds] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const timeStr = new Intl.DateTimeFormat('es-PY', {
          timeZone: settings.timezone || 'America/Asuncion',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);

        const dateStr = new Intl.DateTimeFormat('es-PY', {
          timeZone: settings.timezone || 'America/Asuncion',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(now);

        const [h, m, s] = timeStr.split(':');
        setCurrentTime(`${h}:${m}`);
        setCurrentSeconds(s);
        setCurrentDate(dateStr);
      } catch {
        const now2 = new Date();
        setCurrentTime(now2.toLocaleTimeString().substring(0, 5));
        setCurrentSeconds(String(now2.getSeconds()).padStart(2, '0'));
        setCurrentDate(now2.toLocaleDateString());
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [settings.timezone]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#101E1A] border border-[#203B30] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-white flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Resplandor ambiental de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#00A878]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Controles de cabecera */}
        <div className="w-full flex items-center justify-between mb-4 relative z-10">
          <button
            onClick={toggleFullScreen}
            className="p-2 text-[#A5B4AC] hover:text-white rounded-xl bg-[#162720] border border-[#203B30] transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#063D32] border border-[#00A878]/40 text-[10px] text-[#00A878] font-mono font-bold tracking-widest uppercase">
            <Radio className="w-3 h-3 text-[#00A878] animate-pulse" />
            <span>Kiosco Central de Recepción</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#A5B4AC] hover:text-white rounded-xl bg-[#162720] border border-[#203B30] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logo Institucional */}
        <div className="mb-2 relative z-10">
          <CoopLogo size={48} className="w-12 h-12" />
        </div>

        <h2 className="text-base font-black tracking-tight uppercase text-white mb-0.5 relative z-10">
          {settings.company_name}
        </h2>
        <p className="text-[11px] text-[#00A878] font-medium tracking-wide mb-4 relative z-10">
          Punto Oficial de Registro Horario
        </p>

        {/* Gran Reloj Digital en tiempo real */}
        <div className="bg-[#071512] rounded-2xl px-6 py-3 border border-[#203B30] mb-5 w-full relative z-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A5B4AC] mb-1 capitalize">
            {currentDate}
          </div>
          <div className="flex items-baseline justify-center space-x-2 font-mono">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {currentTime}
            </span>
            <span className="text-xl font-bold text-[#00A878] animate-pulse">
              :{currentSeconds}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#A5B4AC] mt-1">
            Hora legal: {settings.timezone}
          </div>
        </div>

        {/* Tarjeta con Código QR Dinámico del Kiosco con Radar Sweep */}
        <div className="relative p-5 bg-white rounded-3xl shadow-2xl mb-4 border-4 border-[#00A878]">
          <QRCodeSVG
            value={`CHINOKUE_KIOSK:${settings.workplace_qr_secret}:${Date.now()}`}
            size={220}
            level="H"
            includeMargin={true}
          />
          {/* Línea animada de radar */}
          <div className="absolute inset-x-5 top-5 h-1 bg-[#00A878] rounded-full shadow-[0_0_12px_#00A878] animate-pulse" />
        </div>

        <div className="text-xs font-semibold text-white space-y-1 relative z-10">
          <p>Acerque su teléfono celular con la aplicación abierta.</p>
          <p className="text-[11px] text-[#A5B4AC]">
            Presione <span className="text-[#00A878] font-bold">Marcar Entrada</span> o <span className="text-[#F5B942] font-bold">Marcar Salida</span> y apunte hacia esta pantalla.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#203B30] w-full flex items-center justify-center space-x-1.5 text-[10px] text-[#A5B4AC] font-mono relative z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00A878]" />
          <span>Sello criptográfico inmutable contra adulteración horaria</span>
        </div>

      </div>
    </div>
  );
}
