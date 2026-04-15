import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function Actividad14Widget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getActividad14Dias(token)
      .then(setData)
      .catch(() => setData({ diasActivos14: 0, estudioHoy: false, actividad14Dias: [] }));
  }, [token]);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Continuidad 14 días</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        Días activos: <strong>{data?.diasActivos14 ?? 0}/14</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, marginBottom: '0.5rem' }}>
        {(data?.actividad14Dias || []).map((dia) => (
          <div
            key={dia.fecha}
            title={`${dia.fecha}: ${dia.tests} test(s)`}
            style={{ height: 14, borderRadius: 4, background: dia.activo ? '#16a34a' : '#e5e7eb' }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {data?.estudioHoy
          ? 'Hoy ya has sumado actividad ✅'
          : 'Haz un test rápido para mantener la racha'}
      </p>
    </div>
  );
}
