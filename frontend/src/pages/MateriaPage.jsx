import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import MateriaMaestriaBar from '../components/materia/MateriaMaestriaBar';
import MateriaTemasTable from '../components/materia/MateriaTemasTable';

export default function BloquePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    testApi
      .getProgresoBloquesByTema(token, Number(id))
      .then((data) => setBloques(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'No se pudo cargar el tema'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando…</p>
    </div>
  );
  if (error) return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚠️</div>
      <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
    </div>
  );

  const temaNombre = bloques[0]?.temaNombre ?? `Tema #${id}`;
  const oposicionId = bloques[0]?.oposicionId ?? null;
  const oposicionNombre = bloques[0]?.oposicionNombre ?? null;
  const totalBloques = bloques.length;
  const totalDominadas = bloques.reduce((sum, b) => sum + (b.dominadas ?? 0), 0);
  const totalPreguntas = bloques.reduce((sum, b) => sum + (b.totalPreguntas ?? 0), 0);
  const dominioGlobal = totalPreguntas > 0
    ? Number(((totalDominadas / totalPreguntas) * 100).toFixed(1))
    : 0;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>{temaNombre}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          {bloques.length} bloques
          {oposicionNombre && <> &middot; {oposicionNombre}</>}
        </p>
      </div>
      <MateriaMaestriaBar dominioGlobal={dominioGlobal} dominadas={totalDominadas} totalPreguntas={totalPreguntas} />
      <MateriaTemasTable
        temas={bloques}
        onPracticar={(bloqueId) => navigate('/', { state: { bloqueId, temaId: Number(id) } })}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        <Link
          to="/configurar-test"
          state={{ temaId: Number(id), oposicionId }}
          style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          Practicar todo el tema
        </Link>
        <Link
          to="/configurar-test"
          state={{ temaId: Number(id), oposicionId, modoSugerido: 'errores' }}
          style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #fde68a', background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Repasar errores
        </Link>
        {oposicionId && (
          <Link
            to={`/oposicion/${oposicionId}`}
            style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            Ver oposición
          </Link>
        )}
      </div>
    </div>
  );
}
