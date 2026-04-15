import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function ConsistenciaDiariaWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getConsistenciaDiaria(token)
      .then(setData)
      .catch(() => setData({ diasActivos30: 0, diasInactivos30: 30, porcentajeConstancia: 0, tendenciaConstancia: 'estable' }));
  }, [token]);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Consistencia diaria</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.diasActivos30 ?? 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Días activos (30d)</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.diasInactivos30 ?? 30}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Días inactivos (30d)</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#1d4ed8' }}>{Number(data?.porcentajeConstancia ?? 0).toFixed(2)}%</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Constancia</span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendenciaConstancia === 'mejorando' && 'Tu constancia diaria está subiendo, sigue así.'}
        {data?.tendenciaConstancia === 'empeorando' && 'Recupera hábito con bloques cortos diarios.'}
        {(!data?.tendenciaConstancia || data?.tendenciaConstancia === 'estable') && 'Mantienes un ritmo constante de estudio.'}
      </p>
    </div>
  );
}
