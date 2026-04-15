import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function InsightMensualWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getInsightMensual(token)
      .then(setData)
      .catch(() => setData({ testsUltimos30Dias: 0, aciertosUltimos30Dias: 0, notaMediaUltimos30Dias: 0, deltaNota7Dias: 0, tendencia: 'estable' }));
  }, [token]);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Insight mensual</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.testsUltimos30Dias ?? 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tests 30d</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.aciertosUltimos30Dias ?? 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Aciertos 30d</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Number(data?.notaMediaUltimos30Dias ?? 0).toFixed(2)}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Nota media 30d</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Number(data?.deltaNota7Dias ?? 0).toFixed(2)}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Delta 7d</span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendencia === 'subiendo' && 'Tu nota va en tendencia positiva.'}
        {data?.tendencia === 'bajando' && 'Conviene reforzar temas débiles esta semana.'}
        {(!data?.tendencia || data?.tendencia === 'estable') && 'Mantén la constancia para subir tu media.'}
      </p>
    </div>
  );
}
