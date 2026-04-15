import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useUserPlan } from '../hooks/useUserPlan';
import { useEffect, useState } from 'react';
import { notificacionesApi } from '../services/notificacionesApi';
import { useRevision } from '../state/revisionContext.jsx';

const PLAN_BADGE = {
  pro:   { label: 'Pro',   color: '#ea580c' },
  elite: { label: 'Elite', color: '#fb923c' },
};

const NAV_LINKS = [
  { to: '/',                label: 'Inicio',          exact: true,  icon: 'home'      },
  { to: '/configurar-test', label: 'Mis tests',       exact: false, icon: 'clipboard' },
  { to: '/mis-oposiciones', label: 'Mis oposiciones', exact: false, icon: 'book'      },
  { to: '/catalogo',        label: 'Catálogo',        exact: false, icon: 'grid'      },
  { to: '/progreso',        label: 'Estadísticas',    exact: false, icon: 'chart'     },
  { to: '/historial',       label: 'Historial',       exact: false, icon: 'clock'     },
  { to: '/simulacros',      label: 'Simulacros',      exact: false, icon: 'simulacro' },
  { to: '/ranking',         label: 'Ranking',         exact: false, icon: 'trophy'    },
  { to: '/marcadas',        label: 'Favoritos',       exact: false, icon: 'star'      },
];

const BOTTOM_NAV = [
  { to: '/',                label: 'Inicio',   exact: true,  icon: 'home'  },
  { to: '/catalogo',        label: 'Catálogo', exact: false, icon: 'grid'  },
  { to: '/configurar-test', label: 'Test',     exact: false, icon: 'play'  },
  { to: '/progreso',        label: 'Progreso', exact: false, icon: 'chart' },
  { to: '/perfil',          label: 'Perfil',   exact: false, icon: 'user'  },
];

const ADMIN_NAV = [
  { to: '/admin',            exact: true,  icon: '▦', label: 'Dashboard' },
  { to: '/admin/preguntas',  exact: false, icon: '❔', label: 'Preguntas' },
  { to: '/admin/catalogo',   exact: false, icon: '◈', label: 'Catálogo' },
  { to: '/admin/usuarios',   exact: false, icon: '◉', label: 'Usuarios' },
  { to: '/admin/profesores', exact: false, icon: '👩‍🏫', label: 'Profesores' },
  { to: '/admin/accesos',    exact: false, icon: '🔑', label: 'Accesos' },
  { to: '/admin/precios',    exact: false, icon: '💶', label: 'Precios' },
  { to: '/admin/revision',   exact: false, icon: '◎', label: 'Revisión', hasBadge: true },
  { to: '/admin/ajustes',    exact: false, icon: '⚙', label: 'Ajustes' },
];

const PROFESOR_NAV = [
  { to: '/profesor',           exact: true,  icon: '▦', label: 'Dashboard' },
  { to: '/profesor/preguntas', exact: false, icon: '❔', label: 'Mis preguntas' },
];

const ICON_SVG = {
  home:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  clipboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
  book:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  grid:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  chart:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  clock:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  star:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  simulacro: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M16 12h2m-8-6v-2"/></svg>',
  trophy:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4v6a5 5 0 0010 0V4h-3"/><path d="M17 4h3v6a5 5 0 01-3 4.58"/></svg>',
  play:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>',
  user:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  bell:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
};

function NavIcon({ name }) {
  if (ICON_SVG[name]) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: ICON_SVG[name] }}
        style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
      />
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', width: 18, flexShrink: 0, fontSize: '1rem', justifyContent: 'center' }}>
      {name}
    </span>
  );
}

function SidebarLink({ to, label, exact, icon, badge }) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname.startsWith(to);
  const [hov, setHov] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        borderRadius: 10,
        textDecoration: 'none',
        color: active ? '#ffffff' : hov ? '#ffffff' : '#9ca3af',
        background: active ? '#ea580c' : hov ? 'rgba(255,255,255,.07)' : 'transparent',
        fontWeight: active ? 600 : 500,
        fontSize: '0.875rem',
        transition: 'all .15s',
        margin: '1px 10px',
      }}
    >
      <NavIcon name={icon} />
      {label}
      {badge > 0 && (
        <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

const NAV_LINKS = [
  { to: '/',                label: 'Inicio',        exact: true  },
  { to: '/catalogo',        label: 'Catalogo',      exact: false },
  { to: '/mis-oposiciones', label: 'Mis cursos',    exact: false },
  { to: '/progreso',        label: 'Progreso',      exact: false },
  { to: '/historial',       label: 'Historial',     exact: false },
];

const BOTTOM_NAV = [
  { to: '/',                label: 'Inicio',    exact: true,  icon: 'home'     },
  { to: '/catalogo',        label: 'Catalogo',  exact: false, icon: 'grid'     },
  { to: '/configurar-test', label: 'Test',      exact: false, icon: 'play'     },
  { to: '/progreso',        label: 'Progreso',  exact: false, icon: 'chart'    },
  { to: '/perfil',          label: 'Perfil',    exact: false, icon: 'user'     },
];

const ICON_SVG = {
  home:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  grid:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  play:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>',
  chart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  user:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
};

function NavIcon({ name }) {
  return <span dangerouslySetInnerHTML={{ __html: ICON_SVG[name] }} style={{ display: 'flex', alignItems: 'center' }} />;
}

function NavLink({ to, label, exact }) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: active ? 700 : 500,
        color: active ? '#ea580c' : '#e5e7eb',
        padding: '4px 2px',
        borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
        transition: 'color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Link>
  );
}

function Shell() {
  const { user, logout, token } = useAuth();
  const { plan } = useUserPlan();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inicial = (user?.nombre || user?.email || '?')[0].toUpperCase();
  const planBadge = PLAN_BADGE[plan] ?? null;
  const isStaff = user && ['admin', 'profesor'].includes(user.role);
  const [sinLeer, setSinLeer] = useState(0);
  const revision = useRevision();
  const totalBadge = revision?.reportesAbiertos ?? 0;

  useEffect(() => {
    if (!token) return;
    notificacionesApi.countSinLeer(token)
      .then((res) => { if (res) setSinLeer(res.total ?? 0); })
      .catch(() => {});
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nombre = user?.nombre || user?.email || 'Usuario';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>

      {/* ── Sidebar desktop ───────────────────────────────── */}
      <aside className="sidebar" style={{
        width: 240,
        background: '#111827',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 14px' }}>
          <Link
            to={isStaff ? '/admin' : '/'}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}
          >
            <div style={{
              width: 34, height: 34, background: '#ea580c', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>
              Albacer<span style={{ color: '#ea580c' }}>Test</span>
            </span>
          </Link>
        </div>

        {/* Divider */}
        <div style={{ margin: '0 16px 10px', borderTop: '1px solid rgba(255,255,255,.07)' }} />

        {/* Nav links */}
        <nav style={{ flex: 1 }}>
          {!isStaff && NAV_LINKS.map((l) => <SidebarLink key={l.to} {...l} />)}
          {user?.role === 'admin' && ADMIN_NAV.map((l) => (
            <SidebarLink key={l.to} {...l} badge={l.hasBadge ? totalBadge : 0} />
          ))}
          {user?.role === 'profesor' && PROFESOR_NAV.map((l) => <SidebarLink key={l.to} {...l} />)}
        </nav>

        {/* User block */}
        <div style={{ padding: '10px 14px 20px', marginTop: 'auto' }}>

          {/* Divider */}
          <div style={{ marginBottom: 12, borderTop: '1px solid rgba(255,255,255,.07)' }} />

          {/* Plan + notificaciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {!isStaff && planBadge && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, color: '#ea580c',
                background: 'rgba(234,88,12,.15)', padding: '3px 8px', borderRadius: 6,
                border: '1px solid rgba(234,88,12,.25)',
              }}>
                {planBadge.label}
              </span>
            )}
            {!isStaff && (
              <Link
                to="/planes"
                style={{
                  fontSize: '0.7rem', fontWeight: 600, color: '#6b7280',
                  textDecoration: 'none', marginLeft: 'auto',
                  padding: '3px 8px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.1)',
                  transition: 'color .15s',
                }}
              >
                Planes
              </Link>
            )}
            {!isStaff && (
              <Link
                to="/notificaciones"
                title="Notificaciones"
                style={{ position: 'relative', display: 'flex', color: '#6b7280', textDecoration: 'none' }}
              >
                <NavIcon name="bell" />
                {sinLeer > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -5,
                    background: '#ea580c', color: '#fff', borderRadius: 999,
                    fontSize: '0.55rem', fontWeight: 700, padding: '1px 4px',
                    lineHeight: '13px', minWidth: 13, textAlign: 'center',
                  }}>
                    {sinLeer > 99 ? '99+' : sinLeer}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Avatar + nombre */}
          <Link to="/perfil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#ea580c',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 800, flexShrink: 0,
            }}>
              {inicial}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: '0.82rem', fontWeight: 600, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {nombre}
              </div>
              <div style={{
                fontSize: '0.7rem', color: '#6b7280',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.email || ''}
              </div>
            </div>
          </Link>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            style={{
              marginTop: 10, width: '100%',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 8, padding: '7px 12px',
              fontSize: '0.78rem', fontWeight: 600,
              color: '#6b7280', cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ───────────────────────────── */}
      <div className="app-shell-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <main className="app-main" style={{ flex: 1, padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (solo móvil) ───────────────────────── */}
      {!isStaff && (
        <nav className="bottom-nav">
          {BOTTOM_NAV.map(({ to, label, exact, icon }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={active ? 'active' : ''}>
                <span className="nav-icon"><NavIcon name={icon} /></span>
                {label}
              </Link>
            );
          })}
        </nav>
      )}

    </div>
  );
}

export default function MainLayout() {
  return <Shell />;
}