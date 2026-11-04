'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoginScreen from '@/components/LoginScreen';
import AdminDashboard from '@/components/AdminDashboard';
import EmployeePortal from '@/components/EmployeePortal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RefreshCw } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06120d] text-stone-200">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wider text-emerald-300 font-mono">
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

  return (
    <div className="min-h-screen bg-[#08140f] text-stone-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        <ErrorBoundary fallbackTitle="Panel de control">
          {user.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <EmployeePortal />
          )}
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
