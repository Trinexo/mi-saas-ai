import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

export default function OposicionPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    testApi
      .getResumenOposicion(token, Number(id))
      .then((data) => setResumen(data))
      .catch((e) => setError(e.message || 'No se pudo cargar el resumen'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!resumen) return null;

  const maestriaColor = resumen.maestria >= 70 ? '#22c55e' : resumen.maestria >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <Link to="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Inicio</Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '16px 0 4px' }}>{resumen.oposicionNombre}</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 13 }}>Resumen de tu progreso en esta oposición</p>

      {/* Barra maestra */}
      <section style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Maestría global</span>
          <span style={{ fontWeight: 800, fontSize: 22, color: maestriaColor }}>{resumen.maestria}%</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 14, overflow: 'hidden' }}>
          <div style={{ width: `${resumen.maestria}%`, height: '100%', background: maestriaColor, borderRadius: 999, transition: 'width .4s' }} />
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
          {resumen.temasPracticados} de {resumen.totalTemas} temas practicados
        </p>
      </section>

      {/* Tarjetas de estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Temas totales', value: resumen.totalTemas },
          { label: 'Temas practicados', value: resumen.temasPracticados },
          { label: 'Preguntas respondidas', value: resumen.totalRespondidas },
          { label: 'Tests realizados', value: resumen.testsRealizados },
          { label: '% Acierto medio', value: `${resumen.porcentajeAcierto}%` },
          { label: 'Nota media', value: resumen.notaMedia.toFixed(2) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Acciones rápidas</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/', { state: { oposicionId: Number(id), modoOposicionCompleta: true } })}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            Test oposición completa
          </button>
          <Link
            to="/progreso"
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 14, textDecoration: 'none' }}
          >
            Ver progreso detallado
          </Link>
        </div>
      </section>
    </main>
  );
}
