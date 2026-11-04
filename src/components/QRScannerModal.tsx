'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Flashlight,
  SwitchCamera,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  recordType: 'entrada' | 'salida';
  onClose: () => void;
  onSuccess?: () => void;
}

// Emite un tono sutil de confirmación usando Web Audio nativo (sin archivos externos)
function playConfirmationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, se ignora silenciosamente
  }
}

export default function QRScannerModal({ recordType, onClose, onSuccess }: Props) {
  const { user, employees, settings, recordAttendanceMark } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<{ lat?: number; lng?: number; accuracy?: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Obtener geolocalización GPS
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
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

  // Detener la cámara limpiamente
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Procesar código decodificado
  const handleScannedValue = useCallback(async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      stopCamera();

      let targetEmployeeId = user?.id;

      // Código de la sede o kiosco
      if (decodedText.includes(settings.workplace_qr_secret) || decodedText.includes('CHINOKUE-SEDE')) {
        targetEmployeeId = user?.id;
      } 
      // Carnet de empleado
      else if (decodedText.startsWith('EMP-QR-') || decodedText.includes('CHINOKUE-EMP-')) {
        const found = employees.find(e => e.qr_token === decodedText || decodedText.includes(e.document_id));
        if (found) targetEmployeeId = found.id;
      }

      if (!targetEmployeeId) {
        throw new Error('El código QR no corresponde a un punto de marcación autorizado.');
      }

      const res = await recordAttendanceMark(recordType, targetEmployeeId, 'qr_scan');
      if (!res.success) {
        throw new Error(res.error || 'No fue posible registrar la marcación.');
      }

      playConfirmationChime();

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([70, 40, 70]);
      }

      setSuccessData(res.record);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el código.');
      setIsProcessing(false);
    }
  }, [isProcessing, user, settings, employees, recordType, recordAttendanceMark, onSuccess, stopCamera]);

  // Bucle de escaneo fotograma a fotograma
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA || isProcessing) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    // 1. Detección nativa por hardware si está disponible
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        detector.detect(video)
          .then((barcodes: any[]) => {
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleScannedValue(barcodes[0].rawValue);
            } else {
              animationFrameRef.current = requestAnimationFrame(scanFrame);
            }
          })
          .catch(() => {
            runJsQR(ctx, width, height);
          });
        return;
      } catch {
        // Fallback a jsQR
      }
    }

    // 2. Detección por software con jsQR
    runJsQR(ctx, width, height);
  }, [isProcessing, handleScannedValue]);

  const runJsQR = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScannedValue(code.data);
      } else {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  // Iniciar cámara nativa sin librerías invasivas
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        setErrorMsg(null);
        setCameraReady(false);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Este navegador o dispositivo no soporta acceso a la cámara.');
        }

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as any;
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          if (active) {
            setCameraReady(true);
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        }
      } catch (err: any) {
        if (active) {
          const name = err.name || '';
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            setErrorMsg('Permiso de cámara denegado. Permita el acceso a la cámara en los ajustes de su navegador.');
          } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            setErrorMsg('No se detectó ninguna cámara disponible en este dispositivo.');
          } else {
            setErrorMsg(err.message || 'No fue posible iniciar la cámara en este dispositivo.');
          }
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [facingMode, scanFrame, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0] as any;
    if (track && hasTorch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch {}
    }
  };

  const switchCameraFacing = () => {
    stopCamera();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/90 backdrop-blur-md">
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-gradient-to-b from-stone-900 to-stone-950 text-stone-100 rounded-3xl max-w-sm w-full overflow-hidden border border-emerald-800/40 shadow-2xl flex flex-col relative">
        
        {/* Barra superior */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-stone-800/80 bg-stone-900/60">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-xl ${recordType === 'entrada' ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50' : 'bg-amber-950 text-amber-400 border border-amber-700/50'}`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs tracking-tight text-white capitalize">
                Marcar {recordType}
              </h3>
              <p className="text-[10px] text-stone-400">
                Lector de asistencia
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-xl transition-colors ${torchOn ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-white'}`}
                title="Linterna"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={switchCameraFacing}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl transition-colors"
              title="Cambiar cámara"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visor */}
        <div className="p-4 flex flex-col items-center">
          {successData ? (
            <div className="py-6 px-3 flex flex-col items-center text-center w-full animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <h4 className="text-base font-bold text-white tracking-tight">
                Marcación de {recordType} registrada
              </h4>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5 mb-4">
                {successData.employee?.full_name || user?.full_name}
              </p>

              <div className="w-full bg-stone-950/90 border border-stone-800 rounded-2xl p-3.5 text-left text-xs space-y-2 mb-5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Hora local:</span>
                  <span className="font-bold text-stone-100">{successData.timestamp_local}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Calificación:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    successData.status === 'puntual'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                  }`}>
                    {successData.status.replace('_', ' ')}
                  </span>
                </div>
                {successData.accuracy && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-[11px]">Precisión GPS:</span>
                    <span className="text-emerald-400">±{Math.round(successData.accuracy)}m</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Aceptar
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {errorMsg ? (
                <div className="p-5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center space-y-2.5 my-3 w-full">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs text-rose-200 leading-relaxed">{errorMsg}</p>
                  <button
                    onClick={() => { setErrorMsg(null); setFacingMode('environment'); }}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white rounded-lg inline-flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden bg-black border-2 border-stone-800 shadow-inner flex items-center justify-center">
                  
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />

                  {/* Retícula de Enfoque */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-xl" />
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-sm shadow-emerald-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Estado de procesamiento */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                      <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-2" />
                      <span className="text-xs font-semibold tracking-wide">Validando marcación...</span>
                    </div>
                  )}

                  {!cameraReady && !errorMsg && (
                    <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center text-stone-400 z-10">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
                      <span className="text-xs">Iniciando cámara...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Barra de Telemetría GPS */}
              <div className="mt-3.5 w-full bg-stone-950/90 px-3.5 py-2 rounded-2xl border border-stone-800 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <div className="flex items-center space-x-2">
                  <MapPin className={`w-3.5 h-3.5 ${gpsStatus ? 'text-emerald-400' : 'text-stone-600 animate-pulse'}`} />
                  <span>
                    {gpsStatus 
                      ? `GPS: ±${Math.round(gpsStatus.accuracy || 10)}m` 
                      : 'Buscando satélites...'}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 uppercase">
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
