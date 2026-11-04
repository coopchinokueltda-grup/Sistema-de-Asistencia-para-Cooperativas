'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoginScreen from '@/components/LoginScreen';
import AdminDashboard from '@/components/AdminDashboard';
import EmployeePortal from '@/components/EmployeePortal';
import { RefreshCw } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-stone-200">
        <RefreshCw className="w-8 h-8 text-stone-400 animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-400">
          Iniciando sistema...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeePortal />
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
