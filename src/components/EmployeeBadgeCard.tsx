'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Profile, SystemSettings } from '@/types';
import { 
  Building2, 
  Printer, 
  X, 
  User,
  Hash
} from 'lucide-react';

interface Props {
  employee: Profile;
  settings: SystemSettings;
  onClose: () => void;
}

export default function EmployeeBadgeCard({ employee, settings, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-300 print:shadow-none print:border-none print:max-w-none">
        
        {/* Cabecera modal (oculta al imprimir) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-900 text-stone-100 print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs tracking-tight">Carnet de identificación</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta Imprimible */}
        <div className="p-6 flex flex-col items-center bg-stone-100 print:bg-white print:p-0" ref={cardRef}>
          <div className="w-[300px] rounded-2xl overflow-hidden shadow-sm border border-stone-300 bg-white flex flex-col print:border print:border-stone-800">
            
            {/* Encabezado */}
            <div className="bg-emerald-900 p-3.5 text-white text-center">
              <div className="flex items-center justify-center space-x-1.5 mb-0.5">
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  {settings.company_name}
                </span>
              </div>
              <p className="text-[10px] text-emerald-200 font-medium">
                Identificación de personal
              </p>
            </div>

            {/* Datos */}
            <div className="p-4 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-stone-100 border-2 border-stone-300 flex items-center justify-center text-stone-700 text-2xl font-bold mb-2">
                {employee.full_name.charAt(0)}
              </div>

              <h2 className="font-bold text-stone-900 text-base leading-tight mb-0.5">
                {employee.full_name}
              </h2>
              <span className="text-xs text-stone-600 font-medium mb-3">
                {employee.position}
              </span>

              <div className="w-full bg-stone-50 rounded-xl p-2.5 text-xs text-stone-600 space-y-1 mb-3 border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-400">Cédula CI:</span>
                  <span className="font-mono font-bold text-stone-800">{employee.document_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Departamento:</span>
                  <span className="text-stone-700">{employee.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Horario:</span>
                  <span className="font-mono text-stone-700">
                    {employee.schedule_start?.substring(0, 5)} - {employee.schedule_end?.substring(0, 5)}
                  </span>
                </div>
              </div>

              {/* QR */}
              <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center">
                <QRCodeSVG
                  value={employee.qr_token || `CHINOKUE-EMP-${employee.document_id}`}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
                <span className="text-[10px] font-mono text-stone-400 mt-1">
                  {employee.document_id}
                </span>
              </div>
            </div>

            {/* Pie */}
            <div className="bg-stone-50 px-3 py-1.5 text-center border-t border-stone-200">
              <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                Documento de uso interno
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-end space-x-2.5 print:hidden">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
}
