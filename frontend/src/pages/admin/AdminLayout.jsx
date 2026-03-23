import { NavLink, Outlet } from 'react-router-dom';
import { useRevision } from '../../state/revisionContext.jsx';

export default function AdminLayout() {
  const { pendientes } = useRevision();
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <h3>Panel Admin</h3>
        <ul>
          <li>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/preguntas"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Preguntas
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/catalogo"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/usuarios"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/revision"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
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
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
