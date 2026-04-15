import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function TuNivelWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getGamificacion(token)
      .then(setData)
      .catch(() => setData({ xpTotal: 0, nivelActual: 1, xpSiguienteNivel: 100, progresoNivel: 0 }));
  }, [token]);

  const xpNivelBase = Math.max(0, (Number(data?.nivelActual || 1) - 1) * 100);
  const xpEnNivel = Math.max(0, Number(data?.xpTotal || 0) - xpNivelBase);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Tu nivel</h2>
      <p>
        Nivel <strong>{data?.nivelActual ?? 1}</strong> · <strong>{data?.xpTotal ?? 0} XP</strong>
      </p>
      <div style={{ background: '#e5e7eb', borderRadius: 999, height: 10, overflow: 'hidden', margin: '8px 0' }}>
        <div style={{ width: `${Math.min(xpEnNivel, 100)}%`, height: '100%', background: '#1d4ed8', borderRadius: 999, transition: 'width .4s' }} />
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
        Siguiente nivel: {data?.xpSiguienteNivel ?? 100} XP
      </p>
    </div>
  );
}
