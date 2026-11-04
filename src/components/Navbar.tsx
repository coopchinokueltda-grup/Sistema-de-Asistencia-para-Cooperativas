'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LogOut, 
  Clock, 
  Smartphone,
  ShieldCheck,
  Radio
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
    <header className="bg-[#071512] text-[#F5F7F5] border-b border-[#203B30] sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
        
        {/* Entidad e Insignia */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group cursor-pointer shrink-0">
            <CoopLogo size={42} className="w-11 h-11" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase drop-shadow-sm leading-tight">
                {settings.company_name}
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-black tracking-widest uppercase bg-[#063D32] text-[#00A878] px-2 py-0.5 rounded-full border border-[#00A878]/30">
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-[#A5B4AC] font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-pulse"></span>
              Sistema de Control de Asistencia y Personal
            </p>
          </div>
        </div>

        {/* Reloj y Telemetría del Servidor */}
        <div className="hidden lg:flex items-center space-x-3 bg-[#101E1A] px-4 py-2 rounded-2xl border border-[#203B30] shadow-inner">
          <div className="text-right">
            <div className="text-[10px] font-bold text-[#A5B4AC] uppercase tracking-wider flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3 text-[#00A878]" />
              <span>Hora Legal Paraguay</span>
            </div>
            <div className="font-mono text-base font-black tracking-tight text-white flex items-baseline justify-end gap-0.5">
              <span>{currentTime}</span>
              <span className="text-xs text-[#00A878] font-bold animate-pulse">:{currentSeconds}</span>
            </div>
          </div>
          <div className="h-6 w-px bg-[#203B30]"></div>
          <div className="text-[10px] text-[#A5B4AC] font-mono leading-tight">
            <span className="text-white font-semibold block">{settings.timezone}</span>
            <span className="text-[#00A878]">Sello UTC Activo</span>
          </div>
        </div>

        {/* Acciones y Perfil */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          
          {/* Botón PWA si está disponible */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00A878] hover:bg-[#008F68] active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#00A878]/25 transition-all"
              title="Instalar aplicación en dispositivo"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* Ficha de Usuario Activo */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3 bg-[#101E1A] border border-[#203B30] pl-2 sm:pl-3 pr-1.5 py-1.5 rounded-2xl">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-[#00A878] font-medium leading-tight">
                  {user.role === 'admin' ? 'Administrador' : user.position}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A878] to-[#063D32] border border-[#00A878]/40 flex items-center justify-center text-white font-black text-xs shrink-0 shadow">
                {user.full_name?.charAt(0) || 'U'}
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-[#A5B4AC] hover:text-[#EF5350] hover:bg-[#162720] rounded-xl transition-colors"
                title="Cerrar sesión segura"
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
