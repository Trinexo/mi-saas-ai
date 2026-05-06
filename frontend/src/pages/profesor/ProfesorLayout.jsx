import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';

const NAV_ITEMS = [
  { to: '/profesor', end: true,       icon: '▦',  label: 'Dashboard' },
  { to: '/profesor/preguntas',        icon: '❔', label: 'Mis preguntas' },
  { to: '/profesor/mis-tests',        icon: '📊', label: 'Mis tests' },
  { to: '/profesor/mis-simulacros',   icon: '📋', label: 'Mis simulacros' },
];

export default function ProfesorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const inicial = (user?.nombre || user?.email || 'P')[0].toUpperCase();
  const nombre = user?.nombre || user?.email || 'Profesor';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 240, background: '#111827', color: '#f9fafb', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Panel</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: '#ea580c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>👩‍🏫</span>
            Profesor
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: '12px 0', margin: 0, flex: 1 }}>
          {NAV_ITEMS.map(({ to, end, icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  color: isActive ? '#f9fafb' : '#9ca3af',
                  fontWeight: isActive ? 700 : 400,
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #ea580c' : '3px solid transparent',
                  background: isActive ? 'rgba(234,88,12,0.12)' : 'transparent',
                  fontSize: '0.875rem',
                  transition: 'background 0.15s',
                })}
              >
                <span style={{ fontSize: '0.95rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div style={{ padding: '10px 14px 20px', borderTop: '1px solid #1f2937' }}>
          <div style={{ marginBottom: 12, borderTop: '1px solid rgba(255,255,255,.07)' }} />
          <Link to="/perfil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <button
            onClick={handleLogout}
            style={{
              marginTop: 10, width: '100%',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 8, padding: '7px 12px',
              fontSize: '0.78rem', fontWeight: 600,
              color: '#6b7280', cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <div style={{ flex: 1, padding: 28, overflow: 'auto', background: '#f8fafc', minHeight: '100vh' }}>
        <Outlet />
      </div>
    </div>
  );
}
