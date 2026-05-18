import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';
import { EmptyState, G, Header, PageShell, Panel, R, B, A, P } from './ProfesorSharedUI';

const TIPO_LABEL = { reporte: 'Reporte', sesion_test: 'Test finalizado' };
const TIPO_COLOR = { reporte: R, sesion_test: B };
const TIPO_ICON = { reporte: '⚠', sesion_test: '✓' };
const ESTADO_COLOR = { abierto: R, en_revision: A, resuelto: G };
const ESTADO_LABEL = { abierto: 'Abierto', en_revision: 'En revisión', resuelto: 'Resuelto' };

function Badge({ text, color }) {
  return (
    <span style={{ background: `${color}18`, color, fontSize: '.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, border: `1px solid ${color}30`, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

function ActivityItem({ item }) {
  const color = TIPO_COLOR[item.tipo] ?? B;
  const isReporte = item.tipo === 'reporte';
  const estadoColor = ESTADO_COLOR[item.estado] ?? G;

  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, color }}>
        {TIPO_ICON[item.tipo] ?? '·'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
          <Badge text={TIPO_LABEL[item.tipo] ?? item.tipo} color={color} />
          {isReporte && item.estado && <Badge text={ESTADO_LABEL[item.estado] ?? item.estado} color={estadoColor} />}
          {!isReporte && item.nota != null && <Badge text={`${Number(item.nota).toFixed(1)} pts`} color={P} />}
        </div>
        <div style={{ fontWeight: 700, fontSize: '.84rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isReporte
            ? item.titulo
            : `Test ${item.titulo ?? ''} · ${item.alumno_nombre ?? 'Alumno'}`}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.75rem', color: '#64748b' }}>{item.oposicion_nombre}</span>
          {isReporte && item.alumno_nombre && (
            <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>por {item.alumno_nombre}</span>
          )}
          {!isReporte && item.aciertos != null && (
            <span style={{ fontSize: '.75rem', color: '#64748b' }}>
              <span style={{ color: G, fontWeight: 700 }}>✓{item.aciertos}</span>
              {' '}
              <span style={{ color: R, fontWeight: 700 }}>✗{item.errores ?? 0}</span>
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: '.72rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

const INPUT_STYLE = {
  height: 38,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#fff',
  padding: '0 12px',
  color: '#0f172a',
  fontSize: '.82rem',
};

export default function ProfesorActividadPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [oposiciones, setOposiciones] = useState([]);
  const [filters, setFilters] = useState({ tipo: '', oposicion_id: '', desde: '', hasta: '', page: 1 });

  useEffect(() => {
    profesorApi.getWorkspaceOposiciones(token)
      .then((res) => setOposiciones(res?.items ?? []))
      .catch(() => setOposiciones([]));
  }, [token]);

  const fetchFeed = useCallback(() => {
    setLoading(true);
    const query = { page: filters.page, page_size: 25 };
    if (filters.tipo) query.tipo = filters.tipo;
    if (filters.oposicion_id) query.oposicion_id = filters.oposicion_id;
    if (filters.desde) query.desde = new Date(filters.desde).toISOString();
    if (filters.hasta) {
      const d = new Date(filters.hasta);
      d.setHours(23, 59, 59);
      query.hasta = d.toISOString();
    }
    profesorApi.getWorkspaceActividad(token, query)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false));
  }, [token, filters]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <PageShell>
      <Header title="Actividad" subtitle="Historial de tests finalizados y reportes de tus alumnos." />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <select
          value={filters.tipo}
          onChange={(e) => setFilter('tipo', e.target.value)}
          style={{ ...INPUT_STYLE, minWidth: 160 }}
        >
          <option value="">Todos los tipos</option>
          <option value="sesion_test">Tests finalizados</option>
          <option value="reporte">Reportes</option>
        </select>

        <select
          value={filters.oposicion_id}
          onChange={(e) => setFilter('oposicion_id', e.target.value)}
          style={{ ...INPUT_STYLE, minWidth: 200 }}
        >
          <option value="">Todas las oposiciones</option>
          {oposiciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.desde}
          onChange={(e) => setFilter('desde', e.target.value)}
          style={INPUT_STYLE}
        />
        <input
          type="date"
          value={filters.hasta}
          onChange={(e) => setFilter('hasta', e.target.value)}
          style={INPUT_STYLE}
        />

        {(filters.tipo || filters.oposicion_id || filters.desde || filters.hasta) && (
          <button
            type="button"
            onClick={() => setFilters({ tipo: '', oposicion_id: '', desde: '', hasta: '', page: 1 })}
            style={{ ...INPUT_STYLE, cursor: 'pointer', color: '#64748b', padding: '0 14px' }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <Panel
        title={loading ? 'Cargando...' : `${total} evento${total !== 1 ? 's' : ''}`}
        subtitle="Tests finalizados y reportes de preguntas de tus alumnos"
      >
        {!loading && items.length === 0 && (
          <EmptyState
            title="Sin actividad registrada"
            text="Cuando tus alumnos completen tests o reporten preguntas aparecerá aquí."
          />
        )}

        {items.map((item) => (
          <ActivityItem key={`${item.tipo}-${item.id}`} item={item} />
        ))}

        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              style={{ height: 34, padding: '0 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', fontSize: '.82rem', opacity: filters.page <= 1 ? 0.5 : 1 }}
            >
              ← Anterior
            </button>
            <span style={{ height: 34, lineHeight: '34px', fontSize: '.82rem', color: '#64748b', padding: '0 10px' }}>
              Página {filters.page} de {pages}
            </span>
            <button
              type="button"
              disabled={filters.page >= pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              style={{ height: 34, padding: '0 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: filters.page >= pages ? 'not-allowed' : 'pointer', fontSize: '.82rem', opacity: filters.page >= pages ? 0.5 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
