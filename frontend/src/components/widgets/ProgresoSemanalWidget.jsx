import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function ProgresoSemanalWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getProgresoSemanal(token)
      .then(setData)
      .catch(() => setData({ dias: [], testsSemana: 0, notaMediaSemana: 0 }));
  }, [token]);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Progreso semanal</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        Tests semana: <strong>{data?.testsSemana ?? 0}</strong> · Nota media: <strong>{Number(data?.notaMediaSemana ?? 0).toFixed(2)}</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: '0.5rem' }}>
        {(data?.dias || []).map((d) => {
          const intensity = Math.min(1, (Number(d.tests || 0) / 4));
          const alpha = 0.15 + (intensity * 0.75);
          return (
            <div
              key={d.fecha}
              title={`${d.fecha}: ${d.tests} test(s)`}
              style={{ height: 16, borderRadius: 4, background: `rgba(22, 163, 74, ${alpha})` }}
            />
          );
        })}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {(data?.testsSemana ?? 0) === 0
          ? 'Empieza hoy con un test rápido.'
          : 'Has mantenido actividad esta semana.'}
      </p>
    </div>
  );
}
