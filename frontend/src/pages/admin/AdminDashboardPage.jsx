import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';

const CARD_STYLE = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '1.25rem 1.5rem',
  textAlign: 'center',
  flex: '1 1 160px',
};

const BIG_NUM = { fontSize: '2.25rem', fontWeight: 700, color: '#1d4ed8', lineHeight: 1.2 };
const LABEL = { fontSize: '0.8rem', color: '#6b7280', marginTop: 6 };

const QUICK_LINKS = [
  { to: '/admin/preguntas', label: '📝 Gestionar preguntas' },
  { to: '/admin/catalogo', label: '🗂️ Gestionar catálogo' },
];

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getAdminStats(token)
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch(() => setError('No se pudieron cargar las estadísticas.'));
  }, [token]);

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Dashboard del sistema</h2>

      {error && <p style={{ color: '#c00' }}>{error}</p>}

      {!stats && !error && <p style={{ color: '#6b7280' }}>Cargando estadísticas...</p>}

      {stats && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>{stats.totalPreguntas.toLocaleString()}</div>
            <div style={LABEL}>Preguntas en el banco</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>{stats.totalUsuarios.toLocaleString()}</div>
            <div style={LABEL}>Usuarios registrados</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>{stats.totalTests.toLocaleString()}</div>
            <div style={LABEL}>Tests completados</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={{ ...BIG_NUM, color: '#059669' }}>{stats.testsEstaSemana.toLocaleString()}</div>
            <div style={LABEL}>Tests esta semana</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>
              {stats.notaMediaGlobal !== null ? stats.notaMediaGlobal.toFixed(2) : '—'}
            </div>
            <div style={LABEL}>Nota media global</div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '0.75rem' }}>Accesos rápidos</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {QUICK_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#1d4ed8',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
