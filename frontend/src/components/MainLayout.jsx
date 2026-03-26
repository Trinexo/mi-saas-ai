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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <h1>Plataforma Test</h1>
        <nav>
          <Link to="/">Inicio</Link>
          <Link to="/mis-oposiciones">Mis oposiciones</Link>
          <Link to="/progreso">Progreso</Link>
          <Link to="/historial">Historial</Link>
          <Link to="/marcadas">Marcadas</Link>
          <Link to="/perfil">Perfil</Link>
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