import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useRevision } from '../../state/revisionContext.jsx';

const PRIMARY = '#7c3aed';
const PRIMARY_BG = 'rgba(124,58,237,0.13)';
const SIDEBAR_BG = '#1e293b';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { to: '/admin', end: true, icon: '⊞', label: 'Dashboard' },
    ],
  },
  {
    label: 'Gestión de contenido',
    items: [
      { to: '/admin/oposiciones', icon: '🏛️', label: 'Oposiciones' },
      { to: '/admin/catalogo',    icon: '📚', label: 'Temario' },
      { to: '/admin/tests',       icon: '📝', label: 'Tests' },
      { to: '/admin/simulacros',  icon: '📋', label: 'Simulacros' },
      { to: '/admin/preguntas',   icon: '❓', label: 'Preguntas' },
      { to: '/admin/etiquetas',   icon: '🏷️', label: 'Etiquetas' },
    ],
  },
  {
    label: 'Usuarios y permisos',
    items: [
      { to: '/admin/usuarios',   icon: '👥', label: 'Usuarios' },
      { to: '/admin/profesores', icon: '👩‍🏫', label: 'Profesores' },
      { to: '/admin/accesos',    icon: '🔐', label: 'Roles y permisos' },
    ],
  },
  {
    label: 'Analítica',
    items: [
      { to: '/admin/revision',   icon: '📊', label: 'Actividad', hasBadge: true },
      { to: '/admin/resultados', icon: '📈', label: 'Resultados', disabled: true },
      { to: '/admin/informes',   icon: '📑', label: 'Informes',   disabled: true },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/ajustes',  icon: '⚙️', label: 'Configuración' },
      { to: '/admin/revision', icon: '🔍', label: 'Auditoría', hasBadge: true },
      { to: '/admin/precios',  icon: '💶', label: 'Precios' },
    ],
  },
];

export default function AdminLayout() {
  const { pendientes, reportesAbiertos } = useRevision();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const totalBadge = (pendientes ?? 0) + (reportesAbiertos ?? 0);
  const inicial = (user?.nombre || user?.email || 'A')[0].toUpperCase();
  const nombre = user?.nombre || user?.email || 'Admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar fija */}
      <nav style={{
        width: 256, background: SIDEBAR_BG, color: '#e2e8f0',
        flexShrink: 0, display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: PRIMARY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 900, color: '#fff', flexShrink: 0,
            }}>O</div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>OpoTest</div>
              <div style={{ fontSize: '0.61rem', color: '#64748b', letterSpacing: '0.04em' }}>Panel de administración</div>
            </div>
          </div>
        </div>

        {/* Navegación por secciones */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.label && (
                <div style={{
                  padding: '14px 16px 4px',
                  fontSize: '0.61rem', fontWeight: 700, color: '#475569',
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map(({ to, end, icon, label, hasBadge, disabled }) =>
                disabled ? (
                  <span
                    key={to}
                    title="Próximamente"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 16px 7px 13px',
                      color: '#374151', fontSize: '0.835rem',
                      borderLeft: '3px solid transparent',
                      opacity: 0.45, cursor: 'default',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', width: 18, textAlign: 'center' }}>{icon}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    <span style={{ fontSize: '0.6rem', background: '#334155', color: '#64748b', borderRadius: 4, padding: '1px 5px' }}>Pronto</span>
                  </span>
                ) : (
                  <NavLink
                    key={`${to}-${label}`}
                    to={to}
                    end={end}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 16px 7px 13px',
                      color: isActive ? '#ede9fe' : '#94a3b8',
                      fontWeight: isActive ? 600 : 400,
                      textDecoration: 'none',
                      borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                      background: isActive ? PRIMARY_BG : 'transparent',
                      fontSize: '0.835rem',
                      transition: 'background 0.12s, color 0.12s',
                    })}
                  >
                    <span style={{ fontSize: '0.85rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {hasBadge && totalBadge > 0 && (
                      <span style={{
                        background: '#dc2626', color: '#fff',
                        borderRadius: 10, padding: '1px 6px',
                        fontSize: '0.64rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {totalBadge}
                      </span>
                    )}
                  </NavLink>
                )
              )}
            </div>
          ))}
        </div>

        {/* Perfil usuario */}
        <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Link to="/perfil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: PRIMARY,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
            }}>
              {inicial}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nombre}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#475569' }}>Superadministrador</div>
            </div>
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, padding: '6px 12px',
              fontSize: '0.75rem', fontWeight: 500,
              color: '#64748b', cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Área de contenido */}
      <div style={{ marginLeft: 256, flex: 1, minHeight: '100vh', background: '#f1f5f9' }}>
        <Outlet />
      </div>
    </div>
  );
}
