import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { subscriptionApi } from '../../services/subscriptionApi';
import { accesosApi } from '../../services/accesosApi';
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
  { to: '/admin/preguntas', icon: '📝', label: 'Preguntas',  desc: 'Añadir y gestionar' },
  { to: '/admin/catalogo',  icon: '🗂️', label: 'Catálogo',   desc: 'Oposiciones, temas' },
  { to: '/admin/usuarios',  icon: '👥', label: 'Usuarios',   desc: 'Roles y cuentas' },
  { to: '/admin/accesos',   icon: '🔑', label: 'Accesos',    desc: 'Cursos por alumno' },
  { to: '/admin/revision',  icon: '✅', label: 'Revisión',   desc: 'Reportes de usuarios' },
];

const ROL_LABELS = { alumno: 'Alumnos', profesor: 'Profesores', admin: 'Admins' };
const ROL_COLOR  = { alumno: '#374151', profesor: '#166534', admin: '#b91c1c' };

const TH = {
  padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280',
  borderBottom: '2px solid #e5e7eb', textAlign: 'left',
  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const TD = { padding: '0.5rem 0.75rem', color: '#111827', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' };

const PLAN_SUB_COLOR = { free: '#6b7280', pro: '#1d4ed8', elite: '#7c3aed' };
const PLAN_SUB_BG    = { free: '#f9fafb', pro: '#eff6ff', elite: '#f5f3ff' };

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { reportesAbiertos } = useRevision();
  const [stats, setStats] = useState(null);
  const [subStats, setSubStats] = useState(null);
  const [accesosStats, setAccesosStats] = useState(null);
  const [usersByRole, setUsersByRole] = useState(null);
  const [temasErrores, setTemasErrores] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getAdminStats(token)
      .then((res) => { if (res) setStats(res); })
      .catch(() => setError('No se pudieron cargar las estadísticas.'));

    Promise.all(
      ['alumno', 'profesor', 'admin'].map((role) =>
        adminApi.listUsers(token, { role, page: 1, page_size: 1 })
          .then((res) => ({ role, total: res?.pagination?.total ?? 0 }))
          .catch(() => ({ role, total: 0 })),
      ),
    ).then((results) => {
      const byRole = {};
      results.forEach(({ role, total }) => { byRole[role] = total; });
      setUsersByRole(byRole);
    });

    adminApi
      .getTemasConMasErrores(token, 10)
      .then((res) => { if (res) setTemasErrores(res); })
      .catch(() => setTemasErrores([]));

    subscriptionApi
      .getStats(token)
      .then((res) => { if (res) setSubStats(res); })
      .catch(() => setSubStats(null));

    accesosApi
      .getStats(token)
      .then((res) => { if (res) setAccesosStats(res); })
      .catch(() => setAccesosStats(null));
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
        {reportesAbiertos > 0 && (
          <Link
            to="/admin/revision"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1d4ed8', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
          >
            ✅ Reportes
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px', marginLeft: 2 }}>{reportesAbiertos}</span>
          </Link>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>
      )}

      {!stats && !error && (
        <p style={{ color: '#6b7280', padding: '2rem', textAlign: 'center' }}>Cargando estadísticas…</p>
      )}

      {/* Alerta reportes abiertos */}
      {reportesAbiertos > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <span style={{ color: '#92400e', fontWeight: 600 }}>
            {reportesAbiertos} reporte{reportesAbiertos !== 1 ? 's' : ''} de usuario{reportesAbiertos !== 1 ? 's' : ''} sin resolver
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

      {/* Usuarios por rol */}
      {usersByRole && (
        <div style={{ ...SECTION, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Usuarios por rol</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['alumno', 'profesor', 'admin'].map((role) => (
              <div key={role} style={{ flex: '1 1 80px', background: '#f9fafb', borderRadius: 8, padding: '10px 12px', textAlign: 'center', borderTop: `3px solid ${ROL_COLOR[role]}` }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: ROL_COLOR[role] }}>{usersByRole[role]}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>{ROL_LABELS[role]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Estadísticas de accesos a oposiciones */}
      {accesosStats && (
        <div style={SECTION}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Accesos a cursos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div style={{ background: '#dcfce7', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #059669', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{accesosStats.total_activos ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3 }}>Accesos activos</div>
            </div>
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #1d4ed8', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8' }}>{accesosStats.usuarios_con_acceso ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3 }}>Alumnos con acceso</div>
            </div>
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #f59e0b', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{accesosStats.nuevos_7d ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3 }}>Nuevos (7d)</div>
            </div>
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #ea580c', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c2410c' }}>{accesosStats.nuevos_30d ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3 }}>Nuevos (30d)</div>
            </div>
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 16px', borderTop: '3px solid #7c3aed', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed' }}>
                {accesosStats.ingresos_total !== null ? `${Number(accesosStats.ingresos_total).toFixed(0)}€` : '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3 }}>Ingresos acumulados</div>
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
