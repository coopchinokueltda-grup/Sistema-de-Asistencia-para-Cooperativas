'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SystemSettings } from '@/types';
import { 
  Building2, 
  X, 
  Clock, 
  Maximize2,
  Radio,
  ShieldCheck,
  Sparkles
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-gradient-to-b from-[#06140e] via-[#091f16] to-[#040e09] border-2 border-amber-600/40 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-white flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Luces de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Controles de cabecera */}
        <div className="w-full flex items-center justify-between mb-4 relative z-10">
          <button
            onClick={toggleFullScreen}
            className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-900/80 border border-stone-800 transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-[10px] text-emerald-300 font-mono font-bold tracking-widest uppercase">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Kiosco Central Oficial</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-900/80 border border-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Identidad de la Entidad */}
        <div className="flex items-center space-x-3 mb-2 relative z-10">
          <CoopLogo size={48} className="w-12 h-12 drop-shadow-md" />
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase leading-tight">
              {settings.company_name}
            </h2>
            <p className="text-xs text-amber-300 font-medium">
              Sede Central &bull; Punto de Marcación
            </p>
          </div>
        </div>

        {/* Reloj Digital de Alta Precisión */}
        <div className="my-4 bg-[#05110a]/90 border border-emerald-900/60 rounded-3xl px-6 py-4 w-full relative z-10 shadow-inner">
          <div className="flex items-baseline justify-center font-mono">
            <span className="text-5xl sm:text-6xl font-black tracking-wider text-white drop-shadow">
              {currentTime || '--:--'}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 ml-1">
              :{currentSeconds || '00'}
            </span>
          </div>
          <p className="text-xs text-stone-300 capitalize mt-1.5 font-medium">
            {currentDate}
          </p>
          <div className="text-[10px] text-stone-400 mt-1 font-mono">
            Sello horario: {settings.timezone.replace('_', ' ')}
          </div>
        </div>

        {/* Código QR Central con Marco Dorado */}
        <div className="p-5 bg-white rounded-3xl shadow-2xl border-4 border-amber-500/50 my-2 relative group z-10">
          <QRCodeSVG
            value={settings.workplace_qr_secret}
            size={230}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Instrucciones */}
        <div className="mt-4 text-center relative z-10">
          <p className="text-xs text-stone-300 leading-relaxed max-w-xs font-medium">
            Abra la aplicación en su teléfono móvil y seleccione <b>Marcar entrada</b> o <b>Marcar salida</b> para enfocar este código.
          </p>
        </div>

      </div>
    </div>
  );
}
