import { NavLink, Outlet } from 'react-router-dom';
import { useRevision } from '../../state/revisionContext.jsx';

const NAV_ITEMS = [
  { to: '/admin', end: true,  icon: '▦', label: 'Dashboard' },
  { to: '/admin/preguntas',   icon: '❔', label: 'Preguntas' },
  { to: '/admin/catalogo',    icon: '◈', label: 'Catálogo' },
  { to: '/admin/usuarios',    icon: '◉', label: 'Usuarios' },
  { to: '/admin/revision',    icon: '◎', label: 'Revisión', hasBadge: true },
];

export default function AdminLayout() {
  const { pendientes } = useRevision();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 230, background: '#111827', color: '#f9fafb', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Panel
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f9fafb' }}>Administración</div>
        </div>
        <ul style={{ listStyle: 'none', padding: '12px 0', margin: 0, flex: 1 }}>
          {NAV_ITEMS.map(({ to, end, icon, label, hasBadge }) => (
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
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                  fontSize: '0.875rem',
                  transition: 'background 0.15s',
                })}
              >
                <span style={{ fontSize: '0.95rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {hasBadge && pendientes > 0 && (
                  <span style={{
                    background: '#dc2626', color: '#fff',
                    borderRadius: 10, padding: '1px 7px',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {pendientes}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1f2937', fontSize: '0.75rem', color: '#6b7280' }}>
          Panel de administración
        </div>
      </nav>
      <div style={{ flex: 1, padding: 24, overflow: 'auto', background: '#f3f4f6', minHeight: '100vh' }}>
        <Outlet />
      </div>
    </div>
  );
}
