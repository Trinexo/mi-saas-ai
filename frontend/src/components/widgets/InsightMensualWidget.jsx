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
    <section style={SECTION}>
      <h2>Insight mensual</h2>
      <ul>
        <li>Tests (30 días): <strong>{data?.testsUltimos30Dias ?? 0}</strong></li>
        <li>Aciertos (30 días): <strong>{data?.aciertosUltimos30Dias ?? 0}</strong></li>
        <li>Nota media (30 días): <strong>{Number(data?.notaMediaUltimos30Dias ?? 0).toFixed(2)}</strong></li>
        <li>Delta nota 7d: <strong>{Number(data?.deltaNota7Dias ?? 0).toFixed(2)}</strong></li>
      </ul>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendencia === 'subiendo' && 'Tu nota va en tendencia positiva.'}
        {data?.tendencia === 'bajando' && 'Conviene reforzar temas débiles esta semana.'}
        {(!data?.tendencia || data?.tendencia === 'estable') && 'Mantén la constancia para subir tu media.'}
      </p>
    </section>
  );
}
