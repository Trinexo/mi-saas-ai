import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';
import { getErrorMessage } from '../../services/api';

function formatTime(segundos) {
  if (!segundos) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ResumenGlobalSection() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    testApi
      .userStats(token)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e, 'No se pudo cargar el progreso')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (error) return (
    <div style={{ display: 'flex', gap: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '8px 14px', marginBottom: 16 }}>
      <span>⚠️</span>{error}
    </div>
  );
  if (loading || !stats) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const totalRespondidas = stats.aciertos + stats.errores + stats.blancos;
  const pctAcierto = totalRespondidas > 0
    ? Math.round((stats.aciertos / totalRespondidas) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
        {[
          { value: stats.totalTests, label: 'Tests realizados' },
          { value: stats.aciertos, label: 'Aciertos' },
          { value: stats.errores, label: 'Errores' },
          { value: stats.blancos, label: 'En blanco' },
          { value: Number(stats.notaMedia).toFixed(2), label: 'Nota media' },
          { value: formatTime(stats.tiempoMedio), label: 'Tiempo medio/test' },
        ].map(({ value, label }) => (
          <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 18px', textAlign: 'center', minWidth: 110, flex: '1 1 110px' }}>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 800, color: '#111827' }}>{value}</span>
            <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 6 }}>
          Tasa de acierto global: {pctAcierto}%
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: 999, height: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${pctAcierto}%`,
            height: '100%',
            background: pctAcierto >= 70 ? '#22c55e' : pctAcierto >= 50 ? '#f59e0b' : '#ef4444',
            borderRadius: 999,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>
    </div>
  );
}
