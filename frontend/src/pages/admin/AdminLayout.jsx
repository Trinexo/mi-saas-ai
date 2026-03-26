import { NavLink, Outlet } from 'react-router-dom';
import { useRevision } from '../../state/revisionContext.jsx';

export default function AdminLayout() {
  const { pendientes } = useRevision();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#1f2937', color: '#f9fafb', padding: '24px 16px', flexShrink: 0 }}>
        <h3>Panel Admin</h3>
        <ul>
          <li>
            <NavLink
              to="/admin"
              end
              style={({ isActive }) => isActive ? { fontWeight: 700, color: '#60a5fa' } : { color: '#d1d5db' }}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/preguntas"
              style={({ isActive }) => isActive ? { fontWeight: 700, color: '#60a5fa' } : { color: '#d1d5db' }}
            >
              Preguntas
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/catalogo"
              style={({ isActive }) => isActive ? { fontWeight: 700, color: '#60a5fa' } : { color: '#d1d5db' }}
            >
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/usuarios"
              style={({ isActive }) => isActive ? { fontWeight: 700, color: '#60a5fa' } : { color: '#d1d5db' }}
            >
              Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/revision"
              style={({ isActive }) => isActive ? { fontWeight: 700, color: '#60a5fa' } : { color: '#d1d5db' }}
            >
              Revisi\u00f3n
              {pendientes > 0 && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '1px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    verticalAlign: 'middle',
                  }}
                >
                  {pendientes}
                </span>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
