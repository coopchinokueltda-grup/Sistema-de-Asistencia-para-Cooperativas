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
  KeyRound
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
      <div className="bg-[#121815] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-800/40 text-stone-100">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#0a120e] border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CoopLogo size={28} className="w-7 h-7" />
            <div>
              <h3 className="font-bold text-sm text-white">Registro de Personal</h3>
              <p className="text-[11px] text-stone-400">Creación de usuarios y carnets QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-stone-800 bg-[#0d1511] px-6 gap-2">
          <button
            onClick={() => setActiveTab('individual')}
            className={`py-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'individual'
                ? 'border-emerald-500 text-white bg-[#121815]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Registro individual</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`py-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'border-emerald-500 text-white bg-[#121815]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importación desde Excel</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-200 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Credenciales Creadas */}
          {createdCredentials && (
            <div className="mb-5 p-4 bg-[#0a1b14] border border-emerald-600/50 rounded-2xl shadow-lg animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Credenciales de acceso creadas automáticamente</span>
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="text-[11px] text-stone-400 hover:text-stone-200"
                >
                  Cerrar
                </button>
              </div>

              <div className="bg-stone-950 rounded-xl p-3 border border-stone-800 text-xs space-y-1.5 mb-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Trabajador:</span>
                  <span className="font-semibold text-white">{createdCredentials.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Usuario / Correo:</span>
                  <span className="text-amber-300">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Contraseña:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold rounded-xl border border-stone-700 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-300" />}
                  <span>{copied ? 'Credenciales copiadas' : 'Copiar credenciales'}</span>
                </button>

                <button
                  onClick={() => {
                    const emp = employees.find(e => e.document_id === createdCredentials.document_id);
                    if (emp) setBadgeEmployee(emp);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl border border-emerald-600/50 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Ver Carnet QR</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'individual' ? (
            <form onSubmit={handleSubmitIndividual} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre y apellido"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Cédula de identidad (CI) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Número de cédula"
                    value={formData.document_id || ''}
                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Cargo o puesto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cajero, Operador de Silo"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Departamento o área
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Atención al Socio, Campo"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="Opcional (se genera automáticamente)"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="Número de contacto"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Horario de entrada
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_start?.substring(0, 5) || '08:00'}
                    onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value + ':00' })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Horario de salida
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_end?.substring(0, 5) || '17:00'}
                    onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value + ':00' })}
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Creando cuenta...' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          ) : (
            /* Importación Masiva Excel */
            <div className="space-y-4">
              <div className="p-4 bg-[#0a120e] border border-stone-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">
                    Plantilla oficial en Excel
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Formato predeterminado para cargar la nómina de trabajadores.
                  </p>
                </div>
                <button
                  onClick={downloadEmployeeTemplate}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl text-xs font-bold text-stone-200 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Descargar plantilla</span>
                </button>
              </div>

              <div className="p-6 border-2 border-dashed border-emerald-900/60 hover:border-emerald-500/60 rounded-3xl text-center bg-[#07130e]/40 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-xs text-white mb-1">
                  Subir archivo Excel (.xlsx / .csv)
                </h4>
                <p className="text-[11px] text-stone-400 mb-4 max-w-sm mx-auto">
                  El sistema generará los usuarios, contraseñas seguras y códigos QR para cada fila del archivo.
                </p>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
                />

                {excelFile && (
                  <div className="mt-4">
                    <button
                      onClick={handleProcessExcel}
                      disabled={loading}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Procesando archivo...' : `Importar: ${excelFile.name}`}
                    </button>
                  </div>
                )}
              </div>

              {importResults && (
                <div className="p-4 bg-[#0a1b14] border border-emerald-600/50 rounded-2xl">
                  <div className="text-xs font-bold text-emerald-300 mb-2">
                    Se registraron {importResults.count} empleados correctamente
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px] bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                    {importResults.credentials.map((c, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-stone-800/80 last:border-none">
                        <span className="text-white font-semibold">{c.full_name}</span>
                        <span className="text-amber-300">{c.email} &bull; Clave: <b className="text-emerald-400">{c.password}</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

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
