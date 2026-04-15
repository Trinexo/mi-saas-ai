import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  if (!resumen) return null;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>{resumen.oposicionNombre}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Resumen de tu progreso en esta oposición</p>
      </div>

      <OposicionMaestriaBar resumen={resumen} />
      <OposicionStatsGrid resumen={resumen} />
      <OposicionAcciones id={id} />
      <OposicionMateriasTable
        materias={materias}
        oposicionId={Number(id)}
        onPracticar={(materiaId) => navigate('/', { state: { materiaId, oposicionId: Number(id) } })}
      />
    </div>
  );
}
