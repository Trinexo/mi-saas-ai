import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useUserPlan } from '../hooks/useUserPlan';
import { useEffect, useState } from 'react';
import { notificacionesApi } from '../services/notificacionesApi';

const PLAN_BADGE = {
  pro:   { label: 'Pro',   bg: '#fff7ed', color: '#ea580c' },
  elite: { label: 'Elite', bg: '#111827', color: '#fb923c' },
};

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

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5' }}>

      <header style={{ background: '#111827', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 58, display: 'flex', alignItems: 'center', gap: 24 }}>

          <Link to={isStaff ? '/admin' : '/'} style={{ textDecoration: 'none', fontWeight: 900, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#ea580c', fontSize: '1.3rem', lineHeight: 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ea580c"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
            <span>Albacer<span style={{ color: '#ea580c' }}>Test</span></span>
          </Link>

          {!isStaff && (
            <nav className="top-nav" style={{ display: 'flex', gap: 20, flex: 1 }}>
              {NAV_LINKS.map((l) => <NavLink key={l.to} {...l} />)}
            </nav>
          )}
          {isStaff && <div style={{ flex: 1 }} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {!isStaff && (
              <Link to="/planes" style={{ textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, color: '#ea580c', background: 'rgba(234,88,12,.15)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(234,88,12,.3)' }}>
                Planes
              </Link>
            )}
            {!isStaff && planBadge && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: planBadge.bg, color: planBadge.color, padding: '3px 9px', borderRadius: 6 }}>
                {planBadge.label}
              </span>
            )}
            {!isStaff && (
              <Link to="/notificaciones" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#e5e7eb' }} title="Notificaciones">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {sinLeer > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -7, background: '#ea580c', color: '#fff', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', lineHeight: '14px', minWidth: 14, textAlign: 'center' }}>
                    {sinLeer > 99 ? '99+' : sinLeer}
                  </span>
                )}
              </Link>
            )}
            <Link to="/perfil" style={{ textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>
                {inicial}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', cursor: 'pointer' }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="app-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </main>

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