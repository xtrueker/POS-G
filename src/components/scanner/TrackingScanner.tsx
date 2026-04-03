import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { BarcodeDetector } from 'barcode-detector';

interface TrackingScannerProps {
  onScan: (data: string) => void;
  isActive?: boolean;
  continuous?: boolean;
}

export default function TrackingScanner({ onScan, isActive = true, continuous = false }: TrackingScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const hasScannedRef = useRef(false);
  const isActiveRef = useRef(isActive);

  // Sync prop changes to the ref to avoid Stale Closure in `track` function
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const playBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleScanSuccess = useCallback((result: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    playBeep();
    onScan(result);

    // If continuous mode is enabled, unlock scanner after 1.5 seconds for the next item
    if (continuous) {
      setTimeout(() => {
        hasScannedRef.current = false;
      }, 1500);
    }
  }, [onScan, playBeep, continuous]);

  const startNativeTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
         playPromise.catch(_error => { /* safe ignore */ });
      }

      // Universal BarcodeDetector via Polyfill (ZXing WASM internally)
      const detector = new BarcodeDetector({ 
        formats: ['qr_code', 'ean_13', 'upc_a', 'upc_e', 'ean_8', 'code_128', 'code_39'] 
      });

      const track = async () => {
        if (!isScanningRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // IF INACTIVE, JUST CLEAR THE CANVAS AND RE-QUEUE RAF (DON'T SCAN)
            if (!isActiveRef.current) {
              rafRef.current = requestAnimationFrame(track);
              return;
            }

            try {
              const barcodes = await detector.detect(video);
              
              if (barcodes.length > 0) {
                const barcode = barcodes[0];
                
                // Draw Tracking Box (Minimalist Muji Style)
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                
                const points = barcode.cornerPoints;
                if (points && points.length === 4) {
                  ctx.moveTo(points[0].x, points[0].y);
                  ctx.lineTo(points[1].x, points[1].y);
                  ctx.lineTo(points[2].x, points[2].y);
                  ctx.lineTo(points[3].x, points[3].y);
                  ctx.closePath();
                  ctx.stroke();
                  ctx.fill();
                } else if (barcode.boundingBox) {
                  const { x, y, width, height } = barcode.boundingBox;
                  ctx.strokeRect(x, y, width, height);
                  ctx.fillRect(x, y, width, height);
                }

                if (!hasScannedRef.current) {
                  handleScanSuccess(barcode.rawValue);
                }
              }
            } catch (err) {
              // Ignore frame analysis errors
            }
          }
        }
        rafRef.current = requestAnimationFrame(track);
      };

      videoRef.current.addEventListener('play', () => {
        isScanningRef.current = true;
        track();
      });

    } catch (err) {
      toast.error('Error al encender la Cámara. Revisa los permisos.');
    }
  };

  const stopAll = () => {
    isScanningRef.current = false;
    
    // We intentionally DO NOT set hasScannedRef.current = true here 
    // so we don't accidentally block future opens inside the same lifecycle.

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startNativeTracking();
    return () => {
      stopAll();
    };
  }, []);

  // When isActive flips from false -> true, we must reset the scanned shield
  useEffect(() => {
    if (isActive) {
      hasScannedRef.current = false;
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-none overflow-hidden min-h-[250px] border border-zinc-200 dark:border-zinc-800" ref={containerRef}>
      <>
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover grayscale" 
          playsInline 
          muted 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
        />
        <div className="absolute inset-0 pointer-events-none z-[5] flex items-center justify-center">
          <div className="absolute inset-0 border border-white/20 m-8" />
          <div className="absolute left-8 right-8 h-[1px] bg-white dark:bg-zinc-950 shadow-[0_0_10px_#ffffff] animate-[scan_2s_linear_infinite]" />
          <span className="text-white text-[9px] tracking-[0.2em] uppercase font-semibold bg-black/80 backdrop-blur-sm px-3 py-1.5 z-20 absolute bottom-12 border border-white/10">ESCANEO IA WASM</span>
        </div>
      </>

      <style>{`
        @keyframes scan {
          0% { top: 2rem; }
          50% { top: calc(100% - 2rem); }
          100% { top: 2rem; }
        }
      `}</style>
    </div>
  );
}

