'use client';

import React, { useState } from 'react';
import { Profile, EmployeeCredentials } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  UserPlus, 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Printer,
  User,
  CreditCard,
  Briefcase,
  Mail,
  Phone,
  Sparkles,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { downloadEmployeeTemplate, parseEmployeesFromExcel } from '@/lib/excel';
import EmployeeBadgeCard from './EmployeeBadgeCard';
import CoopLogo from './CoopLogo';

interface Props {
  onClose: () => void;
}

export default function EmployeeManagementModal({ onClose }: Props) {
  const { registerEmployee, importEmployeesBatch, settings, employees } = useAuth();
  const [activeTab, setActiveTab] = useState<'individual' | 'excel'>('individual');
  
  const [formData, setFormData] = useState<Partial<Profile>>({
    full_name: '',
    document_id: '',
    email: '',
    phone: '',
    position: 'Personal Operativo',
    department: 'Atención al Socio',
    schedule_start: '08:00:00',
    schedule_end: '17:00:00',
    role: 'employee',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createdCredentials, setCreatedCredentials] = useState<EmployeeCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [badgeEmployee, setBadgeEmployee] = useState<Profile | null>(null);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{ count: number; credentials: EmployeeCredentials[] } | null>(null);

  const handleSubmitIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await registerEmployee(formData);
      if (!res.success || !res.credentials) {
        throw new Error(res.error || 'No fue posible registrar al empleado.');
      }

      setCreatedCredentials(res.credentials);
      setFormData({
        full_name: '',
        document_id: '',
        email: '',
        phone: '',
        position: 'Personal Operativo',
        department: 'Atención al Socio',
        schedule_start: '08:00:00',
        schedule_end: '17:00:00',
        role: 'employee',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Credenciales de acceso - ${settings.company_name}\n` +
      `Empleado: ${createdCredentials.full_name}\n` +
      `Cédula: ${createdCredentials.document_id}\n` +
      `Usuario: ${createdCredentials.email}\n` +
      `Contraseña: ${createdCredentials.password}\n` +
      `Enlace: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setExcelFile(file);
  };

  const handleProcessExcel = async () => {
    if (!excelFile) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const parsedEmployees = await parseEmployeesFromExcel(excelFile);
      if (parsedEmployees.length === 0) {
        throw new Error('El archivo no contiene filas válidas con Nombre y Cédula.');
      }

      const res = await importEmployeesBatch(parsedEmployees);
      setImportResults(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#101E1A] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#203B30] text-[#F5F7F5]">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#071512] border-b border-[#203B30] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CoopLogo size={32} className="w-8 h-8" />
            <div>
              <h3 className="font-bold text-sm text-white">Registro de Personal</h3>
              <p className="text-[11px] text-[#A5B4AC]">Creación de usuarios y carnets QR oficiales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B4AC] hover:text-white p-1 rounded-xl hover:bg-[#162720] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-[#203B30] bg-[#071512] px-6 gap-2">
          <button
            onClick={() => setActiveTab('individual')}
            className={`py-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'individual'
                ? 'border-[#00A878] text-[#00A878] bg-[#101E1A]'
                : 'border-transparent text-[#A5B4AC] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Registro individual</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`py-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'border-[#00A878] text-[#00A878] bg-[#101E1A]'
                : 'border-transparent text-[#A5B4AC] hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A878]" />
            <span>Importación desde Excel</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-[#EF5350]/60 rounded-xl text-rose-200 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Credenciales Creadas */}
          {createdCredentials && (
            <div className="mb-5 p-4 bg-[#063D32] border border-[#00A878]/50 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-white font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#F5B942]" />
                  <span>Credenciales de acceso generadas automáticamente</span>
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="text-[11px] text-[#A5B4AC] hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="bg-[#071512] rounded-xl p-3 border border-[#203B30] text-xs space-y-1.5 mb-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#A5B4AC]">Trabajador:</span>
                  <span className="font-semibold text-white">{createdCredentials.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A5B4AC]">Usuario / Correo:</span>
                  <span className="text-[#F5B942]">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A5B4AC]">Contraseña inicial:</span>
                  <span className="font-bold text-[#00A878] bg-[#101E1A] px-2 py-0.5 rounded border border-[#00A878]/30">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#162720] hover:bg-[#203B30] active:scale-95 text-white text-xs font-bold rounded-xl border border-[#203B30] transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00A878]" /> : <Copy className="w-3.5 h-3.5 text-stone-300" />}
                  <span>{copied ? 'Credenciales copiadas' : 'Copiar credenciales'}</span>
                </button>

                <button
                  onClick={() => {
                    const emp = employees.find(e => e.document_id === createdCredentials.document_id);
                    if (emp) setBadgeEmployee(emp);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#008F68] hover:bg-[#00A878] text-white text-xs font-bold rounded-xl border border-[#00A878]/40 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver Carnet QR</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'individual' ? (
            <form onSubmit={handleSubmitIndividual} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white placeholder-stone-500 focus:border-[#00A878] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                    Cédula de Identidad (CI) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 4567890"
                    value={formData.document_id || ''}
                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono placeholder-stone-500 focus:border-[#00A878] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                    Cargo o Puesto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cajero / Operativo"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white placeholder-stone-500 focus:border-[#00A878] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                    Departamento o Área
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Administración / Créditos"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white placeholder-stone-500 focus:border-[#00A878] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_start?.substring(0, 5) || '08:00'}
                    onChange={(e) => setFormData({ ...formData, schedule_start: `${e.target.value}:00` })}
                    className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:border-[#00A878] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                    Hora Salida
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_end?.substring(0, 5) || '17:00'}
                    onChange={(e) => setFormData({ ...formData, schedule_end: `${e.target.value}:00` })}
                    className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:border-[#00A878] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#162720] hover:bg-[#203B30] text-[#A5B4AC] hover:text-white text-xs font-bold rounded-xl border border-[#203B30] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#00A878] hover:bg-[#008F68] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{loading ? 'Registrando...' : 'Registrar y Generar QR'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#162720] rounded-2xl border border-[#203B30] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Plantilla oficial para importación masiva</span>
                  <button
                    onClick={downloadEmployeeTemplate}
                    className="px-3 py-1.5 bg-[#008F68] hover:bg-[#00A878] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Plantilla Excel</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#A5B4AC]">
                  Descargue el archivo de ejemplo, complete los datos de su nómina de colaboradores y súbalo a continuación.
                </p>
              </div>

              <div className="border-2 border-dashed border-[#203B30] hover:border-[#00A878] rounded-2xl p-6 text-center transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-upload"
                />
                <label htmlFor="excel-file-upload" className="cursor-pointer block">
                  <FileSpreadsheet className="w-8 h-8 text-[#00A878] mx-auto mb-2" />
                  <span className="text-xs font-bold text-white block">
                    {excelFile ? excelFile.name : 'Haga clic para seleccionar archivo Excel (.xlsx)'}
                  </span>
                  <span className="text-[10px] text-[#A5B4AC] mt-1 block">
                    Formato compatible con Microsoft Excel y Google Sheets
                  </span>
                </label>
              </div>

              {excelFile && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleProcessExcel}
                    disabled={loading}
                    className="px-5 py-2 bg-[#00A878] hover:bg-[#008F68] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{loading ? 'Procesando nómina...' : 'Importar Empleados'}</span>
                  </button>
                </div>
              )}

              {importResults && (
                <div className="p-4 bg-[#063D32] border border-[#00A878] rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-white">
                    ¡Se importaron con éxito {importResults.count} empleados!
                  </div>
                  <p className="text-[#A5B4AC] text-[11px]">
                    Las contraseñas y carnets QR oficiales fueron generados automáticamente para cada uno.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Carnet Modal si se requiere imprimir de inmediato */}
      {badgeEmployee && (
        <EmployeeBadgeCard
          employee={badgeEmployee}
          settings={settings}
          onClose={() => setBadgeEmployee(null)}
        />
      )}

    </div>
  );
}
