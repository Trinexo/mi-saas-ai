import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

function RachaBadge({ racha }) {
  const color = racha >= 7 ? '#16a34a' : racha >= 3 ? '#d97706' : '#64748b';
  const bg = racha >= 7 ? '#dcfce7' : racha >= 3 ? '#fef3c7' : '#f1f5f9';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: bg, color, fontWeight: 700, borderRadius: 20,
      padding: '3px 10px', fontSize: 13,
    }}>
      {racha > 0 ? '\uD83D\uDD25' : ''} {racha}d
    </span>
  );
}

export default function RachaTemasSection() {
  const { token } = useAuth();
  const [rachaBloques, setRachaBloques] = useState(null);

  useEffect(() => {
    let cancelled = false;
    testApi.getRachaBloques(token)
      .then((data) => { if (!cancelled) setRachaBloques(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setRachaBloques([]); });
    return () => { cancelled = true; };
  }, [token]);

  if (!rachaBloques || rachaBloques.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Racha por bloque</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Días consecutivos practicando cada bloque</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rachaBloques.slice(0, 15).map((t) => (
          <div key={t.bloqueId} style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '10px 14px', borderRadius: 8, background: '#f9fafb', border: '1px solid #f1f5f9',
          }}>
            <RachaBadge racha={t.rachaActual} />
            <div style={{ flex: 1, minWidth: 140 }}>
              <Link to={`/bloque/${t.bloqueId}`} style={{ fontWeight: 600, fontSize: 14, color: '#111827', textDecoration: 'none' }}>
                {t.bloqueNombre}
              </Link>
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>{t.temaNombre}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
              <span>{t.diasActivos} días activos</span>
              {t.ultimoDia && <span>Último: {t.ultimoDia}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
