import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

const CARD_STYLE = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '1rem 1.25rem',
  textAlign: 'center',
  minWidth: 90,
  flex: 1,
};

const BIG_NUM = { fontSize: '2rem', fontWeight: 700, color: '#1d4ed8', lineHeight: 1.2 };
const LABEL = { fontSize: '0.75rem', color: '#6b7280', marginTop: 4 };

export default function DashboardWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getDashboard(token).then((res) => {
      if (res?.data) setData(res.data);
    });
  }, [token]);

  if (!data) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Resumen de actividad</h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={CARD_STYLE}>
          <div style={BIG_NUM}>{data.totalTests}</div>
          <div style={LABEL}>Tests completados</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={BIG_NUM}>{data.notaMedia}</div>
          <div style={LABEL}>Nota media</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={BIG_NUM}>{data.mejorSimulacro ?? '—'}</div>
          <div style={LABEL}>Mejor simulacro</div>
        </div>
        <Link to="/progreso" style={{ ...CARD_STYLE, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ ...BIG_NUM, color: data.pendientesRepaso > 0 ? '#dc2626' : '#1d4ed8' }}>{data.pendientesRepaso}</div>
          <div style={LABEL}>Pendientes de repaso ↗</div>
        </Link>
        <Link to="/marcadas" style={{ ...CARD_STYLE, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={BIG_NUM}>{data.totalMarcadas}</div>
          <div style={LABEL}>Preguntas marcadas ↗</div>
        </Link>
      </div>
    </div>
  );
}
