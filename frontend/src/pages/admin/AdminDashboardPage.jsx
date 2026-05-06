import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';
import { useRevision } from '../../state/revisionContext.jsx';

const P = '#7c3aed';
const CARD = {
  background: '#fff', borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
};
const PIE_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b'];

const KPI_CFG = [
  { key: 'totalUsuarios',   icon: '👥', label: 'Usuarios activos',  color: P,         bg: '#f5f3ff' },
  { key: 'totalTests',      icon: '✅', label: 'Tests realizados',  color: '#2563eb', bg: '#eff6ff' },
  { key: 'testsEstaSemana', icon: '📅', label: 'Tests esta semana', color: '#059669', bg: '#f0fdf4' },
  {
    key: 'notaMediaGlobal',
    icon: '⭐',
    label: 'Media de aciertos',
    color: '#d97706',
    bg: '#fffbeb',
    fmt: (v) => v != null ? `${Number(v).toFixed(1)}%` : '—',
  },
];

const TIPO_MAP = {
  usuario_nuevo: { icon: '👤', color: '#10b981', bg: '#d1fae5' },
  test_creado:   { icon: '📝', color: '#3b82f6', bg: '#dbeafe' },
  simulacro:     { icon: '📋', color: '#f59e0b', bg: '#fef3c7' },
  pregunta:      { icon: '✏️', color: '#6b7280', bg: '#f3f4f6' },
  reporte:       { icon: '⚠️', color: '#ef4444', bg: '#fee2e2' },
  default:       { icon: '🔔', color: P,         bg: '#ede9fe' },
};

function tipoStyle(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('usuario') || t.includes('registro')) return TIPO_MAP.usuario_nuevo;
  if (t.includes('test'))      return TIPO_MAP.test_creado;
  if (t.includes('simulacro')) return TIPO_MAP.simulacro;
  if (t.includes('pregunta'))  return TIPO_MAP.pregunta;
  if (t.includes('reporte') || t.includes('comentario')) return TIPO_MAP.reporte;
  return TIPO_MAP.default;
}

function relTime(fecha) {
  if (!fecha) return '';
  const d = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
  if (d < 1) return 'ahora';
  if (d < 60) return `${d} min`;
  if (d < 1440) return `${Math.round(d / 60)}h`;
  return `${Math.round(d / 1440)}d`;
}

const KPI_CFG = [
  { key: 'totalUsuarios',   icon: '👥', label: 'Usuarios activos',  color: P,         bg: '#f5f3ff' },
  { key: 'totalTests',      icon: '✅', label: 'Tests realizados',  color: '#2563eb', bg: '#eff6ff' },
  { key: 'testsEstaSemana', icon: '📅', label: 'Tests esta semana', color: '#059669', bg: '#f0fdf4' },
  {
    key: 'notaMediaGlobal',
    icon: '⭐',
    label: 'Media de aciertos',
    color: '#d97706',
    bg: '#fffbeb',
    fmt: (v) => v != null ? `${Number(v).toFixed(1)}%` : '—',
  },
];

const TIPO_MAP = {
  usuario_nuevo: { icon: '👤', color: '#10b981', bg: '#d1fae5' },
  test_creado:   { icon: '📝', color: '#3b82f6', bg: '#dbeafe' },
  simulacro:     { icon: '📋', color: '#f59e0b', bg: '#fef3c7' },
  pregunta:      { icon: '✏️', color: '#6b7280', bg: '#f3f4f6' },
  reporte:       { icon: '⚠️', color: '#ef4444', bg: '#fee2e2' },
  default:       { icon: '🔔', color: P,         bg: '#ede9fe' },
};

function tipoStyle(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('usuario') || t.includes('registro')) return TIPO_MAP.usuario_nuevo;
  if (t.includes('test'))      return TIPO_MAP.test_creado;
  if (t.includes('simulacro')) return TIPO_MAP.simulacro;
  if (t.includes('pregunta'))  return TIPO_MAP.pregunta;
  if (t.includes('reporte') || t.includes('comentario')) return TIPO_MAP.reporte;
  return TIPO_MAP.default;
}

function relTime(fecha) {
  if (!fecha) return '';
  const d = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
  if (d < 1) return 'ahora';
  if (d < 60) return `${d} min`;
  if (d < 1440) return `${Math.round(d / 60)}h`;
  return `${Math.round(d / 1440)}d`;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { reportesAbiertos } = useRevision();

  const [stats,             setStats]             = useState(null);
  const [evolucion,         setEvolucion]         = useState([]);
  const [distribucion,      setDistribucion]      = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [topOposiciones,    setTopOposiciones]    = useState([]);
  const [periodo,           setPeriodo]           = useState('30');
  const [error,             setError]             = useState('');

  useEffect(() => {
    if (!token) return;

    adminApi.getAdminStats(token)
      .then((r) => { if (r) setStats(r); })
      .catch(() => setError('No se pudieron cargar las estadísticas.'));

    adminApi.getActividadReciente(token, 15)
      .then((r) => setActividadReciente(r?.items ?? (Array.isArray(r) ? r : [])))
      .catch(() => setActividadReciente([]));

    adminApi.getTopOposiciones(token, 5)
      .then((r) => setTopOposiciones(r?.items ?? (Array.isArray(r) ? r : [])))
      .catch(() => setTopOposiciones([]));

    adminApi.getEvolucionUsuarios(token, 30)
      .then((r) => setEvolucion(Array.isArray(r) ? r : (r?.items ?? [])))
      .catch(() => setEvolucion([]));

    adminApi.getDistribucionContenido(token)
      .then((r) => {
        if (!r) return;
        const d = [
          { name: 'Preguntas',  value: Number(r.preguntas  || 0) },
          { name: 'Tests',      value: Number(r.tests      || 0) },
          { name: 'Simulacros', value: Number(r.simulacros || 0) },
          { name: 'Temario',    value: Number(r.temario    || 0) },
        ].filter((x) => x.value > 0);
        setDistribucion(d);
      })
      .catch(() => setDistribucion([]));
  }, [token]);

  const totalDist = distribucion.reduce((a, b) => a + b.value, 0);

  return (
    <div style={{ padding: 28 }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Resumen general de la plataforma</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: '0.82rem', color: '#374151' }}>
            <span>📅</span>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', cursor: 'pointer', color: '#374151', outline: 'none' }}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>
          {reportesAbiertos > 0 && (
            <Link
              to="/admin/revision"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none' }}
            >
              {reportesAbiertos}
            </Link>
          )}
          <Link
            to="/admin/preguntas"
            style={{ background: P, color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            + Crear
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {reportesAbiertos > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <span style={{ color: '#92400e', fontWeight: 600, fontSize: '0.88rem' }}>
            {reportesAbiertos} reporte{reportesAbiertos !== 1 ? 's' : ''} sin resolver
          </span>
          <Link to="/admin/revision" style={{ marginLeft: 'auto', background: '#f59e0b', color: '#fff', padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem' }}>
            Revisar
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {KPI_CFG.map(({ key, icon, label, color, bg, fmt }) => (
          <div key={key} style={{ ...CARD, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  {stats == null
                    ? <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Cargando…</span>
                    : (fmt ? fmt(stats[key]) : (stats[key] ?? 0).toLocaleString('es-ES'))
                  }
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fila 2: Evolución + Actividad reciente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Evolución de usuarios */}
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '0.93rem', fontWeight: 700, color: '#0f172a' }}>Evolución de usuarios</h3>
          </div>
          {evolucion.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={evolucion} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.78rem' }} />
                <Line type="monotone" dataKey="usuarios" stroke={P} strokeWidth={2.5} dot={{ r: 3, fill: P }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#cbd5e1' }}>
              <span style={{ fontSize: '2.2rem' }}>📈</span>
              <span style={{ fontSize: '0.82rem' }}>Sin datos de evolución disponibles</span>
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.93rem', fontWeight: 700, color: '#0f172a' }}>Actividad reciente</h3>
          {actividadReciente.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#cbd5e1' }}>
              <span style={{ fontSize: '1.8rem' }}>🔔</span>
              <span style={{ fontSize: '0.82rem' }}>Sin actividad reciente</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {actividadReciente.slice(0, 8).map((item, i) => {
                const st = tipoStyle(item.tipo);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                      {st.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.3 }}>
                        {item.descripcion || item.tipo}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                        {item.usuario_nombre && <span>{item.usuario_nombre} · </span>}
                        {relTime(item.fecha)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fila 3: Distribución de contenido + Top oposiciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.65fr', gap: 16 }}>

        {/* Distribución contenido */}
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '0.93rem', fontWeight: 700, color: '#0f172a' }}>Contenido por tipo</h3>
          {distribucion.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={distribucion} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={3} dataKey="value">
                    {distribucion.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString('es-ES')} contentStyle={{ borderRadius: 8, fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {distribucion.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: '#64748b' }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.value.toLocaleString('es-ES')}</span>
                      <span style={{ color: '#94a3b8' }}>({totalDist > 0 ? Math.round((item.value / totalDist) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#cbd5e1' }}>
              <span style={{ fontSize: '1.8rem' }}>📊</span>
              <span style={{ fontSize: '0.82rem' }}>Sin datos de contenido</span>
            </div>
          )}
        </div>

        {/* Top oposiciones */}
        <div style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '0.93rem', fontWeight: 700, color: '#0f172a' }}>Top oposiciones por actividad</h3>
            <Link to="/admin/oposiciones" style={{ fontSize: '0.78rem', color: P, textDecoration: 'none', fontWeight: 500 }}>
              Ver todas →
            </Link>
          </div>
          {topOposiciones.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#cbd5e1' }}>
              <span style={{ fontSize: '1.8rem' }}>🏛️</span>
              <span style={{ fontSize: '0.82rem' }}>Sin datos de oposiciones</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topOposiciones.slice(0, 5).map((op, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: i < 3 ? P : '#94a3b8', width: 20, textAlign: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {op.nombre}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 9px', flexShrink: 0, fontWeight: 500 }}>
                    Activa
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                    {(op.total_accesos ?? op.accesos ?? 0).toLocaleString('es-ES')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
