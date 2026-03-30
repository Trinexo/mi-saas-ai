import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import MisOposicionesEmpty from '../components/misoposiciones/MisOposicionesEmpty';
import OposicionCard from '../components/misoposiciones/OposicionCard';

export default function MisOposicionesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [oposiciones, setOposiciones] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    testApi
      .getMisOposiciones(token)
      .then((data) => setOposiciones(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'No se pudo cargar tus oposiciones'));
  }, [token]);

  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!oposiciones) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Mis oposiciones</span>
      </nav>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '16px 0 4px' }}>Mis oposiciones</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 13 }}>
        {oposiciones.length === 0
          ? 'Todavía no has practicado ninguna oposición.'
          : `${oposiciones.length} ${oposiciones.length === 1 ? 'oposición en progreso' : 'oposiciones en progreso'}`}
      </p>

      {oposiciones.length === 0 ? (
        <MisOposicionesEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {oposiciones.map((op) => (
            <OposicionCard
              key={op.oposicionId}
              op={op}
              onNavigate={(id) => navigate(`/oposicion/${id}`)}
              onPracticar={(id) => navigate('/', { state: { oposicionId: id } })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
