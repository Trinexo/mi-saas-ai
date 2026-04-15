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
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Balance de precisión</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{Number(data?.porcentajeAcierto ?? 0).toFixed(2)}%</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Acierto ({data?.aciertosTotales ?? 0})</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{pctError.toFixed(2)}%</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Error ({data?.erroresTotales ?? 0})</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#94a3b8' }}>{pctBlanco.toFixed(2)}%</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Blanco ({data?.blancosTotales ?? 0})</span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {pctBlanco > 20 && 'Reduce blancos con tests más cortos.'}
        {pctBlanco <= 20 && pctError > 35 && 'Conviene reforzar conceptos clave.'}
        {pctBlanco <= 20 && pctError <= 35 && 'Buen equilibrio de respuesta.'}
      </p>
    </div>
  );
}
