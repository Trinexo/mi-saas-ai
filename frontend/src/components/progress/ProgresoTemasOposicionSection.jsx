import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

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

export default function ProgresoTemasOposicionSection({ oposicionId }) {
  const { token } = useAuth();
  const [temas, setTemas] = useState(null);
  const [orden, setOrden] = useState('pct_asc');

  useEffect(() => {
    if (!oposicionId) { setTemas(null); return; }
    let cancelled = false;
    setTemas(null);
    testApi.getProgresoTemasReal(token, oposicionId)
      .then((data) => { if (!cancelled) setTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setTemas([]); });
    return () => { cancelled = true; };
  }, [token, oposicionId]);

  if (!oposicionId) {
    return (
      <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', color: '#94a3b8', fontSize: 13 }}>
        Selecciona una oposición activa para ver tu progreso por tema.
      </div>
    );
  }

  if (temas === null) {
    return <p style={{ color: '#94a3b8' }}>Cargando progreso por tema...</p>;
  }

  if (temas.length === 0) {
    return (
      <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
        Aún no tienes progreso registrado. Completa algunos tests para ver tus estadísticas por tema.
      </p>
    );
  }

  const temasSorted = [...temas].sort((a, b) => {
    if (orden === 'pct_asc') return a.porcentajeAcierto - b.porcentajeAcierto;
    if (orden === 'pct_desc') return b.porcentajeAcierto - a.porcentajeAcierto;
    return b.intentos - a.intentos;
  });

  const practicados = temas.filter((t) => t.intentos > 0).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Progreso por tema</h2>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{practicados}/{temas.length} temas practicados</span>
      </div>
      <p style={{ color: '#64748b', margin: '4px 0 12px', fontSize: 13 }}>
        Porcentaje de acierto real por tema, calculado desde tus tests finalizados.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151' }}
        >
          <option value="pct_asc">Peor primero (a reforzar)</option>
          <option value="pct_desc">Mejor primero</option>
          <option value="actividad">Más practicado</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {temasSorted.map((t) => (
          <div
            key={t.temaId}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '12px 16px',
              opacity: t.intentos === 0 ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{t.temaNombre}</span>
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#64748b' }}>
                <span>{t.intentos} intentos</span>
                <span>{t.aciertos} ✓</span>
                <span>{t.errores} ✗</span>
                <span style={{ color: '#9ca3af' }}>{t.totalPreguntas} preguntas</span>
              </div>
            </div>
            {t.intentos > 0
              ? <PctBar pct={t.porcentajeAcierto} />
              : <div style={{ height: 7, borderRadius: 999, background: '#f1f5f9' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
