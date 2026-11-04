'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Smartphone
} from 'lucide-react';

export default function LoginScreen() {
  const { login, createInitialAdmin, settings } = useAuth();
  
  // Por defecto, mostrar siempre el formulario de inicio de sesión
  const [mode, setMode] = useState<'login' | 'initial_admin'>('login');
  
  // Campos de inicio de sesión
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
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
        // Solo si el servidor confirma explícitamente que no hay ningún admin, sugerir la pantalla de creación
        if (data && data.hasAdmin === false) {
          setMode('initial_admin');
        } else {
          setMode('login');
        }
      } catch {
        // En caso de duda, dejar siempre en modo inicio de sesión
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
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-600 selection:text-white">
      
      <div className="w-full max-w-md">
        
        {/* Cabecera institucional */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-700/50 text-emerald-400 mb-3 shadow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {settings.company_name}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Registro y control de asistencia laboral
          </p>
        </div>

        {/* Tarjeta de Acceso */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* Formulario Principal de Inicio de Sesión */
            <div>
              <div className="mb-5 pb-3 border-b border-stone-800">
                <h2 className="text-sm font-bold text-white">
                  Iniciar sesión
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Ingrese con su correo electrónico institucional o número de cédula.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Correo electrónico o Cédula (CI)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="ej: coopchinokueltda@gmail.com o 5203568"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Verificando...' : 'Iniciar sesión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Enlace para ir a configuración inicial si correspondiera */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setMode('initial_admin'); }}
                  className="text-[11px] text-stone-500 hover:text-stone-300 transition-colors"
                >
                  ¿Primer uso del sistema? Configurar administrador
                </button>
              </div>
            </div>
          ) : (
            /* Pantalla de Creación de Administrador Inicial */
            <div>
              <div className="mb-5 pb-3 border-b border-stone-800">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/40 text-amber-300 text-[10px] font-semibold mb-2">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Configuración inicial</span>
                </div>
                <h2 className="text-sm font-bold text-white">
                  Registrar administrador principal
                </h2>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Ingrese los datos de la persona a cargo de la administración de personal.
                </p>
              </div>

              <form onSubmit={handleInitialAdminSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pedro Martínez"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Cédula de identidad (CI)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 5203568"
                    value={adminDoc}
                    onChange={(e) => setAdminDoc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Correo institucional
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@cooperativa.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Creando cuenta...' : 'Crear cuenta de administrador'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Botón para volver a iniciar sesión si la cuenta ya existe */}
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(null); setMode('login'); }}
                    className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded-xl border border-stone-700 transition-colors"
                  >
                    Ya tengo una cuenta / Iniciar sesión
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pie informativo */}
          <div className="mt-6 pt-4 border-t border-stone-800 text-center">
            <span className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-stone-400" />
              <span>Aplicación instalable en teléfonos móviles y computadoras</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
