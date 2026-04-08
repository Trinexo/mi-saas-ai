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
  const [rachaTemas, setRachaTemas] = useState(null);

  useEffect(() => {
    let cancelled = false;
    testApi.getRachaTemas(token)
      .then((data) => { if (!cancelled) setRachaTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setRachaTemas([]); });
    return () => { cancelled = true; };
  }, [token]);

  if (!rachaTemas || rachaTemas.length === 0) return null;

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Racha por tema</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>D\u00edas consecutivos practicando cada tema</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rachaTemas.slice(0, 15).map((t) => (
          <div key={t.temaId} style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9',
          }}>
            <RachaBadge racha={t.rachaActual} />
            <div style={{ flex: 1, minWidth: 140 }}>
              <Link to={`/tema/${t.temaId}`} style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', textDecoration: 'none' }}>
                {t.temaNombre}
              </Link>
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>{t.materiaNombre}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
              <span>{t.diasActivos} d\u00edas activos</span>
              {t.ultimoDia && <span>\u00daltimo: {t.ultimoDia}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
