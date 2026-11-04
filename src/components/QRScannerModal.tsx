'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  recordType: 'entrada' | 'salida';
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRScannerModal({ recordType, onClose, onSuccess }: Props) {
  const { user, employees, settings, recordAttendanceMark } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<{ lat?: number; lng?: number; accuracy?: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        setErrorMsg(null);
        const qrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) handleCodeScanned(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        if (mounted) {
          setErrorMsg('No fue posible iniciar la cámara. Conceda permisos de acceso en su navegador.');
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch(() => {});
      }
    };
  }, []);

  const handleCodeScanned = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop().catch(() => {});
      }

      let targetEmployeeId = user?.id;

      // Código QR de sede central
      if (decodedText.includes(settings.workplace_qr_secret) || decodedText.includes('CHINOKUE-SEDE')) {
        targetEmployeeId = user?.id;
      } 
      // Código QR de carnet de empleado
      else if (decodedText.startsWith('EMP-QR-') || decodedText.includes('CHINOKUE-EMP-')) {
        const found = employees.find(e => e.qr_token === decodedText || decodedText.includes(e.document_id));
        if (found) targetEmployeeId = found.id;
      }

      if (!targetEmployeeId) {
        throw new Error('El código QR no corresponde a un punto de marcación autorizado.');
      }

      const res = await recordAttendanceMark(recordType, targetEmployeeId, 'qr_scan');
      if (!res.success) {
        throw new Error(res.error || 'Error al guardar la marcación');
      }

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(80);
      }

      setSuccessData(res.record);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el código');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 text-stone-100 rounded-3xl max-w-sm w-full overflow-hidden border border-stone-800 shadow-2xl flex flex-col">
        
        {/* Cabecera */}
        <div className="p-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${recordType === 'entrada' ? 'bg-emerald-950 text-emerald-400' : 'bg-stone-800 text-stone-300'}`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Marcar {recordType}
              </h3>
              <p className="text-[11px] text-stone-400">
                Enfoque el código QR de la sede o su carnet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor o Confirmación */}
        <div className="p-4 flex flex-col items-center">
          {successData ? (
            /* Confirmación */
            <div className="py-6 px-2 flex flex-col items-center text-center w-full">
              <div className="w-14 h-14 bg-emerald-950 border border-emerald-700/60 rounded-2xl flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-0.5">
                Marcación de {recordType} registrada
              </h4>
              <p className="text-xs text-stone-400 mb-4">
                {successData.employee?.full_name || user?.full_name}
              </p>

              <div className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 text-left text-xs space-y-1.5 mb-5 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Hora:</span>
                  <span className="font-bold text-stone-200">{successData.timestamp_local}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Calificación:</span>
                  <span className={successData.status === 'puntual' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {successData.status === 'puntual' ? 'Puntual' : 'Tardanza'}
                  </span>
                </div>
                {successData.accuracy && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">GPS:</span>
                    <span className="text-stone-300">±{Math.round(successData.accuracy)} metros</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl transition-colors"
              >
                Aceptar
              </button>
            </div>
          ) : (
            /* Cámara activa */
            <div className="w-full flex flex-col items-center">
              {errorMsg ? (
                <div className="p-5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center space-y-2 my-2">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs text-rose-200">{errorMsg}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white rounded-lg inline-flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-black border border-stone-700 flex items-center justify-center">
                  <div id={scannerContainerId} className="w-full h-full" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-stone-950/80 flex flex-col items-center justify-center text-white z-10">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
                      <span className="text-xs font-semibold">Registrando...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Estado GPS */}
              <div className="mt-3 w-full bg-stone-950 px-3 py-2 rounded-xl border border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <div className="flex items-center space-x-1.5">
                  <MapPin className={`w-3.5 h-3.5 ${gpsStatus ? 'text-emerald-400' : 'text-stone-600'}`} />
                  <span>
                    {gpsStatus 
                      ? `GPS activo (±${Math.round(gpsStatus.accuracy || 10)}m)` 
                      : 'Buscando GPS...'}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-stone-500">
                  {settings.timezone.split('/')[1] || 'Asunción'}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
