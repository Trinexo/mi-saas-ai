import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

  if (loading) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;

  const materiaNombre = temas[0]?.materiaNombre ?? `Materia #${id}`;
  const oposicionId = temas[0]?.oposicionId ?? null;
  const oposicionNombre = temas[0]?.oposicionNombre ?? null;
  const practicados = temas.filter((t) => t.respondidas > 0).length;
  const totalTemas = temas.length;
  const maestriaGlobal = totalTemas > 0
    ? Number(((practicados / totalTemas) * 100).toFixed(1))
    : 0;
  const colorGlobal = maestriaGlobal >= 70 ? '#22c55e' : maestriaGlobal >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <Link to="/mis-oposiciones" style={{ color: '#64748b', textDecoration: 'none' }}>Mis oposiciones</Link>
        {oposicionId && (
          <>
            <span>›</span>
            <Link to={`/oposicion/${oposicionId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{oposicionNombre}</Link>
          </>
        )}
      </nav>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '16px 0 4px' }}>{materiaNombre}</h1>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 13 }}>
        {practicados} de {totalTemas} temas practicados
      </p>
      <MateriaMaestriaBar maestriaGlobal={maestriaGlobal} colorGlobal={colorGlobal} />
      <MateriaTemasTable
        temas={temas}
        onPracticar={(temaId) => navigate('/', { state: { temaId, materiaId: Number(id) } })}
      />
    </main>
  );
}
