import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';

const SECTION = {
  background: '#fff',
  borderRadius: 16,
  padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  border: '1px solid #e5e7eb',
  marginBottom: 20,
};

const TH = {
  padding: '0.5rem 0.75rem',
  fontWeight: 600,
  color: '#6b7280',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'left',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const TD = {
  padding: '0.6rem 0.75rem',
  color: '#111827',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '0.875rem',
};

const ESTADO_STYLES = {
  borrador: { background: '#f3f4f6', color: '#374151' },
  publicado: { background: '#dcfce7', color: '#166534' },
  archivado: { background: '#f3f4f6', color: '#9ca3af' },
};

export default function ProfesorTestsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await profesorApi.getMisTests(token, {
        q: q || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch {
      setError('No se pudieron cargar los tests.');
    } finally {
      setLoading(false);
    }
  }, [token, q, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formatDuracion = (minutos) => (minutos ? `${minutos} min` : '-');
  const formatDificultad = (value) => {
    if (!value) return '-';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    setError('');
    try {
      await profesorApi.deleteMiTest(token, id);
      setItems((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      setError('No se pudo eliminar el test.');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Tests</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
            Tests configurados para tus oposiciones asignadas - {total} en total
          </p>
        </div>
        <Link to="/profesor/tests/nuevo" style={{ background: '#6d28d9', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 800, textDecoration: 'none', fontSize: '.9rem' }}>
          + Nuevo test
        </Link>
      </div>

      <div style={{ ...SECTION, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 10 }}>
        <input
          value={q}
          onChange={(event) => { setQ(event.target.value); setPage(1); }}
          placeholder="Buscar test..."
          style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
        />
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      <div style={SECTION}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>+</div>
            <div>Aún no hay tests configurados para tus oposiciones.</div>
            <Link to="/profesor/tests/nuevo" style={{ display: 'inline-block', marginTop: 16, background: '#6d28d9', color: '#fff', borderRadius: 9, padding: '9px 18px', fontWeight: 800, textDecoration: 'none' }}>
              Crear test
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>Oposición</th>
                  <th style={TH}>Tema</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Preguntas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Dificultad</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Duración</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Actualizado</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((test) => (
                  <tr
                    key={test.id}
                    onMouseEnter={(event) => { event.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = ''; }}
                  >
                    <td style={TD}>
                      <span style={{ fontWeight: 700 }}>{test.nombre ?? '-'}</span>
                      {test.descripcion && (
                        <div style={{ color: '#94a3b8', fontSize: '.75rem', marginTop: 2, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {test.descripcion}
                        </div>
                      )}
                    </td>
                    <td style={{ ...TD, color: '#6b7280' }}>{test.oposicion_nombre ?? '-'}</td>
                    <td style={{ ...TD, color: '#6b7280' }}>{test.temas_resumen ?? test.tema_nombre ?? '-'}</td>
                    <td style={TD}>
                      {test.estado ? (
                        <span style={{ ...(ESTADO_STYLES[test.estado] ?? {}), borderRadius: 12, padding: '2px 10px', fontSize: '0.77rem', fontWeight: 700 }}>
                          {test.estado}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>{test.total_preguntas ?? 0}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#6b7280' }}>{formatDificultad(test.nivel_dificultad)}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#6b7280' }}>{formatDuracion(test.duracion_minutos)}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {test.fecha_actualizacion ? new Date(test.fecha_actualizacion).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                        {confirmDeleteId === test.id ? (
                          <>
                            <span style={{ fontSize: '.78rem', color: '#dc2626', fontWeight: 700 }}>¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(test.id)}
                              disabled={deleting}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontWeight: 800, fontSize: '.78rem', cursor: 'pointer' }}
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 7, padding: '5px 10px', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <Link to={`/profesor/tests/${test.id}/editar`} style={{ border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '6px 10px', fontWeight: 800, fontSize: '.78rem', textDecoration: 'none' }}>
                              Editar
                            </Link>
                            <button
                              onClick={() => setConfirmDeleteId(test.id)}
                              style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 10px', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>
              Anterior
            </button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
