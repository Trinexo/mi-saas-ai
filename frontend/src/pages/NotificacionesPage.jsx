import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth.jsx';
import { notificacionesApi } from '../services/notificacionesApi';

const TIPO_ICON = {
  reporte_actualizado: '📋',
  sistema:             '🔔',
};

const TIPO_COLOR = {
  reporte_actualizado: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
  sistema:             { bg: '#f9fafb', border: '#e5e7eb', color: '#374151' },
};

export default function NotificacionesPage() {
  const { token } = useAuth();
  const [items, setItems]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = (page = 1, noLeidas = soloNoLeidas) => {
    setLoading(true);
    notificacionesApi
      .list(token, { page, page_size: 20, solo_no_leidas: noLeidas ? 'true' : 'false' })
      .then((res) => {
        if (res) {
          setItems(res.items ?? []);
          setPagination(res.pagination ?? { page, pageSize: 20, total: 0 });
        }
      })
      .catch(() => setError('No se pudieron cargar las notificaciones.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, soloNoLeidas); }, [token]);

  const handleToggleFiltro = () => {
    const nuevo = !soloNoLeidas;
    setSoloNoLeidas(nuevo);
    load(1, nuevo);
  };

  const handleMarcarLeida = async (id) => {
    await notificacionesApi.marcarLeida(token, id).catch(() => {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
  };

  const handleMarcarTodas = async () => {
    setMarkingAll(true);
    await notificacionesApi.marcarTodasLeidas(token).catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
    setMarkingAll(false);
  };

  const totalPages = Math.ceil((pagination.total ?? 0) / (pagination.pageSize ?? 20));
  const noLeidasCount = items.filter((n) => !n.leida).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>Notificaciones</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Actualizaciones sobre tus reportes y actividad
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleToggleFiltro}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer',
              background: soloNoLeidas ? '#eff6ff' : '#fff', color: soloNoLeidas ? '#1d4ed8' : '#374151',
              fontWeight: soloNoLeidas ? 600 : 400, fontSize: '0.85rem',
            }}
          >
            {soloNoLeidas ? '🔵 Solo no leídas' : 'Todas'}
          </button>
          {noLeidasCount > 0 && (
            <button
              disabled={markingAll}
              onClick={handleMarcarTodas}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: '#1d4ed8', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                opacity: markingAll ? 0.6 : 1,
              }}
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && (
        <p style={{ color: '#6b7280', padding: '2rem', textAlign: 'center' }}>Cargando notificaciones...</p>
      )}

      {!loading && items.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔔</div>
          <p style={{ color: '#374151', fontWeight: 600, margin: 0 }}>No tienes notificaciones</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 6 }}>
            {soloNoLeidas ? 'No hay notificaciones sin leer.' : 'Aquí aparecerán las actualizaciones sobre tus reportes.'}
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((n) => {
            const estilo = TIPO_COLOR[n.tipo] ?? TIPO_COLOR.sistema;
            const icono  = TIPO_ICON[n.tipo]  ?? '🔔';
            return (
              <div
                key={n.id}
                style={{
                  background: n.leida ? '#fff' : estilo.bg,
                  border: `1px solid ${n.leida ? '#e5e7eb' : estilo.border}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  boxShadow: n.leida ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1.3 }}>{icono}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: n.leida ? '#374151' : estilo.color, fontSize: '0.9rem' }}>
                      {n.titulo}
                    </span>
                    {!n.leida && (
                      <span style={{ background: '#1d4ed8', color: '#fff', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px' }}>
                        NUEVA
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(n.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5' }}>
                    {n.mensaje}
                  </p>
                  {n.datos_extra?.mensajeAdmin && (
                    <blockquote style={{
                      margin: '0.6rem 0 0', padding: '0.5rem 0.75rem',
                      borderLeft: '3px solid #6366f1', background: '#f5f3ff',
                      borderRadius: '0 6px 6px 0', fontSize: '0.85rem', color: '#4338ca',
                      fontStyle: 'italic', lineHeight: '1.5',
                    }}>
                      💬 <strong>Mensaje del equipo:</strong> {n.datos_extra.mensajeAdmin}
                    </blockquote>
                  )}
                </div>
                {!n.leida && (
                  <button
                    onClick={() => handleMarcarLeida(n.id)}
                    title="Marcar como leída"
                    style={{
                      background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
                      padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem', color: '#6b7280',
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}
                  >
                    ✓ Leída
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 20, justifyContent: 'center' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: '1px solid #e5e7eb', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', background: '#fff', color: '#374151', fontSize: '0.85rem', opacity: pagination.page <= 1 ? 0.5 : 1 }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {pagination.page} / {totalPages}
          </span>
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => load(pagination.page + 1)}
            style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: '1px solid #e5e7eb', cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer', background: '#fff', color: '#374151', fontSize: '0.85rem', opacity: pagination.page >= totalPages ? 0.5 : 1 }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
