'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import CoopLogo from './CoopLogo';

export default function LoginScreen() {
  const { login, createInitialAdmin, settings } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'initial_admin'>('login');
  
  // Campos de inicio de sesión
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Campos de configuración inicial
  const [adminName, setAdminName] = useState('');
  const [adminDoc, setAdminDoc] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consultar al servidor si existe al menos un administrador registrado
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/system-status');
        const data = await res.json();
        if (data && data.hasAdmin === false) {
          setMode('initial_admin');
        } else {
          setMode('login');
        }
      } catch {
        setMode('login');
      }
    }
    checkStatus();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await login(identifier, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Credenciales no reconocidas. Verifique sus datos.');
    }
    setLoading(false);
  };

  const handleInitialAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !adminDoc || !adminEmail || !adminPassword) {
      setErrorMsg('Complete todos los campos para registrar el administrador.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const res = await createInitialAdmin({
      full_name: adminName,
      document_id: adminDoc,
      email: adminEmail,
      password: adminPassword,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'No fue posible registrar al administrador.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#071512] text-[#F5F7F5] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#00A878] selection:text-white">
      
      <div className="w-full max-w-md">
        
        {/* Cabecera institucional con Logo Oficial */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-[#101E1A] border border-[#203B30] mb-3 shadow-xl">
            <CoopLogo size={52} className="w-14 h-14" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            {settings.company_name}
          </h1>
          <p className="text-xs text-[#00A878] font-medium tracking-wide mt-1">
            Sistema de Control de Asistencia y Personal
          </p>
        </div>

        {/* Tarjeta de Formulario Principal */}
        <div className="bg-[#101E1A] border border-[#203B30] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Alerta de Error */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/40 border border-[#EF5350]/40 rounded-2xl text-xs text-rose-200 flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-[#EF5350] shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* MODO 1: INICIO DE SESIÓN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-[#A5B4AC] mb-1.5">
                  Cédula de Identidad o Correo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A5B4AC] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ej: 5203568 o usuario@gmail.com"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#162720] border border-[#203B30] rounded-2xl text-white placeholder-stone-500 focus:outline-none focus:border-[#00A878] font-medium transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A5B4AC] mb-1.5">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A5B4AC] absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#162720] border border-[#203B30] rounded-2xl text-white placeholder-stone-500 focus:outline-none focus:border-[#00A878] font-medium transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#A5B4AC] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#00A878] hover:bg-[#008F68] active:scale-[0.99] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00A878]/30 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Verificando credenciales...</span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#A5B4AC]">
                  Personal operativo y administrativo autorizado
                </span>
              </div>

            </form>
          )}

          {/* MODO 2: CONFIGURACIÓN INICIAL DEL ADMINISTRADOR */}
          {mode === 'initial_admin' && (
            <form onSubmit={handleInitialAdminSubmit} className="space-y-4">
              
              <div className="p-3 bg-[#063D32] border border-[#00A878]/40 rounded-2xl text-xs text-[#00A878] font-bold flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Configuración de Administrador Principal</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A5B4AC] mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Ej: Pedro Martínez"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A5B4AC] mb-1">
                  Cédula de Identidad (CI)
                </label>
                <input
                  type="text"
                  value={adminDoc}
                  onChange={(e) => setAdminDoc(e.target.value)}
                  placeholder="Ej: 5203568"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A5B4AC] mb-1">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="coopchinokueltda@gmail.com"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A5B4AC] mb-1">
                  Contraseña Segura
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00A878] hover:bg-[#008F68] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all"
              >
                {loading ? 'Creando cuenta...' : 'Crear Administrador Principal'}
              </button>

            </form>
          )}

        </div>

        {/* Pie de página con indicador PWA */}
        <div className="mt-6 text-center text-xs text-[#A5B4AC] flex items-center justify-center space-x-2 font-mono">
          <Smartphone className="w-3.5 h-3.5 text-[#00A878]" />
          <span>Aplicación instalable PWA (móviles y escritorio)</span>
        </div>

      </div>

    </div>
  );
}
