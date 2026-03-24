import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TemaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
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

  const maestriaColor = tema.maestria >= 70 ? '#22c55e' : tema.maestria >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      {/* Breadcrumb */}
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

      {/* Tarjetas de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Preguntas totales', value: tema.totalPreguntas },
          { label: 'Respondidas', value: tema.respondidas },
          { label: 'Aciertos', value: tema.aciertos, color: '#22c55e' },
          { label: 'Errores', value: tema.errores, color: '#ef4444' },
          { label: '% Acierto', value: `${tema.porcentajeAcierto}%` },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: color || '#1e293b' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra de maestría */}
      <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Maestría</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: maestriaColor }}>{tema.maestria}%</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${tema.maestria}%`, height: '100%', background: maestriaColor, borderRadius: 999, transition: 'width .4s' }} />
        </div>
        {tema.ultimaPractica && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
            Última práctica: {new Date(tema.ultimaPractica).toLocaleDateString('es-ES')}
          </p>
        )}
      </section>

      {/* Últimos tests */}
      {tema.ultimosTests.length > 0 && (
        <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Últimos tests en este tema</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Nota</th>
                  <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Aciertos</th>
                  <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Errores</th>
                  <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Tiempo</th>
                  <th style={{ padding: '6px 10px' }} />
                </tr>
              </thead>
              <tbody>
                {tema.ultimosTests.map((t) => {
                  const notaColor = t.nota >= 5 ? '#22c55e' : '#ef4444';
                  return (
                    <tr key={t.testId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', color: '#475569', fontSize: 13 }}>
                        {new Date(t.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: notaColor }}>
                        {Number(t.nota).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>{t.aciertos}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{t.errores}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                        {formatTime(t.tiempoSegundos) ?? '—'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <Link
                          to={`/revision/${t.testId}`}
                          style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                        >
                          Revisar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Acción */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/', { state: { temaId: Number(id), materiaId: tema.materiaId, oposicionId: tema.oposicionId } })}
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          Practicar este tema
        </button>
        <Link
          to={`/materia/${tema.materiaId}`}
          style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Ver materia
        </Link>
      </div>
    </main>
  );
}
