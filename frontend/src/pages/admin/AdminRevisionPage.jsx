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
