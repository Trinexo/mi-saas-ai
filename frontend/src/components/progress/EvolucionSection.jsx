import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const MODO_COLOR = {
  adaptativo: '#1d4ed8', normal: '#3b82f6', repaso: '#f59e0b',
  simulacro: '#ef4444', refuerzo: '#22c55e', marcadas: '#ec4899',
};

export default function EvolucionSection() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    testApi.evolucionStats(token, 30)
      .then((d) => { if (!cancelled) setData(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading || !data || data.length < 2) return null;

  const notas = data.map((e) => Number(e.nota));
  const max = 10;
  const BAR_W = Math.max(24, Math.min(48, Math.floor(600 / data.length) - 6));

  return (
    <div style={{ marginTop: '1.5rem', background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Evoluci\u00f3n de nota ({data.length} \u00faltimos tests)</h3>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Nota media: <strong style={{ color: '#111827' }}>{(notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)}</strong></span>
      </div>

      {/* L\u00ednea de aprobado */}
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, minWidth: data.length * (BAR_W + 4), height: 160, paddingBottom: 28, position: 'relative' }}>
          {/* L\u00ednea de 5 (aprobado) */}
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: 28 + (5 / max) * 132,
            borderTop: '1.5px dashed #cbd5e1', zIndex: 1,
            display: 'flex', alignItems: 'center',
          }}>
            <span style={{ position: 'absolute', right: 0, fontSize: 10, color: '#94a3b8', background: '#fff', paddingLeft: 3 }}>5.0</span>
          </div>

          {data.map((e, i) => {
            const nota = Number(e.nota);
            const barH = Math.round((nota / max) * 132);
            const color = nota >= 7 ? '#22c55e' : nota >= 5 ? '#3b82f6' : '#ef4444';
            const modoColor = MODO_COLOR[e.tipoTest] ?? '#94a3b8';
            const fecha = new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            return (
              <div
                key={i}
                title={`${fecha} \u00b7 ${e.tipoTest ?? ''} \u00b7 Nota: ${nota.toFixed(2)}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', zIndex: 2 }}
              >
                {/* Valor encima */}
                <span style={{ fontSize: 9, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>{nota.toFixed(1)}</span>
                {/* Barra */}
                <div style={{
                  width: BAR_W, height: barH,
                  background: color, borderRadius: '4px 4px 0 0',
                  borderBottom: `3px solid ${modoColor}`,
                  transition: 'height 0.4s ease',
                }} />
                {/* Fecha */}
                <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, transform: 'rotate(-30deg)', transformOrigin: 'top left', whiteSpace: 'nowrap', display: 'block', position: 'absolute', bottom: 4 }}>
                  {fecha}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda modos */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        {Object.entries(MODO_COLOR).map(([modo, color]) => (
          <span key={modo} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
            {modo}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} /> &ge;7
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} /> 5–7
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> &lt;5
        </span>
      </div>
    </div>
  );
}
