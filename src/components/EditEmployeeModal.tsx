'use client';

import React, { useState } from 'react';
import { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  X, 
  Upload, 
  Trash2, 
  Check, 
  AlertCircle, 
  Camera, 
  User, 
  CreditCard, 
  Briefcase, 
  Clock, 
  Phone 
} from 'lucide-react';
import CoopLogo from './CoopLogo';

interface Props {
  employee: Profile;
  onClose: () => void;
}

export default function EditEmployeeModal({ employee, onClose }: Props) {
  const { updateEmployee } = useAuth();

  const [fullName, setFullName] = useState(employee.full_name);
  const [documentId, setDocumentId] = useState(employee.document_id);
  const [position, setPosition] = useState(employee.position || 'Personal Operativo');
  const [department, setDepartment] = useState(employee.department || 'General');
  const [scheduleStart, setScheduleStart] = useState(employee.schedule_start?.substring(0, 5) || '08:00');
  const [scheduleEnd, setScheduleEnd] = useState(employee.schedule_end?.substring(0, 5) || '17:00');
  const [phone, setPhone] = useState(employee.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(employee.avatar_url);
  const [isActive, setIsActive] = useState<boolean>(employee.is_active ?? true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Procesar y comprimir la foto seleccionada a Base64 optimizado (300x380 px)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Seleccione un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 320;
        const maxH = 400;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await updateEmployee(employee.id, {
      full_name: fullName.trim(),
      document_id: documentId.trim(),
      position: position.trim(),
      department: department.trim(),
      schedule_start: `${scheduleStart}:00`,
      schedule_end: `${scheduleEnd}:00`,
      phone: phone.trim(),
      avatar_url: avatarUrl || undefined,
      is_active: isActive,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'No fue posible guardar los cambios.');
      setLoading(false);
      return;
    }

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#101E1A] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#203B30] text-[#F5F7F5]">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#071512] border-b border-[#203B30] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CoopLogo size={30} className="w-7 h-7" />
            <div>
              <h3 className="font-bold text-sm text-white">Editar Datos del Empleado</h3>
              <p className="text-[11px] text-[#A5B4AC]">Actualizar ficha laboral y foto del carnet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B4AC] hover:text-white p-1 rounded-xl hover:bg-[#162720] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido / Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-[#EF5350]/40 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF5350] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#063D32] border border-[#00A878] rounded-2xl text-xs text-[#00A878] font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Datos actualizados y sincronizados con éxito.</span>
            </div>
          )}

          {/* Sección de Fotografía para el Carnet */}
          <div className="p-4 bg-[#162720] rounded-2xl border border-[#203B30] flex items-center space-x-4">
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#071512] border-2 border-[#D6A72C]/60 shrink-0 shadow-md flex items-center justify-center relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto del empleado" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2 text-[#A5B4AC]">
                  <Camera className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[9px] font-mono leading-tight">Sin Foto</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <span className="text-xs font-bold text-white block">
                Fotografía Oficial del Carnet
              </span>
              <p className="text-[11px] text-[#A5B4AC] leading-tight">
                Suba una foto con encuadre de rostro nítido (fondo claro recomendado).
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="cursor-pointer px-3 py-1.5 bg-[#00A878] hover:bg-[#008F68] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1.5 bg-[#101E1A] hover:bg-rose-950 text-[#EF5350] text-xs font-semibold rounded-xl border border-[#203B30] transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Campos Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white focus:border-[#00A878] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Cédula de Identidad (CI) *
              </label>
              <input
                type="text"
                required
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:border-[#00A878] focus:outline-none"
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
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white focus:border-[#00A878] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Departamento o Área *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white focus:border-[#00A878] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Horario de Entrada
              </label>
              <input
                type="time"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:border-[#00A878] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Horario de Salida
              </label>
              <input
                type="time"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:border-[#00A878] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0981 123456"
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white font-mono focus:border-[#00A878] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5B4AC] mb-1">
                Estado del Colaborador
              </label>
              <select
                value={isActive ? 'activo' : 'inactivo'}
                onChange={(e) => setIsActive(e.target.value === 'activo')}
                className="w-full px-3 py-2 text-xs bg-[#162720] border border-[#203B30] rounded-xl text-white focus:border-[#00A878] focus:outline-none"
              >
                <option value="activo">● Activo en funciones</option>
                <option value="inactivo">○ Inactivo / Suspendido</option>
              </select>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-[#203B30] flex items-center justify-end space-x-2.5">
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
              className="px-5 py-2 bg-[#00A878] hover:bg-[#008F68] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
