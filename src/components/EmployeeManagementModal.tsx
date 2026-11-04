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
  Phone
} from 'lucide-react';
import { downloadEmployeeTemplate, parseEmployeesFromExcel } from '@/lib/excel';
import EmployeeBadgeCard from './EmployeeBadgeCard';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full overflow-hidden border border-stone-200">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">Registro de personal</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6">
          <button
            onClick={() => setActiveTab('individual')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'individual'
                ? 'border-emerald-700 text-stone-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Registro individual</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'border-emerald-700 text-stone-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Importación desde Excel</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Credenciales recién creadas */}
          {createdCredentials && (
            <div className="mb-5 p-4 bg-stone-50 border border-stone-300 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-stone-900 text-xs">
                  Credenciales de acceso creadas
                </h4>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="text-[11px] text-stone-400 hover:text-stone-600"
                >
                  Cerrar
                </button>
              </div>

              <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs space-y-1.5 mb-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Empleado:</span>
                  <span className="font-semibold text-stone-800">{createdCredentials.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Usuario:</span>
                  <span className="text-stone-800">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Contraseña:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Credenciales copiadas' : 'Copiar credenciales'}</span>
                </button>

                <button
                  onClick={() => {
                    const emp = employees.find(e => e.document_id === createdCredentials.document_id);
                    if (emp) setBadgeEmployee(emp);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-500" />
                  <span>Ver carnet QR</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'individual' ? (
            <form onSubmit={handleSubmitIndividual} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre y apellido"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cédula de identidad (CI)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Número de cédula"
                    value={formData.document_id || ''}
                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cargo o puesto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cajero, Oficial de Crédito"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Departamento o sucursal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Atención al Socio"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="Opcional (se genera automáticamente si se omite)"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="Número de contacto"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Horario de entrada
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_start?.substring(0, 5) || '08:00'}
                    onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value + ':00' })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Horario de salida
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_end?.substring(0, 5) || '17:00'}
                    onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value + ':00' })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Registrar empleado'}
                </button>
              </div>
            </form>
          ) : (
            /* Importación Excel */
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-stone-900 mb-0.5">
                    Plantilla modelo
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Formato de columnas para la carga de personal.
                  </p>
                </div>
                <button
                  onClick={downloadEmployeeTemplate}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Descargar plantilla</span>
                </button>
              </div>

              <div className="p-5 border-2 border-dashed border-stone-300 rounded-2xl text-center">
                <FileSpreadsheet className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <h4 className="font-semibold text-xs text-stone-800 mb-1">
                  Seleccionar archivo Excel o CSV
                </h4>
                <p className="text-[11px] text-stone-400 mb-3">
                  Se generarán los accesos y códigos de marcación para cada trabajador de la lista.
                </p>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 file:cursor-pointer"
                />

                {excelFile && (
                  <div className="mt-3">
                    <button
                      onClick={handleProcessExcel}
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Procesando lista...' : `Importar ${excelFile.name}`}
                    </button>
                  </div>
                )}
              </div>

              {importResults && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                  <div className="text-xs font-semibold text-stone-900 mb-2">
                    Se registraron {importResults.count} empleados correctamente
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px] bg-white p-2 rounded-lg border border-stone-200">
                    {importResults.credentials.map((c, i) => (
                      <div key={i} className="flex justify-between py-0.5 border-b border-stone-100 last:border-none">
                        <span className="text-stone-700">{c.full_name}</span>
                        <span className="text-stone-500">{c.email} &bull; Clave: <b>{c.password}</b></span>
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
