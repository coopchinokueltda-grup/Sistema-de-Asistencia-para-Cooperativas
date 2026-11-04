'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoginScreen from '@/components/LoginScreen';
import AdminDashboard from '@/components/AdminDashboard';
import EmployeePortal from '@/components/EmployeePortal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RefreshCw } from 'lucide-react';
import CoopLogo from '@/components/CoopLogo';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#071512] text-[#F5F7F5]">
        <div className="relative mb-4">
          <CoopLogo size={56} className="w-14 h-14" />
          <div className="absolute -inset-1 rounded-full border-2 border-[#00A878] border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold tracking-widest text-[#00A878] uppercase font-mono">
          Iniciando sistema...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary fallbackTitle="Inicio de sesión">
        <LoginScreen />
      </ErrorBoundary>
    );
  }

  // Si es Administrador: Dashboard SaaS completo con barra lateral institucional
  if (user.role === 'admin') {
    return (
      <ErrorBoundary fallbackTitle="Panel de control">
        <AdminDashboard />
      </ErrorBoundary>
    );
  }

  // Si es Empleado: Portal táctil móvil y de escritorio con cabecera superior
  return (
    <div className="min-h-screen bg-[#071512] text-[#F5F7F5] flex flex-col selection:bg-[#00A878] selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-6">
        <ErrorBoundary fallbackTitle="Portal del empleado">
          <EmployeePortal />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Sistema de Asistencia">
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
