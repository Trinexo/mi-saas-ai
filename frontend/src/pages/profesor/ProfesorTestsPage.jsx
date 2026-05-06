import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';

const SECTION = {
  background: '#fff', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: 20,
};
const TH = {
  padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280',
  borderBottom: '2px solid #e5e7eb', textAlign: 'left',
  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const TD = {
  padding: '0.6rem 0.75rem', color: '#111827',
  borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
};

const ESTADO_STYLES = {
  pendiente:  { background: '#fef3c7', color: '#92400e' },
  completado: { background: '#dcfce7', color: '#166534' },
  en_curso:   { background: '#eff6ff', color: '#1d4ed8' },
  expirado:   { background: '#f3f4f6', color: '#9ca3af' },
};

export default function ProfesorTestsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await profesorApi.getMisTests(token, {
        q: q || undefined, page, page_size: PAGE_SIZE,
      });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch { setError('No se pudieron cargar los tests.'); }
    finally { setLoading(false); }
  }, [token, q, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatDuracion = (seg) => {
    if (!seg) return '—';
    if (seg < 60) return `${seg}s`;
    return `${Math.round(seg / 60)} min`;
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Mis tests</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
          Tests de práctica que has realizado — {total} en total
        </p>
      </div>

      {/* Filtro */}
      <div style={{ ...SECTION, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 10 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por tipo…"
          style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }} />
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      <div style={SECTION}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando…</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
            <div>Aún no has realizado ningún test de práctica.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Tipo</th>
                  <th style={TH}>Oposición</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Preguntas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Nota</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Aciertos</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Duración</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={TD}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{t.tipo_test ?? '—'}</span>
                    </td>
                    <td style={{ ...TD, color: '#6b7280' }}>{t.oposicion_nombre ?? '—'}</td>
                    <td style={TD}>
                      {t.estado ? (
                        <span style={{ ...(ESTADO_STYLES[t.estado] ?? {}), borderRadius: 12, padding: '2px 10px', fontSize: '0.77rem', fontWeight: 700 }}>
                          {t.estado}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>{t.numero_preguntas ?? '—'}</td>
                    <td style={{ ...TD, textAlign: 'right', fontWeight: t.nota ? 700 : 400, color: t.nota >= 5 ? '#166534' : t.nota ? '#dc2626' : '#6b7280' }}>
                      {t.nota !== null && t.nota !== undefined ? Number(t.nota).toFixed(2) : '—'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      {t.aciertos !== null && t.aciertos !== undefined
                        ? <span style={{ color: '#166534', fontWeight: 600 }}>{t.aciertos} ✓</span>
                        : '—'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right', color: '#6b7280' }}>{formatDuracion(t.duracion_segundos)}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {t.fecha_creacion ? new Date(t.fecha_creacion).toLocaleDateString('es-ES') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>‹</button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
