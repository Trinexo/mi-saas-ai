import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <h3>Panel Admin</h3>
        <ul>
          <li>
            <NavLink
              to="/admin/preguntas"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Preguntas
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
