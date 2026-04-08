import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import TemaAcciones from '../components/tema/TemaAcciones';
import TemaMaestriaBar from '../components/tema/TemaMaestriaBar';
import TemaStatsGrid from '../components/tema/TemaStatsGrid';
import TemaTestsTable from '../components/tema/TemaTestsTable';

export default function TemaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [tema, setTema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    testApi
      .getDetalleTema(token, Number(id))
      .then((data) => setTema(data))
      .catch((e) => setError(e.message || 'No se pudo cargar el tema'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!tema) return null;

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <Link to={`/oposicion/${tema.oposicionId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{tema.oposicionNombre}</Link>
        <span>›</span>
        <Link to={`/materia/${tema.materiaId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{tema.materiaNombre}</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>{tema.temaNombre}</span>
      </nav>

      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{tema.temaNombre}</h1>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 13 }}>
        {tema.materiaNombre} · {tema.oposicionNombre}
      </p>

      <TemaStatsGrid tema={tema} />
      <TemaMaestriaBar tema={tema} />
      <TemaTestsTable tests={tema.ultimosTests} />
      <TemaAcciones
        temaId={Number(id)}
        materiaId={tema.materiaId}
        oposicionId={tema.oposicionId}
      />
    </main>
  );
}
