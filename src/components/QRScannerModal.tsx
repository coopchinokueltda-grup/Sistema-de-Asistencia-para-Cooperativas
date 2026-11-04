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
  Upload,
  ImageIcon
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
  } catch {}
}

export default function QRScannerModal({ recordType, onClose, onSuccess }: Props) {
  const { user, employees, settings, recordAttendanceMark } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanFrameRef = useRef<() => void>();

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

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // Procesa el token QR detectado
  const handleScannedValue = useCallback(async (rawValue: string) => {
    if (isProcessing || successData) return;
    setIsProcessing(true);
    stopCamera();

    try {
      let targetEmployeeId = user?.id;

      if (rawValue.startsWith('CHINOKUE_KIOSK:')) {
        targetEmployeeId = user?.id;
      } else if (rawValue.startsWith('CHINOKUE-EMP-')) {
        const docId = rawValue.replace('CHINOKUE-EMP-', '').trim();
        const matched = employees.find(e => e.document_id === docId);
        if (matched) {
          targetEmployeeId = matched.id;
        } else if (user?.role === 'employee') {
          targetEmployeeId = user.id;
        } else {
          throw new Error(`No se encontró ningún empleado con la cédula ${docId}.`);
        }
      } else {
        const matchedByToken = employees.find(e => e.qr_token === rawValue);
        if (matchedByToken) {
          targetEmployeeId = matchedByToken.id;
        } else if (user) {
          targetEmployeeId = user.id;
        } else {
          throw new Error('Código QR no reconocido por el sistema.');
        }
      }

      if (!targetEmployeeId) {
        throw new Error('No fue posible identificar al trabajador para la marcación.');
      }

      const res = await recordAttendanceMark(
        recordType,
        targetEmployeeId,
        rawValue.startsWith('CHINOKUE_KIOSK:') ? 'kiosk_scan' : 'qr_scan'
      );

      if (!res.success || !res.record) {
        throw new Error(res.error || 'No fue posible registrar la marcación.');
      }

      playConfirmationChime();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([80, 40, 80]); } catch {}
      }

      setSuccessData(res.record);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el código QR.');
      setIsProcessing(false);
    }
  }, [isProcessing, successData, user, employees, recordAttendanceMark, recordType, stopCamera, onSuccess]);

  // Decodificación con jsQR sobre el fotograma de video
  const scanWithJsQR = useCallback((video: HTMLVideoElement) => {
    if (!canvasRef.current || isProcessing || successData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    try {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScannedValue(code.data);
      } else {
        animationFrameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
      }
    } catch {
      animationFrameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
    }
  }, [handleScannedValue, isProcessing, successData]);

  // Bucle de escaneo continuo estable
  const scanFrame = useCallback(() => {
    try {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
        return;
      }

      scanWithJsQR(videoRef.current);
    } catch {
      animationFrameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
    }
  }, [scanWithJsQR]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  // Iniciar cámara nativa sin bucles de re-renderizado
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        setErrorMsg(null);
        setCameraReady(false);

        if (typeof window === 'undefined') return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('La cámara no está disponible o requiere conexión segura HTTPS.');
        }

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          // Fallback con restricciones mínimas si falla la resolución ideal
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: facingMode ? { facingMode: { ideal: facingMode } } : true,
          });
        }

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
          const video = videoRef.current;
          video.srcObject = stream;
          video.muted = true;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');

          video.onloadedmetadata = async () => {
            if (!active) return;
            try {
              await video.play();
            } catch (playErr) {
              console.warn('Video play deferral:', playErr);
            }
            if (active) {
              setCameraReady(true);
              animationFrameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
            }
          };
        }
      } catch (err: any) {
        if (active) {
          const name = err.name || '';
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            setErrorMsg('Permiso de cámara denegado. Permita el acceso a la cámara en los ajustes de su navegador.');
          } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            setErrorMsg('No se detectó ninguna cámara disponible en este dispositivo.');
          } else {
            setErrorMsg(err.message || 'No fue posible iniciar la cámara. Verifique que ingrese con HTTPS.');
          }
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [facingMode, stopCamera]);

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

  // Escaneo alternativo mediante archivo / foto seleccionada de la galería
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data) {
          handleScannedValue(code.data);
        } else {
          setErrorMsg('No se detectó ningún código QR en la imagen seleccionada. Intente con una foto más clara.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-[#101E1A] text-[#F5F7F5] rounded-3xl max-w-sm w-full overflow-hidden border border-[#203B30] shadow-2xl flex flex-col relative">
        
        {/* Barra superior */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-[#203B30] bg-[#071512]">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-xl ${recordType === 'entrada' ? 'bg-[#063D32] text-[#00A878] border border-[#00A878]/30' : 'bg-amber-950 text-[#F5B942] border border-[#F5B942]/30'}`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs tracking-tight text-white capitalize">
                Marcar {recordType}
              </h3>
              <p className="text-[10px] text-[#A5B4AC]">
                Lector de asistencia
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-xl transition-colors ${torchOn ? 'bg-[#F5B942]/20 text-[#F5B942]' : 'text-[#A5B4AC] hover:text-white'}`}
                title="Linterna"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={switchCameraFacing}
              className="p-1.5 text-[#A5B4AC] hover:text-white rounded-xl transition-colors"
              title="Cambiar cámara (frontal/trasera)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#A5B4AC] hover:text-white rounded-xl hover:bg-[#162720] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visor de Cámara */}
        <div className="p-4 flex flex-col items-center">
          {successData ? (
            <div className="py-6 px-3 flex flex-col items-center text-center w-full animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#063D32] border border-[#00A878]/50 flex items-center justify-center text-[#00A878] mb-3 shadow-lg shadow-[#00A878]/25">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <h4 className="text-base font-bold text-white tracking-tight">
                Marcación de {recordType} registrada
              </h4>
              <p className="text-xs text-[#00A878] font-semibold mt-0.5 mb-4">
                {successData.employee?.full_name || user?.full_name}
              </p>

              <div className="w-full bg-[#071512] border border-[#203B30] rounded-2xl p-3.5 text-left text-xs space-y-2 mb-5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[#A5B4AC] text-[11px]">Hora local:</span>
                  <span className="font-bold text-white">{successData.timestamp_local}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A5B4AC] text-[11px]">Calificación:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    successData.status === 'puntual'
                      ? 'bg-[#063D32] text-[#00A878] border border-[#00A878]/40'
                      : 'bg-amber-950 text-[#F5B942] border border-[#F5B942]/40'
                  }`}>
                    {successData.status.replace('_', ' ')}
                  </span>
                </div>
                {successData.accuracy && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#A5B4AC] text-[11px]">Precisión GPS:</span>
                    <span className="text-[#00A878]">±{Math.round(successData.accuracy)}m</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#00A878] hover:bg-[#008F68] active:bg-[#063D32] text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Aceptar
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-3">
              {errorMsg ? (
                <div className="p-4 bg-rose-950/40 border border-[#EF5350]/60 rounded-2xl text-center space-y-2.5 my-2 w-full">
                  <AlertTriangle className="w-7 h-7 text-[#EF5350] mx-auto" />
                  <p className="text-xs text-rose-200 leading-relaxed">{errorMsg}</p>
                  <button
                    onClick={() => { setErrorMsg(null); setFacingMode('environment'); }}
                    className="px-3.5 py-1.5 bg-[#162720] hover:bg-[#203B30] text-xs font-semibold text-white rounded-lg inline-flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar cámara
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden bg-black border-2 border-[#203B30] shadow-inner flex items-center justify-center">
                  
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />

                  {/* Retícula de Enfoque con resplandor esmeralda */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00A878] rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00A878] rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00A878] rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00A878] rounded-br-xl" />
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#00A878] to-transparent shadow-sm shadow-[#00A878] animate-pulse" />
                    </div>
                  </div>

                  {/* Estado de procesamiento */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-[#071512]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                      <RefreshCw className="w-7 h-7 text-[#00A878] animate-spin mb-2" />
                      <span className="text-xs font-semibold tracking-wide">Validando marcación...</span>
                    </div>
                  )}

                  {!cameraReady && !errorMsg && (
                    <div className="absolute inset-0 bg-[#071512] flex flex-col items-center justify-center text-[#A5B4AC] z-10">
                      <RefreshCw className="w-6 h-6 text-[#00A878] animate-spin mb-2" />
                      <span className="text-xs">Iniciando cámara...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de contingencia: Cargar foto o captura con QR */}
              <div className="w-full pt-1">
                <label className="w-full cursor-pointer py-2.5 px-3 bg-[#162720] hover:bg-[#203B30] text-[#00A878] rounded-2xl border border-[#203B30] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                  <ImageIcon className="w-4 h-4 text-[#F5B942]" />
                  <span>Subir foto con QR desde galería o archivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Barra de Telemetría GPS */}
              <div className="w-full bg-[#071512] px-3.5 py-2 rounded-2xl border border-[#203B30] flex items-center justify-between text-[11px] text-[#A5B4AC] font-mono">
                <div className="flex items-center space-x-2">
                  <MapPin className={`w-3.5 h-3.5 ${gpsStatus ? 'text-[#00A878]' : 'text-stone-600 animate-pulse'}`} />
                  <span>
                    {gpsStatus 
                      ? `GPS: ±${Math.round(gpsStatus.accuracy || 10)}m` 
                      : 'Buscando satélites...'}
                  </span>
                </div>
                <span className="text-[10px] text-[#A5B4AC] uppercase">
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
