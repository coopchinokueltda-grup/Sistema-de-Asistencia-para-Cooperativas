'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Profile, SystemSettings } from '@/types';
import { 
  Building2, 
  Printer, 
  X, 
  ShieldCheck,
  CheckCircle,
  Hash,
  Download,
  Calendar,
  Clock
} from 'lucide-react';
import CoopLogo from './CoopLogo';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-[#121815] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-emerald-800/40 text-stone-100 print:shadow-none print:border-none print:max-w-none">
        
        {/* Cabecera modal (oculta al imprimir) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0a120e] border-b border-stone-800 print:hidden">
          <div className="flex items-center space-x-2">
            <CoopLogo size={24} className="w-6 h-6" />
            <h3 className="font-bold text-xs tracking-tight text-white uppercase">
              Credencial Oficial de Personal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Carnet Imprimible */}
        <div className="p-6 flex flex-col items-center bg-[#0d1410] print:bg-white print:p-0" ref={cardRef}>
          
          {/* Tarjeta Proporción Oficial CR80 (PVC) */}
          <div className="w-[320px] rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-600/40 bg-gradient-to-b from-[#06170f] via-[#092217] to-[#040e09] flex flex-col relative text-white print:border-2 print:border-stone-900 print:text-black print:bg-white">
            
            {/* Holograma y Marca de Agua de Fondo */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Cabecera del Carnet */}
            <div className="p-4 pb-3 border-b border-amber-500/20 text-center relative">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <CoopLogo size={36} className="w-9 h-9 drop-shadow" />
                <div className="text-left">
                  <h1 className="font-black text-xs tracking-tight uppercase text-white leading-tight">
                    {settings.company_name}
                  </h1>
                  <span className="text-[9px] font-bold text-amber-300 tracking-wider uppercase block">
                    Carnet de Identificación Laboral
                  </span>
                </div>
              </div>
            </div>

            {/* Cuerpo del Carnet */}
            <div className="p-5 flex flex-col items-center text-center relative z-10">
              
              {/* Foto / Avatar con Sello Dorado */}
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-amber-400/60 p-1 shadow-xl flex items-center justify-center text-emerald-300 text-3xl font-black">
                  {employee.full_name.charAt(0)}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 p-1 rounded-full shadow-lg border-2 border-stone-950" title="Verificado">
                  <CheckCircle className="w-4 h-4 fill-amber-300 text-stone-950" />
                </div>
              </div>

              {/* Nombre y Cargo */}
              <h2 className="font-black text-white text-base leading-tight tracking-tight mb-1">
                {employee.full_name}
              </h2>
              <div className="inline-block bg-emerald-950/90 text-emerald-300 border border-emerald-600/40 text-[11px] font-bold px-3 py-0.5 rounded-full mb-3">
                {employee.position}
              </div>

              {/* Ficha Técnica */}
              <div className="w-full bg-[#05110b]/90 border border-emerald-900/60 rounded-2xl p-3 text-left font-mono text-[11px] space-y-1.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Cédula CI:</span>
                  <span className="font-bold text-amber-300 text-xs">{employee.document_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Área:</span>
                  <span className="text-stone-200">{employee.department}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Horario:</span>
                  <span className="text-emerald-300 font-semibold">
                    {employee.schedule_start?.substring(0, 5)} - {employee.schedule_end?.substring(0, 5)}
                  </span>
                </div>
              </div>

              {/* Código QR Oficial de Lectura */}
              <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-amber-500/40 flex flex-col items-center">
                <QRCodeSVG
                  value={employee.qr_token || `CHINOKUE-EMP-${employee.document_id}`}
                  size={135}
                  level="H"
                  includeMargin={true}
                />
                <span className="text-[10px] font-mono font-bold text-stone-900 mt-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-800" />
                  {employee.document_id}
                </span>
              </div>

              <p className="text-[9px] text-stone-400 mt-3 font-mono leading-tight">
                Válido para el registro de asistencia en terminales y lectores autorizados.
              </p>
            </div>

            {/* Pie del Carnet */}
            <div className="bg-[#050e09] px-4 py-2 text-center border-t border-amber-600/30 flex items-center justify-between text-[9px] font-mono font-bold text-stone-400">
              <span className="text-amber-400/90 uppercase tracking-wider">CHINOKUE LTDA</span>
              <span>CÓDIGO OFICIAL</span>
            </div>

          </div>

        </div>

        {/* Acciones del Modal */}
        <div className="p-4 bg-[#0a120e] border-t border-stone-800 flex items-center justify-end space-x-2.5 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg border border-emerald-500/40 transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>Imprimir Carnet</span>
          </button>
        </div>

      </div>
    </div>
  );
}
