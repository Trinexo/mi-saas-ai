import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';

const ESTADO_COLOR = {
  pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  aprobada:  { bg: '#dcfce7', color: '#166534', label: 'Aprobada' },
  rechazada: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazada' },
};

const TH = { padding: '0.5rem 0.75rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', textAlign: 'left' };
const TD = { padding: '0.5rem 0.75rem', color: '#111827', verticalAlign: 'top' };

const OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const MODAL = {
  background: '#fff', borderRadius: 10, padding: '2rem',
  maxWidth: 680, width: '90%', maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};

export default function AdminRevisionPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const loadData = (page = 1) => {
    setLoading(true);
    adminApi
      .listPreguntasSinRevisar(token, { page, page_size: 20 })
      .then((res) => {
        if (res?.data) {
          setItems(res.data.items);
          setPagination(res.data.pagination);
        }
      })
      .catch(() => setError('No se pudo cargar la cola de revisi\u00f3n.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(1); }, [token]);

  const openDetalle = async (preguntaId) => {
    setDetalleLoading(true);
    setDetalle(null);
    try {
      const res = await adminApi.getPregunta(token, preguntaId);
      if (res?.data) setDetalle(res.data);
    } catch {
      setError('No se pudo cargar el detalle de la pregunta.');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleDecision = async (preguntaId, estado) => {
    setUpdating(preguntaId);
    try {
      await adminApi.updatePreguntaEstado(token, preguntaId, estado);
      setItems((prev) => prev.filter((p) => p.id !== preguntaId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setDetalle(null);
    } catch {
      setError('No se pudo actualizar el estado de la pregunta.');
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Cola de revisi\u00f3n</h2>

      {error && <p style={{ color: '#c00' }}>{error}</p>}

      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Preguntas en estado <strong>pendiente</strong> que requieren revisi\u00f3n antes de ser publicadas.
        Total pendientes: <strong>{pagination.total}</strong>
      </p>

      {loading && <p style={{ color: '#6b7280' }}>Cargando cola de revisi\u00f3n...</p>}

      {!loading && items.length === 0 && (
        <p style={{ color: '#059669', fontWeight: 600 }}>
          ✓ No hay preguntas pendientes de revisi\u00f3n.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={TH}>ID</th>
                <th style={TH}>Enunciado</th>
                <th style={TH}>Oposici\u00f3n / Materia / Tema</th>
                <th style={TH}>Dificultad</th>
                <th style={{ ...TH, textAlign: 'center' }}>Estado</th>
                <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ ...TD, color: '#6b7280', fontSize: '0.8rem' }}>{p.id}</td>
                  <td style={{ ...TD, maxWidth: 400 }}>
                    <button
                      onClick={() => openDetalle(p.id)}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        textAlign: 'left', color: '#1d4ed8', fontWeight: 500,
                        fontSize: '0.875rem', lineHeight: '1.4',
                        display: '-webkit-box', WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3, overflow: 'hidden',
                      }}
                    >
                      {p.enunciado}
                    </button>
                  </td>
                  <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>
                    <div>{p.oposicionNombre}</div>
                    <div>{p.materiaNombre}</div>
                    <div style={{ color: '#374151', fontWeight: 500 }}>{p.temaNombre}</div>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{p.nivelDificultad}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span
                      style={{
                        background: ESTADO_COLOR[p.estado]?.bg ?? '#f3f4f6',
                        color: ESTADO_COLOR[p.estado]?.color ?? '#374151',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {ESTADO_COLOR[p.estado]?.label ?? p.estado}
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => openDetalle(p.id)}
                        style={{
                          padding: '4px 10px', background: '#f3f4f6', color: '#374151',
                          border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.8rem',
                        }}
                      >
                        Ver
                      </button>
                      <button
                        disabled={updating === p.id}
                        onClick={() => handleDecision(p.id, 'aprobada')}
                        style={{
                          padding: '4px 12px',
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: updating === p.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          opacity: updating === p.id ? 0.6 : 1,
                        }}
                      >
                        Aprobar
                      </button>
                      <button
                        disabled={updating === p.id}
                        onClick={() => handleDecision(p.id, 'rechazada')}
                        style={{
                          padding: '4px 12px',
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: updating === p.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          opacity: updating === p.id ? 0.6 : 1,
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.25rem' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadData(pagination.page - 1)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            \u2190 Anterior
          </button>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            P\u00e1gina {pagination.page} de {totalPages}
          </span>
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => loadData(pagination.page + 1)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            Siguiente \u2192
          </button>
        </div>
      )}

      {(detalleLoading || detalle) && (
        <div style={OVERLAY} onClick={() => setDetalle(null)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            {detalleLoading && (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>Cargando detalle...</p>
            )}
            {detalle && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>
                    Detalle de pregunta #{detalle.id}
                  </h3>
                  <button
                    onClick={() => setDetalle(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
                    aria-label="Cerrar"
                  >
                    &#x2715;
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      background: ESTADO_COLOR[detalle.estado]?.bg ?? '#f3f4f6',
                      color: ESTADO_COLOR[detalle.estado]?.color ?? '#374151',
                      padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    {ESTADO_COLOR[detalle.estado]?.label ?? detalle.estado}
                  </span>
                  {detalle.nivel_dificultad && (
                    <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.8rem' }}>
                      Dificultad: {detalle.nivel_dificultad}
                    </span>
                  )}
                </div>

                <p style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: '1.5', marginBottom: '1rem', color: '#111827' }}>
                  {detalle.enunciado}
                </p>

                {detalle.opciones && detalle.opciones.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {detalle.opciones.map((op) => (
                      <li
                        key={op.id}
                        style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: 6,
                          border: op.correcta ? '1.5px solid #059669' : '1px solid #e5e7eb',
                          background: op.correcta ? '#f0fdf4' : '#fafafa',
                          color: op.correcta ? '#166534' : '#374151',
                          fontWeight: op.correcta ? 600 : 400,
                          fontSize: '0.875rem',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                      >
                        {op.correcta && <span style={{ fontSize: '0.75rem' }}>&#10003;</span>}
                        {op.texto}
                      </li>
                    ))}
                  </ul>
                )}

                {detalle.explicacion && (
                  <div style={{ background: '#f9fafb', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Explicaci\u00f3n:</strong> {detalle.explicacion}
                  </div>
                )}

                {detalle.referencia_normativa && (
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
                    <strong>Referencia:</strong> {detalle.referencia_normativa}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button
                    disabled={updating === detalle.id}
                    onClick={() => handleDecision(detalle.id, 'rechazada')}
                    style={{
                      padding: '0.5rem 1.25rem', background: '#dc2626', color: '#fff',
                      border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                      opacity: updating === detalle.id ? 0.6 : 1,
                    }}
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={updating === detalle.id}
                    onClick={() => handleDecision(detalle.id, 'aprobada')}
                    style={{
                      padding: '0.5rem 1.25rem', background: '#059669', color: '#fff',
                      border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                      opacity: updating === detalle.id ? 0.6 : 1,
                    }}
                  >
                    Aprobar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}


const ESTADO_COLOR = {
  pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  aprobada:  { bg: '#dcfce7', color: '#166534', label: 'Aprobada' },
  rechazada: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazada' },
};

const TH = { padding: '0.5rem 0.75rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', textAlign: 'left' };
const TD = { padding: '0.5rem 0.75rem', color: '#111827', verticalAlign: 'top' };

export default function AdminRevisionPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const loadData = (page = 1) => {
    setLoading(true);
    adminApi
      .listPreguntasSinRevisar(token, { page, page_size: 20 })
      .then((res) => {
        if (res?.data) {
          setItems(res.data.items);
          setPagination(res.data.pagination);
        }
      })
      .catch(() => setError('No se pudo cargar la cola de revisión.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(1); }, [token]);

  const handleDecision = async (preguntaId, estado) => {
    setUpdating(preguntaId);
    try {
      await adminApi.updatePreguntaEstado(token, preguntaId, estado);
      setItems((prev) => prev.filter((p) => p.id !== preguntaId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch {
      setError('No se pudo actualizar el estado de la pregunta.');
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Cola de revisión</h2>

      {error && <p style={{ color: '#c00' }}>{error}</p>}

      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Preguntas en estado <strong>pendiente</strong> que requieren revisión antes de ser publicadas.
        Total pendientes: <strong>{pagination.total}</strong>
      </p>

      {loading && <p style={{ color: '#6b7280' }}>Cargando cola de revisión...</p>}

      {!loading && items.length === 0 && (
        <p style={{ color: '#059669', fontWeight: 600 }}>
          ✓ No hay preguntas pendientes de revisión.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={TH}>ID</th>
                <th style={TH}>Enunciado</th>
                <th style={TH}>Oposición / Materia / Tema</th>
                <th style={TH}>Dificultad</th>
                <th style={{ ...TH, textAlign: 'center' }}>Estado</th>
                <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ ...TD, color: '#6b7280', fontSize: '0.8rem' }}>{p.id}</td>
                  <td style={{ ...TD, maxWidth: 400 }}>
                    <span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
                      {p.enunciado}
                    </span>
                  </td>
                  <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>
                    <div>{p.oposicionNombre}</div>
                    <div>{p.materiaNombre}</div>
                    <div style={{ color: '#374151', fontWeight: 500 }}>{p.temaNombre}</div>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{p.nivelDificultad}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span
                      style={{
                        background: ESTADO_COLOR[p.estado]?.bg ?? '#f3f4f6',
                        color: ESTADO_COLOR[p.estado]?.color ?? '#374151',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {ESTADO_COLOR[p.estado]?.label ?? p.estado}
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        disabled={updating === p.id}
                        onClick={() => handleDecision(p.id, 'aprobada')}
                        style={{
                          padding: '4px 12px',
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: updating === p.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          opacity: updating === p.id ? 0.6 : 1,
                        }}
                      >
                        Aprobar
                      </button>
                      <button
                        disabled={updating === p.id}
                        onClick={() => handleDecision(p.id, 'rechazada')}
                        style={{
                          padding: '4px 12px',
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: updating === p.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          opacity: updating === p.id ? 0.6 : 1,
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.25rem' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadData(pagination.page - 1)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Página {pagination.page} de {totalPages}
          </span>
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => loadData(pagination.page + 1)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}
