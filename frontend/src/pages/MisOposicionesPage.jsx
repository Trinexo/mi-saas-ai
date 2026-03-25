import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

function formatDate(isoDate) {
  if (!isoDate) return null;
  return new Date(isoDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MisOposicionesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [oposiciones, setOposiciones] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    testApi
      .getMisOposiciones(token)
      .then((data) => setOposiciones(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'No se pudo cargar tus oposiciones'));
  }, [token]);

  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!oposiciones) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Mis oposiciones</span>
      </nav>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '16px 0 4px' }}>Mis oposiciones</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 13 }}>
        {oposiciones.length === 0
          ? 'Todavía no has practicado ninguna oposición.'
          : `${oposiciones.length} ${oposiciones.length === 1 ? 'oposición en progreso' : 'oposiciones en progreso'}`}
      </p>

      {oposiciones.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>Empieza un test desde la página principal para ver tu progreso aquí.</p>
          <Link
            to="/"
            style={{ display: 'inline-block', padding: '10px 24px', background: '#3b82f6', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
          >
            Ir al inicio
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {oposiciones.map((op) => {
            const color = op.maestria >= 70 ? '#22c55e' : op.maestria >= 40 ? '#f59e0b' : '#ef4444';
            const pctAcierto = op.respondidas > 0
              ? Math.round((op.aciertos / op.respondidas) * 100)
              : 0;
            return (
              <div
                key={op.oposicionId}
                style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', cursor: 'pointer', transition: 'box-shadow .15s' }}
                onClick={() => navigate(`/oposicion/${op.oposicionId}`)}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.08)'; }}
              >
                {/* Cabecera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{op.nombre}</h2>
                    {op.ultimaPractica && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                        Última práctica: {formatDate(op.ultimaPractica)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/', { state: { oposicionId: op.oposicionId } }); }}
                    style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
                  >
                    Practicar
                  </button>
                </div>

                {/* Barra maestría */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Maestría</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color }}>{op.maestria}%</span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${op.maestria}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s' }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Preguntas respondidas', value: `${op.respondidas} / ${op.totalPreguntas}` },
                    { label: '% Acierto', value: `${pctAcierto}%` },
                    { label: 'Tests realizados', value: op.testsRealizados },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#334155' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
