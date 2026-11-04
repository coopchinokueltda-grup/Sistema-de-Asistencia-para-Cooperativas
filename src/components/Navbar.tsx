'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LogOut, 
  Clock, 
  Smartphone,
  ShieldCheck,
  Radio,
  Wifi
} from 'lucide-react';
import CoopLogo from './CoopLogo';

export default function Navbar() {
  const { user, logout, settings } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentSeconds, setCurrentSeconds] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('es-PY', {
          timeZone: settings.timezone || 'America/Asuncion',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);
        
        const [h, m, s] = formatted.split(':');
        setCurrentTime(`${h}:${m}`);
        setCurrentSeconds(s);
      } catch {
        const d = new Date();
        setCurrentTime(d.toLocaleTimeString().substring(0, 5));
        setCurrentSeconds(String(d.getSeconds()).padStart(2, '0'));
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [settings.timezone]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="bg-[#07130e] text-stone-100 border-b border-emerald-900/40 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Entidad e Insignia */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-amber-600 rounded-2xl blur-sm opacity-40 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative rounded-xl overflow-hidden shadow-lg shadow-black/60 bg-[#06140e] p-0.5 border border-amber-600/30">
              <CoopLogo size={40} className="w-10 h-10" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase drop-shadow-sm">
                {settings.company_name}
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/80 font-medium tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistema de Control de Asistencia y Personal
            </p>
          </div>
        </div>

        {/* Reloj y Telemetría del Servidor */}
        <div className="hidden lg:flex items-center space-x-3 bg-[#0a1b14]/80 px-4 py-2 rounded-2xl border border-emerald-800/30 shadow-inner">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
              Hora legal
            </span>
          </div>

          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-base font-bold text-stone-100 tracking-wider">
              {currentTime || '--:--'}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              :{currentSeconds || '00'}
            </span>
          </div>

          <div className="pl-2 border-l border-emerald-900/60 text-[10px] font-mono text-stone-400">
            {settings.timezone.replace('_', ' ')}
          </div>
        </div>

        {/* Acciones y Sesión */}
        <div className="flex items-center space-x-2.5">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition-all border border-emerald-400/30"
              title="Instalar en pantalla de inicio"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar app</span>
            </button>
          )}

          {user && (
            <div className="flex items-center space-x-2.5 bg-[#0b1d16]/90 pl-3 pr-1.5 py-1.5 rounded-2xl border border-emerald-800/40 shadow-sm">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white truncate max-w-[150px]">
                  {user.full_name}
                </div>
                <div className="text-[10px] font-medium flex items-center justify-end gap-1">
                  {user.role === 'admin' ? (
                    <span className="text-amber-400 font-semibold tracking-wide">Administración</span>
                  ) : (
                    <span className="text-emerald-300">{user.position}</span>
                  )}
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-stone-100 flex items-center justify-center font-black text-xs border border-emerald-500/40 shadow-inner">
                {user.full_name.charAt(0)}
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-900/60 rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
