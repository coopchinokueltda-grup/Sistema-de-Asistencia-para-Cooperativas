'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SystemSettings } from '@/types';
import { 
  Building2, 
  X, 
  Clock, 
  Maximize2
} from 'lucide-react';

interface Props {
  settings: SystemSettings;
  onClose: () => void;
}

export default function KioskDisplayModal({ settings, onClose }: Props) {
  const [currentTime, setCurrentTime] = useState<string>('');
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

        setCurrentTime(timeStr);
        setCurrentDate(dateStr);
      } catch {
        setCurrentTime(now.toLocaleTimeString());
        setCurrentDate(now.toLocaleDateString());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-white flex flex-col items-center text-center">
        
        {/* Controles */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={toggleFullScreen}
            className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-stone-300">
            Kiosco de marcación
          </span>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Empresa */}
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-white tracking-tight">
              {settings.company_name}
            </h2>
            <p className="text-xs text-stone-400">
              Sede Central
            </p>
          </div>
        </div>

        {/* Reloj */}
        <div className="my-4 bg-stone-950 border border-stone-800 rounded-2xl px-6 py-4 w-full">
          <div className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-stone-100">
            {currentTime || '--:--:--'}
          </div>
          <p className="text-xs text-stone-400 capitalize mt-1">
            {currentDate}
          </p>
          <div className="text-[10px] text-stone-500 mt-1 font-mono">
            {settings.timezone}
          </div>
        </div>

        {/* QR */}
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-300 my-2">
          <QRCodeSVG
            value={settings.workplace_qr_secret}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Instrucciones */}
        <div className="mt-4 text-center">
          <p className="text-xs text-stone-300 leading-relaxed max-w-xs">
            Abra la aplicación en su teléfono móvil y seleccione <b>Marcar entrada</b> o <b>Marcar salida</b> para enfocar este código.
          </p>
        </div>

      </div>
    </div>
  );
}
