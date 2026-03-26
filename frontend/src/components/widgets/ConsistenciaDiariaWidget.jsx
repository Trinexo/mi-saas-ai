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
    <section style={SECTION}>
      <h2>Consistencia diaria</h2>
      <ul>
        <li>Días activos (30): <strong>{data?.diasActivos30 ?? 0}</strong></li>
        <li>Días inactivos (30): <strong>{data?.diasInactivos30 ?? 30}</strong></li>
        <li>Constancia: <strong>{Number(data?.porcentajeConstancia ?? 0).toFixed(2)}%</strong></li>
      </ul>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendenciaConstancia === 'mejorando' && 'Tu constancia diaria está subiendo, sigue así.'}
        {data?.tendenciaConstancia === 'empeorando' && 'Recupera hábito con bloques cortos diarios.'}
        {(!data?.tendenciaConstancia || data?.tendenciaConstancia === 'estable') && 'Mantienes un ritmo constante de estudio.'}
      </p>
    </section>
  );
}
