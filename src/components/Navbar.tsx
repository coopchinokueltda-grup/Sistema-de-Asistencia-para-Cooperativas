'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, 
  LogOut, 
  Clock, 
  Smartphone,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, settings } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
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
        setCurrentTime(formatted);
      } catch {
        setCurrentTime(new Date().toLocaleTimeString());
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
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Entidad */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>{settings.company_name}</span>
              <span className="text-[10px] font-semibold bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              Control de asistencia
            </p>
          </div>
        </div>

        {/* Reloj oficial */}
        <div className="hidden md:flex items-center space-x-2.5 bg-stone-950/70 px-3 py-1 rounded-lg border border-stone-800">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <div className="font-mono text-xs font-semibold tracking-wider text-stone-200">
            {currentTime || '--:--:--'}
          </div>
          <span className="text-[10px] text-stone-500 font-mono">
            {settings.timezone.replace('_', ' ')}
          </span>
        </div>

        {/* Acciones y Perfil */}
        <div className="flex items-center space-x-2.5">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar app</span>
            </button>
          )}

          {user && (
            <div className="flex items-center space-x-2.5 bg-stone-950/60 pl-3 pr-1.5 py-1 rounded-xl border border-stone-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white truncate max-w-[140px]">
                  {user.full_name}
                </div>
                <div className="text-[10px] font-medium text-stone-400">
                  {user.role === 'admin' ? 'Administrador' : user.position}
                </div>
              </div>

              <div className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center font-bold text-xs border border-stone-700">
                {user.full_name.charAt(0)}
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors"
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
