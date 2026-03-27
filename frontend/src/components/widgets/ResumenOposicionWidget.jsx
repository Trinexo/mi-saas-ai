import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

export default function ResumenOposicionWidget() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const prefId = user?.oposicionPreferidaId;
    if (!prefId) { setData(null); return; }
    testApi.getResumenOposicion(token, Number(prefId))
      .then(setData)
      .catch(() => setData(null));
  }, [token, user?.oposicionPreferidaId]);

  if (!data) return null;

  const mc = data.maestria >= 70 ? '#22c55e' : data.maestria >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, borderLeft: `4px solid ${mc}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>Tu oposición</h2>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{data.oposicionNombre}</p>
        </div>
        <a
          href={`/oposicion/${user.oposicionPreferidaId}`}
          onClick={(e) => { e.preventDefault(); navigate(`/oposicion/${user.oposicionPreferidaId}`); }}
          style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Ver detalle →
        </a>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
          <span>Maestría global</span>
          <span style={{ fontWeight: 700, color: mc }}>{data.maestria}%</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${data.maestria}%`, height: '100%', background: mc, borderRadius: 999, transition: 'width .4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            {data.temasPracticados} de {data.totalTemas} temas practicados · {data.porcentajeAcierto}% acierto
          </p>
          <a
            href="/mis-oposiciones"
            onClick={(e) => { e.preventDefault(); navigate('/mis-oposiciones'); }}
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}
          >
            Ver todas →
          </a>
        </div>
      </div>
    </section>
  );
}
