import { useEffect, useRef, useState } from 'react';

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

// Selecciona el mejor formato soportado por el navegador
function getBestMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function fmtSeg(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const BTN = {
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontWeight: 500, fontSize: '0.82rem', padding: '0.35rem 0.9rem',
};
const BTN_PRIMARY = { ...BTN, background: '#ea580c', color: '#fff' };
const BTN_OUTLINE = { ...BTN, background: '#fff', color: '#374151', border: '1px solid #e5e7eb' };
const BTN_DANGER  = { ...BTN, background: '#dc2626', color: '#fff' };
const BTN_SUCCESS = { ...BTN, background: '#16a34a', color: '#fff' };

/**
 * Componente grabador de audio estilo WhatsApp.
 *
 * Props:
 *   existingUrl   {string|null}   — URL relativa del audio ya guardado en BD
 *   uploading     {boolean}       — true mientras el padre sube el audio al server
 *   onRecorded    {(Blob) => void} — el padre decide si sube ahora o al guardar
 *   onDelete      {() => void}    — el padre llama DELETE al endpoint
 *   onOpenBrowser {() => void}    — abre el modal del banco de audios
 */
export default function AudioRecorder({ existingUrl, uploading, onRecorded, onDelete, onOpenBrowser }) {
  const [status, setStatus] = useState('idle'); // idle | requesting | recording | recorded
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [micError, setMicError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    setMicError('');
    setStatus('requesting');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setMicError(
        e.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Permite el acceso en los ajustes del navegador.'
          : `No se pudo acceder al micrófono: ${e.message}`,
      );
      setStatus('idle');
      return;
    }

    const mimeType = getBestMimeType();
    const options = mimeType ? { mimeType, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 };
    const mr = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
      const recorded = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
      const url = URL.createObjectURL(recorded);
      setBlob(recorded);
      setPreviewUrl(url);
      setStatus('recorded');
    };

    mr.start(250); // chunk cada 250ms
    setElapsed(0);
    setStatus('recording');

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= 300) { // máximo 5 minutos
          mr.stop();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    setStatus('idle');
  };

  const confirmRecording = () => {
    if (blob) onRecorded(blob);
  };

  // ─── Render ────────────────────────────────────────────────────

  // Si hay audio existente en BD
  if (existingUrl && status === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <audio
          controls
          src={`${BACKEND_BASE}${existingUrl}`}
          style={{ width: '100%', maxWidth: 340, height: 36 }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={startRecording} style={BTN_OUTLINE}>
            Regrabar
          </button>
          {onOpenBrowser && (
            <button type="button" onClick={onOpenBrowser} style={BTN_OUTLINE}>
              Biblioteca de audios
            </button>
          )}
          <button type="button" onClick={onDelete} disabled={uploading} style={BTN_DANGER}>
            Eliminar audio
          </button>
        </div>
        {micError && <p style={{ margin: 0, fontSize: '0.78rem', color: '#dc2626' }}>{micError}</p>}
      </div>
    );
  }

  // Subiendo al servidor
  if (uploading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: '0.85rem' }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ea580c', animation: 'pulse 1s infinite' }} />
        Guardando audio...
      </div>
    );
  }

  // Solicitando permiso
  if (status === 'requesting') {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
        Solicitando permiso de micrófono...
      </p>
    );
  }

  // Grabando
  if (status === 'recording') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%', background: '#dc2626', flexShrink: 0,
          boxShadow: '0 0 0 3px rgba(220,38,38,0.25)',
          animation: 'pulse 1s infinite',
        }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626', minWidth: 40 }}>
          {fmtSeg(elapsed)}
        </span>
        <button type="button" onClick={stopRecording} style={BTN_DANGER}>
          Detener
        </button>
      </div>
    );
  }

  // Grabación lista para confirmar
  if (status === 'recorded' && previewUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <audio
          controls
          src={previewUrl}
          style={{ width: '100%', maxWidth: 340, height: 36 }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={confirmRecording} style={BTN_SUCCESS}>
            Usar este audio
          </button>
          <button type="button" onClick={discardRecording} style={BTN_OUTLINE}>
            Descartar
          </button>
        </div>
      </div>
    );
  }

  // Idle — sin audio
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={startRecording} style={BTN_PRIMARY}>
          Grabar explicación
        </button>
        {onOpenBrowser && (
          <button type="button" onClick={onOpenBrowser} style={BTN_OUTLINE}>
            Biblioteca de audios
          </button>
        )}
        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Máx 5 min · Opus ~32 kbps</span>
      </div>
      {micError && <p style={{ margin: 0, fontSize: '0.78rem', color: '#dc2626' }}>{micError}</p>}
    </div>
  );
}
