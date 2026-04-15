import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';

const REPORTE_ESTADO_COLOR = {
  abierto:     { bg: '#fef3c7', color: '#92400e',  label: 'Abierto'     },
  en_revision: { bg: '#eff6ff', color: '#1d4ed8',  label: 'En revisión' },
  resuelto:    { bg: '#dcfce7', color: '#166534',  label: 'Resuelto'    },
  descartado:  { bg: '#f3f4f6', color: '#6b7280',  label: 'Descartado'  },
};

const TH = { padding: '0.5rem 0.75rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', textAlign: 'left' };
const TD = { padding: '0.5rem 0.75rem', color: '#111827', verticalAlign: 'top' };

const OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const MODAL = {
  background: '#fff', borderRadius: 10, padding: '2rem',
  maxWidth: 500, width: '90%', maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};

export default function AdminRevisionPage() {
  const { token } = useAuth();

  const [reportes, setReportes] = useState([]);
  const [reportesPag, setReportesPag] = useState({ page: 1, pageSize: 20, total: 0 });
  const [reportesLoading, setReportesLoading] = useState(false);
  const [reportesError, setReportesError] = useState('');
  const [updatingReporte, setUpdatingReporte] = useState(null);
  const [reporteModal, setReporteModal] = useState(null);
  const [mensajeModal, setMensajeModal] = useState('');

  const loadReportes = (page = 1) => {
    setReportesLoading(true);
    adminApi
      .listReportes(token, { page, page_size: 20 })
      .then((res) => {
        if (res) {
          setReportes(res.items ?? []);
          setReportesPag(res.pagination ?? { page: 1, pageSize: 20, total: res.items?.length ?? 0 });
        }
      })
      .catch(() => setReportesError('No se pudieron cargar los reportes.'))
      .finally(() => setReportesLoading(false));
  };

  useEffect(() => { loadReportes(1); }, [token]);

  const handleReporteEstado = async (reporteId, estado, mensajeAdmin) => {
    setUpdatingReporte(reporteId);
    try {
      await adminApi.updateReporteEstado(token, reporteId, estado, mensajeAdmin || undefined);
      setReportes((prev) => prev.map((r) => r.id === reporteId ? { ...r, estado } : r));
    } catch {
      setReportesError('No se pudo actualizar el estado del reporte.');
    } finally {
      setUpdatingReporte(null);
      setReporteModal(null);
      setMensajeModal('');
    }
  };

  const openReporteModal = (id, estadoPendiente, enunciado) => {
    setMensajeModal('');
    setReporteModal({ id, estadoPendiente, enunciado });
  };

  const reportesTotalPages = Math.ceil((reportesPag.total ?? 0) / (reportesPag.pageSize ?? 20));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>Reportes de usuarios</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          Preguntas reportadas por los usuarios durante los tests
        </p>
      </div>

      {reportesError && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{reportesError}</div>}
      {reportesLoading && <p style={{ color: '#6b7280', padding: '2rem', textAlign: 'center' }}>Cargando reportes...</p>}

      {!reportesLoading && reportes.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '2.5rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
          <p style={{ color: '#059669', fontWeight: 600, margin: 0 }}>No hay reportes de usuarios.</p>
        </div>
      )}

      {!reportesLoading && reportes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>ID</th>
                  <th style={TH}>Pregunta</th>
                  <th style={TH}>Motivo</th>
                  <th style={TH}>Usuario</th>
                  <th style={TH}>Fecha</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Estado</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ ...TD, color: '#6b7280', fontSize: '0.8rem' }}>{r.id}</td>
                    <td style={{ ...TD, maxWidth: 280 }}>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>#{r.pregunta_id}</span>
                      <div style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', lineHeight: '1.4' }}>
                        {r.pregunta_enunciado}
                      </div>
                    </td>
                    <td style={{ ...TD, maxWidth: 220, color: '#374151' }}>{r.motivo}</td>
                    <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>{r.usuario_email}</td>
                    <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(r.fecha_creacion).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <span style={{ background: REPORTE_ESTADO_COLOR[r.estado]?.bg ?? '#f3f4f6', color: REPORTE_ESTADO_COLOR[r.estado]?.color ?? '#374151', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                        {REPORTE_ESTADO_COLOR[r.estado]?.label ?? r.estado}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {r.estado !== 'resuelto' && (
                          <button
                            disabled={updatingReporte === r.id}
                            onClick={() => openReporteModal(r.id, 'resuelto', r.pregunta_enunciado)}
                            style={{ padding: '3px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', opacity: updatingReporte === r.id ? 0.6 : 1 }}
                          >
                            Resolver
                          </button>
                        )}
                        {r.estado !== 'descartado' && (
                          <button
                            disabled={updatingReporte === r.id}
                            onClick={() => openReporteModal(r.id, 'descartado', r.pregunta_enunciado)}
                            style={{ padding: '3px 10px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', opacity: updatingReporte === r.id ? 0.6 : 1 }}
                          >
                            Descartar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportesTotalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <button disabled={reportesPag.page <= 1} onClick={() => loadReportes(reportesPag.page - 1)} style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: '1px solid #e5e7eb', cursor: reportesPag.page <= 1 ? 'not-allowed' : 'pointer', background: '#fff', color: '#374151', fontSize: '0.85rem', opacity: reportesPag.page <= 1 ? 0.5 : 1 }}>← Anterior</button>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', flex: 1, textAlign: 'center' }}>Página {reportesPag.page} de {reportesTotalPages}</span>
              <button disabled={reportesPag.page >= reportesTotalPages} onClick={() => loadReportes(reportesPag.page + 1)} style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: '1px solid #e5e7eb', cursor: reportesPag.page >= reportesTotalPages ? 'not-allowed' : 'pointer', background: '#fff', color: '#374151', fontSize: '0.85rem', opacity: reportesPag.page >= reportesTotalPages ? 0.5 : 1 }}>Siguiente →</button>
            </div>
          )}
        </div>
      )}

      {reporteModal && (
        <div style={OVERLAY}>
          <div style={MODAL}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
              {reporteModal.estadoPendiente === 'resuelto' ? '✅ Marcar como resuelto' : '⚠️ Descartar reporte'}
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4 }}>
              {reporteModal.enunciado?.length > 100 ? reporteModal.enunciado.slice(0, 100) + '…' : reporteModal.enunciado}
            </p>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
              Mensaje para el usuario <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
            </label>
            <textarea
              value={mensajeModal}
              onChange={(e) => setMensajeModal(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Explica al usuario el motivo de la resolución o cualquier información relevante..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', resize: 'vertical', color: '#111827', outline: 'none' }}
            />
            <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'right' }}>{mensajeModal.length}/1000</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setReporteModal(null); setMensajeModal(''); }}
                style={{ padding: '0.5rem 1.25rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                disabled={updatingReporte === reporteModal.id}
                onClick={() => handleReporteEstado(reporteModal.id, reporteModal.estadoPendiente, mensajeModal.trim())}
                style={{ padding: '0.5rem 1.25rem', background: reporteModal.estadoPendiente === 'resuelto' ? '#059669' : '#6b7280', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: updatingReporte === reporteModal.id ? 0.6 : 1 }}
              >
                {updatingReporte === reporteModal.id ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

