import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

export default function EvolucionSection() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    testApi.evolucionStats(token, 30)
      .then((d) => { if (!cancelled) setData(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading || !data || data.length < 2) return null;

  return (
    <div style={{ marginTop: '1.5rem', background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h3>Evolución (últimos {data.length} tests)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Modo</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e, i) => (
              <tr key={i}>
                <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{data.length - i}</td>
                <td>{new Date(e.fecha).toLocaleDateString('es-ES')}</td>
                <td>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                    {e.tipoTest ?? '—'}
                  </span>
                </td>
                <td>
                  <strong style={{ color: Number(e.nota) >= 5 ? '#22c55e' : '#ef4444' }}>
                    {Number(e.nota).toFixed(2)}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
