'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Profile, SystemSettings } from '@/types';
import { 
  Printer, 
  X, 
  Download, 
  Check, 
  FileText,
  CreditCard,
  Sparkles,
  Info
} from 'lucide-react';
import CoopLogo from './CoopLogo';

interface Props {
  employee: Profile;
  settings: SystemSettings;
  onClose: () => void;
}

// Formatea la cédula con separador de miles paraguayo (ej: 5.203.568)
function formatCedula(docId: string): string {
  if (!docId) return '';
  const num = docId.replace(/\D/g, '');
  if (!num) return docId;
  try {
    return new Intl.NumberFormat('es-PY').format(Number(num));
  } catch {
    return docId;
  }
}

// Avatar institucional corporativo de alta calidad cuando el empleado no tiene foto cargada
function CorporateAvatarFallback() {
  return (
    <svg 
      className="w-full h-full"
      viewBox="0 0 120 150" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="corpBkg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8EFEB" />
          <stop offset="100%" stopColor="#D5DFDA" />
        </linearGradient>
        <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#063D32" />
          <stop offset="100%" stopColor="#071A14" />
        </linearGradient>
      </defs>

      {/* Fondo neutro de estudio */}
      <rect width="120" height="150" fill="url(#corpBkg)" />

      {/* Marca de agua institucional sutil en el fondo */}
      <circle cx="60" cy="75" r="45" fill="none" stroke="#008F68" strokeWidth="1" strokeDasharray="3 3" opacity="0.18" />

      {/* Cabeza / Rostro silueteado sobrio */}
      <circle cx="60" cy="52" r="23" fill="#063D32" />

      {/* Torso / Traje formal corporativo */}
      <path 
        d="M20 150 C20 115 38 92 60 92 C82 92 100 115 100 150 Z" 
        fill="url(#suitGrad)" 
      />

      {/* Cuello de camisa blanca */}
      <polygon points="60,94 48,114 72,114" fill="#FFFFFF" />

      {/* Corbata institucional en verde esmeralda y oro */}
      <polygon points="60,102 56,126 60,138 64,126" fill="#008F68" />
      <polygon points="58,102 62,102 63,107 57,107" fill="#D6A72C" />
    </svg>
  );
}

export default function EmployeeBadgeCard({ employee, settings, onClose }: Props) {
  const badgeDomRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [pngSuccess, setPngSuccess] = useState(false);

  // Genera un Canvas con resolución fotográfica 300 DPI respetando estrictamente 53.98mm × 85.60mm
  const generateHighResCanvas = async (): Promise<HTMLCanvasElement> => {
    // Escala para 300 DPI estándar de tarjetas plásticas PVC
    // 53.98 mm = 2.125 pulgadas * 300 DPI = 638 px
    // 85.60 mm = 3.370 pulgadas * 300 DPI = 1011 px
    const width = 638;
    const height = 1011;
    const s = width / 340; // Factor de escala (aprox 1.876)

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo inicializar canvas');

    // 1. Fondo de la tarjeta (Blanco puro)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Micro-patrón de seguridad en el fondo (Guilloché sutil)
    ctx.strokeStyle = '#E8EFEB';
    ctx.lineWidth = 1;
    for (let y = 140 * s; y < 490 * s; y += 14 * s) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Encabezado en Verde Profundo (#071A14)
    const headerH = 72 * s;
    ctx.fillStyle = '#071A14';
    ctx.fillRect(0, 0, width, headerH);

    // Línea divisoria en Dorado Institucional (#D6A72C)
    ctx.fillStyle = '#D6A72C';
    ctx.fillRect(0, headerH, width, 3 * s);

    // Sub-franja verde oscuro (#063D32)
    const subHeaderH = 22 * s;
    ctx.fillStyle = '#063D32';
    ctx.fillRect(0, headerH + 3 * s, width, subHeaderH);

    // Texto del Sub-header
    ctx.fillStyle = '#E8EFEB';
    ctx.font = `bold ${8.5 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CARNET DE IDENTIFICACIÓN LABORAL', width / 2, headerH + 17.5 * s);

    // Textos del encabezado institucional
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${11.5 * s}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('COOPERATIVA CHINOKUE LTDA.', 70 * s, 34 * s);

    ctx.fillStyle = '#D6A72C';
    ctx.font = `bold ${7.5 * s}px sans-serif`;
    ctx.fillText('COOPERATIVA DE PRODUCCIÓN AGROPECUARIA', 70 * s, 50 * s);

    // 3. Marco de Fotografía
    const photoW = 102 * s;
    const photoH = 128 * s;
    const photoX = (width - photoW) / 2;
    const photoY = 114 * s;

    // Borde dorado de la foto
    ctx.fillStyle = '#D6A72C';
    ctx.fillRect(photoX - 2 * s, photoY - 2 * s, photoW + 4 * s, photoH + 4 * s);
    ctx.fillStyle = '#E8EFEB';
    ctx.fillRect(photoX, photoY, photoW, photoH);

    // Dibujar fotografía o avatar
    if (employee.avatar_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = employee.avatar_url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        ctx.drawImage(img, photoX, photoY, photoW, photoH);
      } catch {
        drawFallbackSilhouette(ctx, photoX, photoY, photoW, photoH, s);
      }
    } else {
      drawFallbackSilhouette(ctx, photoX, photoY, photoW, photoH, s);
    }

    // 4. Datos del Empleado
    // Nombre
    ctx.fillStyle = '#071A14';
    ctx.font = `900 ${13.5 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(employee.full_name.toUpperCase(), width / 2, 262 * s);

    // Píldora de Cargo
    const cargoText = (employee.position || 'Personal Operativo').toUpperCase();
    ctx.font = `bold ${8.5 * s}px sans-serif`;
    const cargoTextWidth = ctx.measureText(cargoText).width;
    const pillW = cargoTextWidth + 24 * s;
    const pillH = 18 * s;
    const pillX = (width - pillW) / 2;
    const pillY = 274 * s;

    ctx.fillStyle = '#063D32';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 9 * s) : ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(cargoText, width / 2, pillY + 12.5 * s);

    // Área y Cédula
    ctx.fillStyle = '#008F68';
    ctx.font = `600 ${9.5 * s}px sans-serif`;
    ctx.fillText(`Área: ${employee.department || 'Operaciones'}`, width / 2, 310 * s);

    ctx.fillStyle = '#071A14';
    ctx.font = `bold ${10.5 * s}px monospace`;
    ctx.fillText(`C.I. Nº ${formatCedula(employee.document_id)}`, width / 2, 328 * s);

    // 5. Código QR (Capturar el SVG del DOM)
    if (badgeDomRef.current) {
      const qrSvgEl = badgeDomRef.current.querySelector('svg.badge-qr-svg');
      if (qrSvgEl) {
        const qrSvgData = new XMLSerializer().serializeToString(qrSvgEl);
        const qrBlob = new Blob([qrSvgData], { type: 'image/svg+xml;charset=utf-8' });
        const qrUrl = URL.createObjectURL(qrBlob);
        const qrImg = new Image();
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.src = qrUrl;
        });

        const qrSize = 105 * s;
        const qrX = (width - qrSize) / 2;
        const qrY = 345 * s;

        // Recuadro blanco del QR
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E8EFEB';
        ctx.lineWidth = 1 * s;
        ctx.fillRect(qrX - 6 * s, qrY - 6 * s, qrSize + 12 * s, qrSize + 12 * s);
        ctx.strokeRect(qrX - 6 * s, qrY - 6 * s, qrSize + 12 * s, qrSize + 12 * s);

        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        URL.revokeObjectURL(qrUrl);
      }
    }

    // Código de verificación bajo el QR
    ctx.fillStyle = '#063D32';
    ctx.font = `bold ${8.5 * s}px monospace`;
    ctx.fillText(`ID: ${employee.document_id}`, width / 2, 478 * s);

    // 6. Pie del Carnet
    const footerH = 34 * s;
    const footerY = height - footerH;

    ctx.fillStyle = '#D6A72C';
    ctx.fillRect(0, footerY - 2 * s, width, 2 * s);

    ctx.fillStyle = '#071A14';
    ctx.fillRect(0, footerY, width, footerH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${8.5 * s}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('COOPERATIVA CHINOKUE LTDA.', 16 * s, footerY + 21 * s);

    ctx.fillStyle = '#D6A72C';
    ctx.font = `bold ${8 * s}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('IDENTIFICACIÓN OFICIAL', width - 16 * s, footerY + 21 * s);

    return canvas;
  };

  function drawFallbackSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) {
    ctx.fillStyle = '#E8EFEB';
    ctx.fillRect(x, y, w, h);

    // Cabeza
    ctx.fillStyle = '#063D32';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 42 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();

    // Traje
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 10 * s, 36 * s, 45 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Camisa
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 74 * s);
    ctx.lineTo(x + w / 2 - 10 * s, y + 95 * s);
    ctx.lineTo(x + w / 2 + 10 * s, y + 95 * s);
    ctx.closePath();
    ctx.fill();

    // Corbata
    ctx.fillStyle = '#008F68';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 80 * s);
    ctx.lineTo(x + w / 2 - 4 * s, y + 106 * s);
    ctx.lineTo(x + w / 2, y + 115 * s);
    ctx.lineTo(x + w / 2 + 4 * s, y + 106 * s);
    ctx.closePath();
    ctx.fill();
  }

  // DESCARGA EN PDF OFICIAL (Exactamente 53.98mm × 85.60mm - ISO CR80)
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const canvas = await generateHighResCanvas();
      const imgData = canvas.toDataURL('image/png');

      // Crear documento PDF con el tamaño físico exacto de una tarjeta CR80 (53.98mm x 85.60mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [53.98, 85.60],
      });

      // Insertar la imagen en tamaño 1:1 exacto sin márgenes
      pdf.addImage(imgData, 'PNG', 0, 0, 53.98, 85.60, undefined, 'FAST');
      pdf.save(`Carnet_${employee.document_id}_${employee.full_name.replace(/\s+/g, '_')}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error('Error al generar PDF del carnet:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // DESCARGA EN IMAGEN PNG DE ALTA RESOLUCIÓN (300 DPI)
  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      const canvas = await generateHighResCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Carnet_${employee.document_id}_${employee.full_name.replace(/\s+/g, '_')}.png`;
      a.click();

      setPngSuccess(true);
      setTimeout(() => setPngSuccess(false), 2500);
    } catch (err) {
      console.error('Error al generar PNG del carnet:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  // IMPRESIÓN DIRECTA
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white animate-fadeIn">
      
      {/* Contenedor Modal */}
      <div className="bg-[#101E1A] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#203B30] text-[#F5F7F5] print:shadow-none print:border-none print:max-w-none print:w-full">
        
        {/* ======================================================== */}
        {/* CABECERA DEL MODAL (Oculta al imprimir)                  */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#071512] border-b border-[#203B30] print:hidden">
          <div className="flex items-center space-x-2.5">
            <CreditCard className="w-5 h-5 text-[#D6A72C]" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Credencial Laboral Oficial CR80
              </h3>
              <p className="text-[10px] text-[#A5B4AC] font-mono">
                Medidas exactas: 54.0 mm &times; 85.6 mm (ISO/IEC 7810 ID-1)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B4AC] hover:text-white p-1.5 rounded-xl hover:bg-[#162720] transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* ÁREA DE VISUALIZACIÓN / IMPRESIÓN DEL CARNET             */}
        {/* ======================================================== */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#071512] print:p-0 print:bg-white print:m-0" ref={badgeDomRef}>
          
          {/* Tarjeta Proporción Vertical Real CR80 (54mm × 85.6mm) */}
          <div 
            id="chinokue-employee-badge"
            className="w-[340px] h-[540px] rounded-2xl overflow-hidden shadow-2xl bg-white text-[#071A14] flex flex-col justify-between relative border border-[#D6A72C]/50 print:border print:border-black print:shadow-none print:rounded-none"
            style={{
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            
            {/* 1. ENCABEZADO INSTITUCIONAL */}
            <div className="bg-[#071A14] text-white pt-4 pb-3 px-4 relative shrink-0">
              <div className="flex items-center space-x-3">
                <div className="shrink-0 drop-shadow">
                  <CoopLogo size={42} className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="font-black text-xs tracking-wider text-white uppercase leading-snug">
                    COOPERATIVA CHINOKUE LTDA.
                  </h1>
                  <span className="text-[8.5px] font-bold text-[#D6A72C] tracking-[0.2em] uppercase block leading-tight">
                    COOPERATIVA DE PRODUCCIÓN
                  </span>
                </div>
              </div>
            </div>

            {/* Separador fino dorado */}
            <div className="h-[2px] bg-[#D6A72C] w-full shrink-0" />

            {/* Sub-franja de título de identificación */}
            <div className="bg-[#063D32] py-1 text-center shrink-0">
              <span className="text-[8.5px] font-bold tracking-[0.2em] text-[#E8EFEB] uppercase">
                CARNET DE IDENTIFICACIÓN LABORAL
              </span>
            </div>

            {/* 2. CUERPO DEL CARNET (FONDO BLANCO INSTITUCIONAL CON MICRO-TRAMA) */}
            <div className="flex-1 px-4 py-3 flex flex-col items-center justify-between text-center relative overflow-hidden bg-white">
              
              {/* Trama sutil de fondo */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#063D32_1px,transparent_1px)] [background-size:12px_12px]" />

              {/* FOTOGRAFÍA DEL TRABAJADOR */}
              <div className="relative z-10 shrink-0">
                <div className="w-[102px] h-[128px] rounded-xl overflow-hidden p-0.5 bg-[#D6A72C] shadow-md">
                  <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#E8EFEB] flex items-center justify-center">
                    {employee.avatar_url ? (
                      <img 
                        src={employee.avatar_url} 
                        alt={employee.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CorporateAvatarFallback />
                    )}
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN DEL EMPLEADO */}
              <div className="space-y-1 relative z-10 w-full shrink-0">
                
                {/* Nombre Completo */}
                <h2 className="font-black text-[#071A14] text-sm sm:text-base leading-tight tracking-tight uppercase px-1 line-clamp-2">
                  {employee.full_name}
                </h2>

                {/* Cargo / Puesto en píldora elegante */}
                <div className="inline-block">
                  <span className="px-3 py-0.5 rounded-full bg-[#063D32] text-white text-[9.5px] font-bold tracking-wider uppercase shadow-xs">
                    {employee.position || 'Personal Operativo'}
                  </span>
                </div>

                {/* Departamento / Área */}
                <div className="text-[10.5px] font-semibold text-[#008F68] leading-tight">
                  Área: {employee.department || 'Operaciones'}
                </div>

                {/* Cédula de Identidad */}
                <div className="font-mono text-xs font-bold text-[#071A14] pt-0.5">
                  C.I. Nº {formatCedula(employee.document_id)}
                </div>

              </div>

              {/* CÓDIGO QR LIMPIO EN FONDO BLANCO */}
              <div className="relative z-10 shrink-0 my-0.5">
                <div className="p-2 bg-white rounded-xl border border-[#E8EFEB] shadow-xs inline-flex flex-col items-center">
                  <QRCodeSVG
                    className="badge-qr-svg"
                    value={employee.qr_token || `CHINOKUE-EMP-${employee.document_id}`}
                    size={105}
                    level="H"
                    includeMargin={false}
                    fgColor="#071A14"
                    bgColor="#FFFFFF"
                  />
                  <span className="text-[9px] font-mono font-bold text-[#063D32] tracking-wider mt-1 block">
                    ID: {employee.document_id}
                  </span>
                </div>
              </div>

            </div>

            {/* Separador fino dorado */}
            <div className="h-[2px] bg-[#D6A72C] w-full shrink-0" />

            {/* 3. PIE DEL CARNET */}
            <div className="bg-[#071A14] text-white py-2.5 px-4 flex items-center justify-between text-[8.5px] font-mono shrink-0">
              <span className="font-black text-white uppercase tracking-wider">
                COOPERATIVA CHINOKUE LTDA.
              </span>
              <span className="font-bold text-[#D6A72C] tracking-widest uppercase">
                IDENTIFICACIÓN OFICIAL
              </span>
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* NOTA INFORMATIVA DE IMPRESIÓN FÍSICA                     */}
        {/* ======================================================== */}
        <div className="px-6 py-2 bg-[#071512] border-t border-[#203B30] text-[11px] text-[#A5B4AC] flex items-center gap-2 print:hidden">
          <Info className="w-4 h-4 text-[#D6A72C] shrink-0" />
          <span>Para tarjetas plásticas PVC o papel, use <strong>"Descargar PDF"</strong> para obtener las medidas físicas exactas 1:1 sin deformación.</span>
        </div>

        {/* ======================================================== */}
        {/* CONTROLES DE ACCIÓN (Descargar PDF / Imprimir / PNG)     */}
        {/* ======================================================== */}
        <div className="p-4 bg-[#071512] border-t border-[#203B30] flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-[#A5B4AC] hover:text-white rounded-xl hover:bg-[#162720] transition-colors"
          >
            Volver a empleados
          </button>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Botón Descargar PDF Oficial (54mm × 85.6mm) */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#008F68] hover:bg-[#00A878] active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
              title="Descargar documento PDF con tamaño físico exacto 54mm × 85.6mm para impresora de carnets"
            >
              {pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡PDF Guardado!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#D6A72C]" />
                  <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar PDF (CR80)'}</span>
                </>
              )}
            </button>

            {/* 2. Botón Descargar Imagen PNG (300 DPI) */}
            <button
              onClick={handleDownloadPng}
              disabled={downloadingPng}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#162720] hover:bg-[#203B30] text-[#D6A72C] hover:text-white text-xs font-bold rounded-xl border border-[#203B30] transition-all disabled:opacity-50"
              title="Descargar carnet como imagen de alta resolución"
            >
              {pngSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#008F68]" />
                  <span>¡Listo!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingPng ? 'Generando...' : 'PNG (300 DPI)'}</span>
                </>
              )}
            </button>

            {/* 3. Botón Imprimir Carnet */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#162720] hover:bg-[#203B30] text-stone-200 hover:text-white font-bold text-xs rounded-xl border border-[#203B30] transition-all"
              title="Imprimir carnet"
            >
              <Printer className="w-3.5 h-3.5 text-stone-300" />
              <span>Imprimir</span>
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
