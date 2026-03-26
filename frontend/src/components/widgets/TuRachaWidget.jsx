import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function TuRachaWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getRacha(token)
      .then(setData)
      .catch(() => setData({ rachaActual: 0, mejorRacha: 0, estudioHoy: false, actividad7Dias: [] }));
  }, [token]);

  const diasActivos7 = data?.actividad7Dias?.filter((d) => d.activo).length || 0;

  return (
    <section style={SECTION}>
      <h2>Tu racha</h2>
      <p>
        <strong>{data?.rachaActual ?? 0} días</strong> seguidos
      </p>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Mejor racha: {data?.mejorRacha ?? 0} días · Últimos 7 días activos: {diasActivos7}/7
      </p>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {data?.estudioHoy ? 'Racha activa' : 'No rompas tu racha de estudio'}
      </p>
    </section>
  );
}
