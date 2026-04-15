import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { subscriptionApi } from '../../services/subscriptionApi';
import { useAuth } from '../../state/auth.jsx';
import { useRevision } from '../../state/revisionContext.jsx';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 20 };
const BIG_NUM = { fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1.1 };
const LABEL = { fontSize: '0.78rem', color: '#6b7280', marginTop: 5 };

const KPI_ITEMS = [
  { key: 'totalPreguntas',   icon: '📝', label: 'Preguntas',       color: '#1d4ed8' },
  { key: 'totalUsuarios',    icon: '👥', label: 'Usuarios',        color: '#7c3aed' },
  { key: 'totalTests',       icon: '📊', label: 'Tests totales',   color: '#0369a1' },
  { key: 'testsEstaSemana',  icon: '📅', label: 'Tests esta semana', color: '#059669' },
  { key: 'notaMediaGlobal',  icon: '⭐', label: 'Nota media global', color: '#d97706', format: (v) => v !== null ? Number(v).toFixed(2) : '—' },
];

const QUICK_LINKS = [
  { to: '/admin/preguntas', icon: '📝', label: 'Preguntas',  desc: 'Añadir y revisar' },
  { to: '/admin/catalogo',  icon: '🗂️', label: 'Catálogo',   desc: 'Oposiciones, temas' },
  { to: '/admin/usuarios',  icon: '👥', label: 'Usuarios',   desc: 'Roles y cuentas' },
  { to: '/admin/revision',  icon: '✅', label: 'Revisión',   desc: 'Cola de aprobación' },
];

const ROL_LABELS = { alumno: 'Alumnos', editor: 'Editores', revisor: 'Revisores', admin: 'Admins' };
const ROL_COLOR  = { alumno: '#374151', editor: '#1d4ed8',  revisor: '#a16207',   admin: '#b91c1c' };

const TH = {
  padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280',
  borderBottom: '2px solid #e5e7eb', textAlign: 'left',
  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const TD = { padding: '0.5rem 0.75rem', color: '#111827', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' };

const ESTADO_COLOR = {
  pendiente: { bg: '#fef3c7', border: '#f59e0b', num: '#92400e', label: 'Pendientes' },
  aprobada:  { bg: '#dcfce7', border: '#059669', num: '#166534', label: 'Aprobadas'  },
  rechazada: { bg: '#fee2e2', border: '#dc2626', num: '#991b1b', label: 'Rechazadas' },
};

const PLAN_SUB_COLOR = { free: '#6b7280', pro: '#1d4ed8', elite: '#7c3aed' };
const PLAN_SUB_BG    = { free: '#f9fafb', pro: '#eff6ff', elite: '#f5f3ff' };

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { setPendientes } = useRevision();
  const [stats, setStats] = useState(null);
  const [subStats, setSubStats] = useState(null);
  const [usersByRole, setUsersByRole] = useState(null);
  const [temasErrores, setTemasErrores] = useState(null);
  const [preguntasPorEstado, setPreguntasPorEstado] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getAdminStats(token)
      .then((res) => {
        if (res?.data) {
          setStats(res.data);
          setPendientes(res.data.pendientesRevision ?? 0);
        }
      })
      .catch(() => setError('No se pudieron cargar las estadísticas.'));

    Promise.all(
      ['alumno', 'editor', 'revisor', 'admin'].map((role) =>
        adminApi.listUsers(token, { role, page: 1, page_size: 1 })
          .then((res) => ({ role, total: res?.data?.pagination?.total ?? 0 }))
          .catch(() => ({ role, total: 0 })),
      ),
    ).then((results) => {
      const byRole = {};
      results.forEach(({ role, total }) => { byRole[role] = total; });
      setUsersByRole(byRole);
    });

    adminApi
      .getTemasConMasErrores(token, 10)
      .then((res) => { if (res?.data) setTemasErrores(res.data); })
      .catch(() => setTemasErrores([]));

    adminApi
      .getPreguntasPorEstado(token)
      .then((res) => { if (res?.data) setPreguntasPorEstado(res.data); })
      .catch(() => setPreguntasPorEstado([]));

    subscriptionApi
      .getStats(token)
      .then((res) => { if (res?.data) setSubStats(res.data); })
      .catch(() => setSubStats(null));
  }, [token]);

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Panel de administración</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>{today}</p>
        </div>
        <Link
          to="/admin/revision"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1d4ed8', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
        >
          ✅ Cola de revisión
          {stats?.pendientesRevision > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px', marginLeft: 2 }}>{stats.pendientesRevision}</span>
          )}
        </Link>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>
      )}

      {!stats && !error && (
        <p style={{ color: '#6b7280', padding: '2rem', textAlign: 'center' }}>Cargando estadísticas…</p>
      )}

      {/* Alerta revisión pendiente */}
      {stats?.pendientesRevision > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <span style={{ color: '#92400e', fontWeight: 600 }}>
            {stats.pendientesRevision} pregunta{stats.pendientesRevision !== 1 ? 's' : ''} pendiente{stats.pendientesRevision !== 1 ? 's' : ''} de revisión
          </span>
          <Link to="/admin/revision" style={{ marginLeft: 'auto', background: '#f59e0b', color: '#fff', padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            Revisar ahora
          </Link>
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
          {KPI_ITEMS.map(({ key, icon, label, color, format }) => (
            <div key={key} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderTop: `4px solid ${color}` }}>
              <span style={{ fontSize: '1.5rem' }}>{icon}</span>
              <div style={{ ...BIG_NUM, color, marginTop: 8 }}>
                {format ? format(stats[key]) : (stats[key] ?? 0).toLocaleString()}
              </div>
              <div style={LABEL}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accesos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {QUICK_LINKS.map(({ to, icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e5e7eb', transition: 'box-shadow .15s' }}
          >
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Fila inferior: Usuarios por rol + Estado banco */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Usuarios por rol */}
        {usersByRole && (
          <div style={SECTION}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Usuarios por rol</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['alumno', 'editor', 'revisor', 'admin'].map((role) => (
                <div key={role} style={{ flex: '1 1 80px', background: '#f9fafb', borderRadius: 8, padding: '10px 12px', textAlign: 'center', borderTop: `3px solid ${ROL_COLOR[role]}` }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: ROL_COLOR[role] }}>{usersByRole[role]}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>{ROL_LABELS[role]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado banco preguntas */}
        {preguntasPorEstado && preguntasPorEstado.length > 0 && (
          <div style={SECTION}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Estado del banco</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {preguntasPorEstado.map((row) => {
                const c = ESTADO_COLOR[row.estado] ?? { bg: '#f3f4f6', border: '#9ca3af', num: '#374151', label: row.estado };
                return (
                  <div key={row.estado} style={{ flex: '1 1 80px', background: c.bg, borderRadius: 8, padding: '10px 12px', textAlign: 'center', borderTop: `3px solid ${c.border}` }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.num }}>{row.total.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>{c.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas de suscripciones */}
      {subStats && (
        <div style={SECTION}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Suscripciones</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>

            {/* Distribución por plan */}
            {['free', 'pro', 'elite'].map((plan) => (
              <div key={plan} style={{ background: PLAN_SUB_BG[plan], borderRadius: 10, padding: '12px 16px', borderTop: `3px solid ${PLAN_SUB_COLOR[plan]}`, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: PLAN_SUB_COLOR[plan] }}>
                  {(subStats.porPlan[plan] ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3, textTransform: 'capitalize' }}>{plan}</div>
              </div>
            ))}

            {/* Tasa de conversión */}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #059669', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{subStats.tasaConversion}%</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>Conversión</div>
            </div>

            {/* Nuevas últimas semana */}
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #d97706', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{subStats.nuevas7d}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>Nuevas (7d)</div>
            </div>

            {/* Nuevas últimos 30 días */}
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #f59e0b', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{subStats.nuevas30d}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>Nuevas (30d)</div>
            </div>

          </div>
        </div>
      )}

      {/* Top temas con más errores */}
      {temasErrores && temasErrores.length > 0 && (
        <div style={SECTION}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Top temas con más errores</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Tema</th>
                  <th style={TH}>Materia</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Respuestas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Errores</th>
                  <th style={{ ...TH, textAlign: 'right' }}>% Error</th>
                </tr>
              </thead>
              <tbody>
                {temasErrores.map((t) => (
                  <tr key={t.temaId}>
                    <td style={TD}>{t.temaNombre}</td>
                    <td style={{ ...TD, color: '#6b7280' }}>{t.materiaNombre}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{t.totalRespuestas.toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#b91c1c', fontWeight: 600 }}>{t.totalErrores.toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span style={{
                        background: t.pctError >= 60 ? '#fee2e2' : t.pctError >= 40 ? '#fef3c7' : '#dcfce7',
                        color: t.pctError >= 60 ? '#991b1b' : t.pctError >= 40 ? '#92400e' : '#166534',
                        padding: '2px 8px', borderRadius: 12, fontWeight: 600, fontSize: '0.78rem',
                      }}>
                        {t.pctError !== null ? `${t.pctError}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
