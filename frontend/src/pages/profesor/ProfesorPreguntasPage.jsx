import { useEffect, useState, useCallback } from 'react';
import { getErrorMessage } from '../../services/api';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';

const TH = { textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const TD = { padding: '10px 12px', fontSize: '0.85rem', color: '#111827', borderBottom: '1px solid #f3f4f6' };

export default function ProfesorPreguntasPage() {
  const { token } = useAuth();

  const [preguntas, setPreguntas] = useState([]);
  const [total, setTotal] = useState(0);
  const [oposiciones, setOposiciones] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    oposicion_id: '',
    q: '',
    page: 1,
    page_size: 15,
  });

  /* ---- cargar oposiciones para dropdown ---- */
  useEffect(() => {
    profesorApi.getMisOposiciones(token).then(setOposiciones).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- cargar preguntas ---- */
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const query = {};
    if (filters.oposicion_id) query.oposicion_id = filters.oposicion_id;
    if (filters.q) query.q = filters.q;
    query.page = filters.page;
    query.page_size = filters.page_size;

    profesorApi.getMisPreguntas(token, query)
      .then((res) => {
        setPreguntas(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / filters.page_size));

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, page: 1, [key]: value }));

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
        Mis preguntas
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar…"
          value={filters.q}
          onChange={(e) => updateFilter('q', e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem', flex: '1 1 200px' }}
        />
        <select
          value={filters.oposicion_id}
          onChange={(e) => updateFilter('oposicion_id', e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
        >
          <option value="">Todas las oposiciones</option>
          {oposiciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: '0.85rem', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={TH}>Enunciado</th>
              <th style={TH}>Oposición</th>
              <th style={TH}>Tema</th>
              <th style={TH}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#9ca3af' }}>Cargando…</td></tr>
            )}
            {!loading && preguntas.length === 0 && (
              <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#9ca3af' }}>Sin resultados</td></tr>
            )}
            {!loading && preguntas.map((p) => (
              <tr key={p.id}>
                <td style={{ ...TD, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.enunciado?.substring(0, 90)}{(p.enunciado?.length ?? 0) > 90 ? '…' : ''}
                </td>
                <td style={TD}>{p.oposicion_nombre ?? '—'}</td>
                <td style={TD}>{p.tema_nombre ?? '—'}</td>
                <td style={{ ...TD, fontSize: '0.78rem', color: '#6b7280' }}>
                  {p.creado_en ? new Date(p.creado_en).toLocaleDateString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, fontSize: '0.85rem' }}>
          <button
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: filters.page <= 1 ? 'default' : 'pointer', opacity: filters.page <= 1 ? 0.4 : 1 }}
          >
            ← Anterior
          </button>
          <span style={{ color: '#6b7280' }}>
            Pág {filters.page} / {totalPages} · {total} preguntas
          </span>
          <button
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: filters.page >= totalPages ? 'default' : 'pointer', opacity: filters.page >= totalPages ? 0.4 : 1 }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
