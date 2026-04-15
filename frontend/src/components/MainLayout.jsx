import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Inicio', exact: true },
  { to: '/mis-oposiciones', label: 'Oposiciones' },
  { to: '/progreso', label: 'Progreso' },
  { to: '/historial', label: 'Historial' },
  { to: '/marcadas', label: 'Marcadas' },
];

function NavLink({ to, label, exact }) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: active ? 700 : 500,
        color: active ? '#1d4ed8' : '#374151',
        padding: '4px 2px',
        borderBottom: active ? '2px solid #1d4ed8' : '2px solid transparent',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </Link>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const inicial = (user?.nombre || user?.email || '?')[0].toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', fontWeight: 800, fontSize: '1rem', color: '#111827', letterSpacing: '-0.02em', flexShrink: 0 }}>
            <span style={{ color: '#1d4ed8' }}>▷</span> AlbacerTest
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: 20, flex: 1 }}>
            {NAV_LINKS.map((l) => <NavLink key={l.to} {...l} />)}
          </nav>

          {/* Derecha: perfil + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {user && ['admin', 'editor', 'revisor'].includes(user.role) && (
              <Link to="/admin" style={{ textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>
                Admin
              </Link>
            )}
            <Link to="/planes" style={{ textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', background: '#eff6ff', padding: '4px 10px', borderRadius: 6 }}>
              Planes
            </Link>
            <Link to="/perfil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                {inicial}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function MainLayout() {
  return <Shell />;
}