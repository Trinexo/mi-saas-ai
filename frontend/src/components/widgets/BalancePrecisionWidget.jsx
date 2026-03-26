import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function BalancePrecisionWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getBalancePrecision(token)
      .then(setData)
      .catch(() => setData({ aciertosTotales: 0, erroresTotales: 0, blancosTotales: 0, porcentajeAcierto: 0, porcentajeError: 0, porcentajeBlanco: 0 }));
  }, [token]);

  const pctBlanco = Number(data?.porcentajeBlanco ?? 0);
  const pctError = Number(data?.porcentajeError ?? 0);

  return (
    <section style={SECTION}>
      <h2>Balance de precisión</h2>
      <ul>
        <li>Acierto: <strong>{Number(data?.porcentajeAcierto ?? 0).toFixed(2)}%</strong> ({data?.aciertosTotales ?? 0})</li>
        <li>Error: <strong>{pctError.toFixed(2)}%</strong> ({data?.erroresTotales ?? 0})</li>
        <li>Blanco: <strong>{pctBlanco.toFixed(2)}%</strong> ({data?.blancosTotales ?? 0})</li>
      </ul>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {pctBlanco > 20 && 'Reduce blancos con tests más cortos.'}
        {pctBlanco <= 20 && pctError > 35 && 'Conviene reforzar conceptos clave.'}
        {pctBlanco <= 20 && pctError <= 35 && 'Buen equilibrio de respuesta.'}
      </p>
    </section>
  );
}
