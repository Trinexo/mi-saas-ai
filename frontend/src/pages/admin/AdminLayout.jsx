import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
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
              Revisión
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
