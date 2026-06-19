import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const CARD = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  overflow: 'hidden',
};

function PctBar({ pct }) {
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

const getRespondidas = (tema) => tema.preguntasRespondidas ?? tema.totalRespondidas ?? tema.intentos ?? 0;

export default function ProgresoTemasOposicionSection({ oposicionId }) {
  const { token } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [temas, setTemas] = useState(null);
  const [orden, setOrden] = useState('pct_asc');

  useEffect(() => {
    if (!oposicionId || !abierto) return undefined;
    let cancelled = false;
    setTemas(null);
    testApi.getProgresoTemasReal(token, oposicionId)
      .then((data) => { if (!cancelled) setTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setTemas([]); });
    return () => { cancelled = true; };
  }, [token, oposicionId, abierto]);

  useEffect(() => {
    setAbierto(false);
    setTemas(null);
  }, [oposicionId]);

  const temasSorted = [...(temas ?? [])].sort((a, b) => {
    if (orden === 'pct_asc') return a.porcentajeAcierto - b.porcentajeAcierto;
    if (orden === 'pct_desc') return b.porcentajeAcierto - a.porcentajeAcierto;
    return getRespondidas(b) - getRespondidas(a);
  });

  const practicados = (temas ?? []).filter((t) => getRespondidas(t) > 0).length;

  return (
    <div style={CARD}>
      <button
        type="button"
        onClick={() => setAbierto((value) => !value)}
        style={{
          width: '100%',
          border: 'none',
          background: '#fff',
          padding: '16px 18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <span>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: '#111827' }}>Progreso por tema</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 13, color: '#64748b' }}>
            Consulta el acierto real y el avance por preguntas cuando quieras ver el detalle.
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#ea580c', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {abierto ? 'Ocultar' : 'Mostrar'}
          <span style={{ fontSize: 16, lineHeight: 1 }}>{abierto ? '⌃' : '⌄'}</span>
        </span>
      </button>

      {abierto && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 18px 18px' }}>
          {!oposicionId && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 18px', color: '#94a3b8', fontSize: 13 }}>
              Selecciona una oposición activa para ver tu progreso por tema.
            </div>
          )}

          {oposicionId && temas === null && (
            <p style={{ color: '#94a3b8', margin: 0 }}>Cargando progreso por tema...</p>
          )}

          {oposicionId && temas?.length === 0 && (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
              Aún no tienes progreso registrado. Completa algunos tests para ver tus estadísticas por tema.
            </p>
          )}

          {oposicionId && temas?.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{practicados}/{temas.length} temas practicados</span>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff' }}
                >
                  <option value="pct_asc">Peor primero</option>
                  <option value="pct_desc">Mejor primero</option>
                  <option value="actividad">Más avanzado</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {temasSorted.map((t) => {
                  const respondidas = getRespondidas(t);
                  const total = t.totalPreguntas ?? 0;
                  const hasProgress = respondidas > 0;
                  return (
                    <div
                      key={t.temaId}
                      style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        padding: '12px 16px',
                        opacity: hasProgress ? 1 : 0.55,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{t.temaNombre}</span>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#64748b', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span>Acierto: {hasProgress ? `${t.porcentajeAcierto}%` : 'sin datos'}</span>
                          <span>Progreso: {respondidas} / {total} preguntas</span>
                          <span>{t.aciertos} correctas</span>
                          <span>{t.errores} falladas</span>
                        </div>
                      </div>
                      {hasProgress
                        ? <PctBar pct={t.porcentajeAcierto} />
                        : <div style={{ height: 7, borderRadius: 999, background: '#f1f5f9' }} />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
