import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const practicados = temas.filter((t) => t.respondidas > 0).length;
  const totalTemas = temas.length;
  const maestriaGlobal = totalTemas > 0
    ? Number(((practicados / totalTemas) * 100).toFixed(1))
    : 0;
  const colorGlobal = maestriaGlobal >= 70 ? '#22c55e' : maestriaGlobal >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>{materiaNombre}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          {practicados} de {totalTemas} temas practicados
          {oposicionNombre && <> &middot; {oposicionNombre}</>}
        </p>
      </div>
      <MateriaMaestriaBar maestriaGlobal={maestriaGlobal} colorGlobal={colorGlobal} />
      <MateriaTemasTable
        temas={temas}
        onPracticar={(temaId) => navigate('/', { state: { temaId, materiaId: Number(id) } })}
      />
    </div>
  );
}
