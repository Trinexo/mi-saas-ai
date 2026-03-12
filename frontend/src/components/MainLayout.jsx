import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';

function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Plataforma Test</h1>
        <nav>
          <Link to="/">Inicio</Link>
          <Link to="/progreso">Progreso</Link>
          {user && ['admin', 'editor', 'revisor'].includes(user.role) && <Link to="/admin/preguntas">Admin</Link>}
        </nav>
        <button onClick={handleLogout}>Salir</button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default function MainLayout() {
  return <Shell />;
}