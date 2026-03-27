import { Link } from 'react-router-dom';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ReviewTestInfo({ testInfo }) {
  if (!testInfo) return null;

  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
        {testInfo.tipoTest && (
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600 }}>
            {MODO_LABEL[testInfo.tipoTest] ?? testInfo.tipoTest}
          </span>
        )}
        {testInfo.temaId
          ? <Link to={`/tema/${testInfo.temaId}`} style={{ fontWeight: 600, color: '#374151', textDecoration: 'none' }}>{testInfo.temaNombre}</Link>
          : testInfo.temaNombre && <span style={{ fontWeight: 600, color: '#374151' }}>{testInfo.temaNombre}</span>
        }
        {testInfo.fechaCreacion && (
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {new Date(testInfo.fechaCreacion).toLocaleDateString('es-ES')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {testInfo.nota != null && (
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: Number(testInfo.nota) >= 5 ? '#22c55e' : '#ef4444' }}>
            {Number(testInfo.nota).toFixed(2)}
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#6b7280' }}> / 10</span>
          </span>
        )}
        {formatTime(testInfo.tiempoSegundos) && (
          <span style={{ color: '#6b7280', fontSize: '0.875rem', alignSelf: 'center' }}>
            ⏱ {formatTime(testInfo.tiempoSegundos)}
          </span>
        )}
      </div>
    </div>
  );
}
