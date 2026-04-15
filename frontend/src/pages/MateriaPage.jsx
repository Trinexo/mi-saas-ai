import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import MateriaMaestriaBar from '../components/materia/MateriaMaestriaBar';
import MateriaTemasTable from '../components/materia/MateriaTemasTable';

export default function MateriaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    testApi
      .getProgresoTemasByMateria(token, Number(id))
      .then((data) => setTemas(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'No se pudo cargar la materia'))
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

  const materiaNombre = temas[0]?.materiaNombre ?? `Materia #${id}`;
  const oposicionId = temas[0]?.oposicionId ?? null;
  const oposicionNombre = temas[0]?.oposicionNombre ?? null;
  const totalTemas = temas.length;
  const totalDominadas = temas.reduce((sum, t) => sum + (t.dominadas ?? 0), 0);
  const totalPreguntas = temas.reduce((sum, t) => sum + (t.totalPreguntas ?? 0), 0);
  const dominioGlobal = totalPreguntas > 0
    ? Number(((totalDominadas / totalPreguntas) * 100).toFixed(1))
    : 0;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>{materiaNombre}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          {temas.length} temas
          {oposicionNombre && <> &middot; {oposicionNombre}</>}
        </p>
      </div>
      <MateriaMaestriaBar dominioGlobal={dominioGlobal} dominadas={totalDominadas} totalPreguntas={totalPreguntas} />
      <MateriaTemasTable
        temas={temas}
        onPracticar={(temaId) => navigate('/', { state: { temaId, materiaId: Number(id) } })}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        <Link
          to="/configurar-test"
          state={{ materiaId: Number(id), oposicionId }}
          style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          Practicar toda la materia
        </Link>
        <Link
          to="/configurar-test"
          state={{ materiaId: Number(id), oposicionId, modoSugerido: 'errores' }}
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
