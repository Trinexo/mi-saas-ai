import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  if (error) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚠️</div>
      <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
    </div>
  );
  if (!oposiciones) return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Mis oposiciones</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          {oposiciones.length === 0
            ? 'Todavía no has practicado ninguna oposición.'
            : `${oposiciones.length} ${oposiciones.length === 1 ? 'oposición en progreso' : 'oposiciones en progreso'}`}
        </p>
      </div>

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
    </div>
  );
}
