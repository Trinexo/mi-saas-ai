import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

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

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Racha por tema</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>Días consecutivos practicando cada tema</p>

      {rachaTemas === null ? (
        <p style={{ color: '#aaa' }}>Cargando…</p>
      ) : rachaTemas.length === 0 ? (
        <p style={{ color: '#aaa' }}>Aún no has practicado ningún tema.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Tema</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Materia</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Racha actual</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Días activos</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Último día</th>
              </tr>
            </thead>
            <tbody>
              {rachaTemas.slice(0, 15).map((t) => {
                const rachaColor = t.rachaActual >= 7 ? '#22c55e' : t.rachaActual >= 3 ? '#f59e0b' : '#64748b';
                return (
                  <tr key={t.temaId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '9px 12px', maxWidth: 240 }}>
                      <Link to={`/tema/${t.temaId}`} style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}>{t.temaNombre}</Link>
                    </td>
                    <td style={{ padding: '9px 12px', color: '#666', fontSize: 13 }}>{t.materiaNombre}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${rachaColor}18`, color: rachaColor, fontWeight: 700, borderRadius: 20, padding: '2px 10px', fontSize: 13 }}>
                        🔥 {t.rachaActual}d
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: '#555' }}>{t.diasActivos}</td>
                    <td style={{ padding: '9px 12px', color: '#888', fontSize: 13 }}>{t.ultimoDia ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
