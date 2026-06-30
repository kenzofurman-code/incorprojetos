import { Camera, CameraOff } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';

interface ScannerInstance {
  start(
    cameraConfig: { facingMode: string },
    configuration: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: () => void,
  ): Promise<unknown>;
  stop(): Promise<unknown>;
  clear(): void;
}

export function QrScanner({ onDetected }: { onDetected: (value: string) => void }) {
  const elementId = `qr-scanner-${useId().replace(/:/g, '')}`;
  const scannerRef = useRef<ScannerInstance | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function stop() {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {
      // A câmera pode já ter sido encerrada pelo navegador.
    } finally {
      scannerRef.current = null;
      setActive(false);
    }
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(elementId, false) as ScannerInstance;
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onDetected(decodedText);
          void stop();
        },
        () => undefined,
      );
      setActive(true);
    } catch (cameraError) {
      scannerRef.current = null;
      setError(cameraError instanceof Error ? cameraError.message : 'Não foi possível acessar a câmera.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => {
    if (scannerRef.current) void scannerRef.current.stop().catch(() => undefined);
  }, []);

  return (
    <div className="grid gap-3">
      <div className={active ? 'overflow-hidden rounded-2xl border border-slate-200' : 'hidden'} id={elementId} />
      {error && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      {active ? (
        <Button onClick={() => void stop()} type="button" variant="secondary"><CameraOff size={17} /> Encerrar câmera</Button>
      ) : (
        <Button disabled={busy} onClick={() => void start()} type="button" variant="secondary">
          <Camera size={17} /> {busy ? 'Abrindo câmera...' : 'Ler QR pela câmera'}
        </Button>
      )}
    </div>
  );
}
