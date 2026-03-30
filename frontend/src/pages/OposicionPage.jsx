import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import OposicionAcciones from '../components/oposicion/OposicionAcciones';
import OposicionMaestriaBar from '../components/oposicion/OposicionMaestriaBar';
import OposicionMateriasTable from '../components/oposicion/OposicionMateriasTable';
import OposicionStatsGrid from '../components/oposicion/OposicionStatsGrid';

export default function OposicionPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([
      testApi.getResumenOposicion(token, Number(id)),
      testApi.getProgresoMaterias(token, Number(id)),
    ])
      .then(([resumenData, materiasData]) => {
        setResumen(resumenData);
        setMaterias(Array.isArray(materiasData) ? materiasData : []);
      })
      .catch((e) => setError(e.message || 'No se pudo cargar el resumen'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!resumen) return null;

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <Link to="/mis-oposiciones" style={{ color: '#64748b', textDecoration: 'none' }}>Mis oposiciones</Link>
      </nav>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '16px 0 4px' }}>{resumen.oposicionNombre}</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 13 }}>Resumen de tu progreso en esta oposición</p>

      <OposicionMaestriaBar resumen={resumen} />
      <OposicionStatsGrid resumen={resumen} />
      <OposicionAcciones
        id={id}
        onTestCompleta={() => navigate('/', { state: { oposicionId: Number(id), modoOposicionCompleta: true } })}
      />
      <OposicionMateriasTable
        materias={materias}
        oposicionId={Number(id)}
        onPracticar={(materiaId) => navigate('/', { state: { materiaId, oposicionId: Number(id) } })}
      />
    </main>
  );
}
