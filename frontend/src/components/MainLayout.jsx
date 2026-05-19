import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useUserPlan } from '../hooks/useUserPlan';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { useEffect, useState, useCallback } from 'react';
import { notificacionesApi } from '../services/notificacionesApi';
import { useRevision } from '../state/revisionContext.jsx';

const PLAN_BADGE = {
  pro:   { label: 'Pro',   color: '#ea580c' },
  elite: { label: 'Elite', color: '#fb923c' },
};

const NAV_LINKS = [
  { to: '/',                label: 'Inicio',          exact: true,  icon: 'home'      },
  { to: '/plan-estudio',    label: 'Plan de estudio', exact: false, icon: 'clock'     },
  { to: '/mis-tests',       label: 'Mis tests',        exact: false, icon: 'clipboard' },
  { to: '/simulacros',      label: 'Simulacros',      exact: false, icon: 'simulacro' },
  { to: '/configurar-test', label: 'Crear test',       exact: false, icon: 'play'      },
  { to: '/mis-oposiciones', label: 'Mis oposiciones', exact: false, icon: 'book'      },
  { to: '/catalogo',        label: 'Catálogo',        exact: false, icon: 'grid'      },
  { to: '/progreso',        label: 'Estadísticas',    exact: false, icon: 'chart'     },
  { to: '/historial',       label: 'Historial',       exact: false, icon: 'clock'     },
  { to: '/ranking',         label: 'Ranking',         exact: false, icon: 'trophy'    },
  { to: '/marcadas',        label: 'Favoritos',       exact: false, icon: 'star'      },
];

// Solo estas opciones para plan free (sin oposición comprada)
const NAV_LINKS_FREE = [
  { to: '/catalogo',        label: 'Catálogo',   exact: false, icon: 'grid' },
  { to: '/configurar-test', label: 'Crear test', exact: false, icon: 'play' },
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
  { to: '/admin/tests',      exact: false, icon: '▣', label: 'Tests' },
  { to: '/admin/simulacros', exact: false, icon: '▤', label: 'Simulacros' },
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
  { to: '/profesor',                exact: true,  icon: '▦', label: 'Dashboard' },
  { to: '/profesor/oposiciones',    exact: false, icon: 'book', label: 'Mis oposiciones' },
  { to: '/profesor/temario',        exact: false, icon: 'grid', label: 'Temario' },
  { to: '/profesor/tests',          exact: false, icon: '▣', label: 'Tests' },
  { to: '/profesor/simulacros',     exact: false, icon: '▤', label: 'Simulacros' },
  { to: '/profesor/preguntas',      exact: false, icon: '❔', label: 'Preguntas' },
  { to: '/profesor/alumnos',        exact: false, icon: 'user', label: 'Alumnos' },
  { to: '/profesor/estadisticas',   exact: false, icon: 'chart', label: 'Estadísticas' },
  { to: '/profesor/calendario',     exact: false, icon: 'clock', label: 'Planificación' },
  { to: '/profesor/revision',       exact: false, icon: '◎', label: 'Revisión', hasBadge: true },
  { to: '/profesor/notificaciones', exact: false, icon: 'bell', label: 'Notificaciones' },
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
  const { user } = useAuth();
  const active = exact ? pathname === to : pathname.startsWith(to);
  const [hov, setHov] = useState(false);
  const accent = user?.role === 'profesor' ? '#6d28d9' : '#ea580c';

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
        background: active ? accent : hov ? 'rgba(255,255,255,.07)' : 'transparent',
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
  const { tieneAlgunAcceso } = useUserAccesos();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inicial = (user?.nombre || user?.email || '?')[0].toUpperCase();
  const planBadge = PLAN_BADGE[plan] ?? null;
  const isStaff = user && ['admin', 'profesor'].includes(user.role);
  const canUseNotifications = user?.role !== 'admin';
  const notificationsPath = user?.role === 'profesor' ? '/profesor/notificaciones' : '/notificaciones';
  const [sinLeer, setSinLeer] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const revision = useRevision();
  const totalBadge = revision?.reportesAbiertos ?? 0;

  // Cerrar drawer al cambiar de ruta
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!token || !canUseNotifications) {
      setSinLeer(0);
      return;
    }
    notificacionesApi.countSinLeer(token)
      .then((res) => { if (res) setSinLeer(res.total ?? 0); })
      .catch(() => {});
  }, [token, canUseNotifications]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const nombre = user?.nombre || user?.email || 'Usuario';
  const homePath = user?.role === 'admin' ? '/admin' : user?.role === 'profesor' ? '/profesor' : '/';
  const profilePath = user?.role === 'profesor' ? '/profesor/perfil' : '/perfil';

  const navLinks = !isStaff
    ? (tieneAlgunAcceso ? NAV_LINKS : NAV_LINKS_FREE)
    : user?.role === 'admin'
    ? ADMIN_NAV
    : PROFESOR_NAV;

  /* ── Sidebar interior (reutilizable en desktop + drawer móvil) ── */
  function SidebarContent() {
    return (
      <>
        {/* Logo */}
        <div style={{ padding: '20px 20px 14px', flexShrink: 0 }}>
          <Link
            to={homePath}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}
            onClick={() => setDrawerOpen(false)}
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
        <div style={{ margin: '0 16px 10px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }} />

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {navLinks.map((l) => (
            <SidebarLink key={l.to} {...l} badge={l.hasBadge ? totalBadge : 0} />
          ))}
        </nav>

        {/* User block */}
        <div style={{ padding: '10px 14px 20px', marginTop: 'auto', flexShrink: 0 }}>
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
                }}
              >
                Planes
              </Link>
            )}
            {canUseNotifications && (
              <Link
                to={notificationsPath}
                title="Notificaciones"
                style={{ position: 'relative', display: 'flex', color: '#6b7280', textDecoration: 'none', marginLeft: isStaff ? 'auto' : 0 }}
              >
                <NavIcon name="bell" />
                {sinLeer > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -5,
                    background: user?.role === 'profesor' ? '#6d28d9' : '#ea580c', color: '#fff', borderRadius: 999,
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
          <Link to={profilePath} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#ea580c',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 800, flexShrink: 0,
            }}>
              {inicial}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nombre}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              borderRadius: 8, padding: '8px 12px',
              fontSize: '0.78rem', fontWeight: 600,
              color: '#6b7280', cursor: 'pointer',
              minHeight: 36,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>

      {/* ── Sidebar desktop (oculta en móvil via CSS) ─────── */}
      <aside className="sidebar" style={{
        width: 240,
        background: '#111827',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}>
        <SidebarContent />
      </aside>

      {/* ── Drawer móvil (staff) ──────────────────────────── */}
      {isStaff && drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
              zIndex: 300, display: 'none',
            }}
            className="mobile-drawer-backdrop"
          />
          {/* Panel */}
          <aside
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
              background: '#111827', zIndex: 310,
              display: 'none', flexDirection: 'column',
              animation: 'slideInRight .22s ease',
            }}
            className="mobile-drawer-panel"
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Top bar móvil (solo móvil, se muestra via CSS) ── */}
      <header
        className="mobile-top-bar"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: '#111827',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          zIndex: 100,
          height: 52,
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Hamburger (solo staff) o logo */}
        {isStaff ? (
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            style={{
              background: 'transparent', border: 'none', color: '#9ca3af',
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
              minWidth: 36, minHeight: 36,
            }}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        ) : null}

        <Link to={homePath} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
          <div style={{
            width: 28, height: 28, background: '#ea580c', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', letterSpacing: '-0.02em' }}>
            Albacer<span style={{ color: '#ea580c' }}>Test</span>
          </span>
        </Link>

        {/* Notificaciones */}
        {canUseNotifications && (
          <Link to={notificationsPath} style={{ position: 'relative', display: 'flex', color: '#6b7280', textDecoration: 'none', padding: 6 }}>
            <NavIcon name="bell" />
            {sinLeer > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: '#ea580c', color: '#fff', borderRadius: 999,
                fontSize: '0.55rem', fontWeight: 700, padding: '0 3px',
                lineHeight: '13px', minWidth: 13, textAlign: 'center',
              }}>
                {sinLeer > 9 ? '9+' : sinLeer}
              </span>
            )}
          </Link>
        )}

        {/* Avatar */}
        <Link to={profilePath} style={{ textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#ea580c',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 800,
          }}>
            {inicial}
          </div>
        </Link>
      </header>

      {/* ── Contenido principal ───────────────────────────── */}
      <div className="app-shell-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <main className="app-main" style={{ flex: 1, padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (solo móvil, solo alumnos) ────────── */}
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
