import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import TemaAcciones from '../components/tema/TemaAcciones';
import TemaMaestriaBar from '../components/tema/TemaMaestriaBar';
import TemaStatsGrid from '../components/tema/TemaStatsGrid';
import TemaTestsTable from '../components/tema/TemaTestsTable';

export default function TemaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const modoOptions = { modo_preparacion: oposicionActiva?.modoPreparacion ?? 'experto' };
  const [bloque, setBloque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    testApi
      .getDetalleBloque(token, Number(id), modoOptions)
      .then((data) => setBloque(data))
      .catch((e) => setError(e.message || 'No se pudo cargar el bloque'))
      .finally(() => setLoading(false));
  }, [token, id, oposicionActiva?.modoPreparacion]);

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
  if (!bloque) return null;
  const isAlbacer = Number(oposicionActiva?.id) === Number(bloque.oposicionId)
    && oposicionActiva?.modoPreparacion === 'albacer';

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>{bloque.bloqueNombre}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          {bloque.temaNombre} &middot; {bloque.oposicionNombre}
        </p>
      </div>

      <TemaMaestriaBar tema={bloque} />
      <TemaStatsGrid tema={bloque} />
      <TemaTestsTable tests={bloque.ultimosTests} />
      <TemaAcciones
        bloqueId={Number(id)}
        temaId={bloque.temaId}
        oposicionId={bloque.oposicionId}
        isAlbacer={isAlbacer}
      />
    </div>
  );
}
