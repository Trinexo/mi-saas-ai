import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/profesor', end: true,  icon: '▦', label: 'Dashboard' },
  { to: '/profesor/preguntas',   icon: '❔', label: 'Mis preguntas' },
];

export default function ProfesorLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 230, background: '#065f46', color: '#f9fafb', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #047857' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6ee7b7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Panel
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f9fafb' }}>Profesor</div>
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
                  color: isActive ? '#f9fafb' : '#a7f3d0',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #34d399' : '3px solid transparent',
                  background: isActive ? 'rgba(52,211,153,0.15)' : 'transparent',
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
        <div style={{ padding: '12px 20px', borderTop: '1px solid #047857', fontSize: '0.75rem', color: '#6ee7b7' }}>
          Panel de profesor
        </div>
      </nav>
      <div style={{ flex: 1, padding: 24, overflow: 'auto', background: '#f3f4f6', minHeight: '100vh' }}>
        <Outlet />
      </div>
    </div>
  );
}
