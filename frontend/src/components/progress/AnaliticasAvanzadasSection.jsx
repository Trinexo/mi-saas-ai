import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';
import { catalogApi } from '../../services/catalogApi';

const CARD = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' };
const KPI = { background: '#f9fafb', borderRadius: 8, padding: '12px 16px', textAlign: 'center', flex: '1 1 120px' };

function KpiValue({ value, label, color }) {
  return (
    <div style={KPI}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: color ?? '#111827', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function HBar({ pct }) {
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function TendenciaBadge({ tendencia }) {
  const MAP = {
    subiendo:   { bg: '#dcfce7', color: '#166534', text: '↑ Tendencia positiva'   },
    mejorando:  { bg: '#dcfce7', color: '#166534', text: '↑ Mejorando'             },
    bajando:    { bg: '#fee2e2', color: '#991b1b', text: '↓ Tendencia descendente' },
    empeorando: { bg: '#fee2e2', color: '#991b1b', text: '↓ Empeorando'            },
    estable:    { bg: '#f1f5f9', color: '#475569', text: '→ Estable'               },
  };
  const s = MAP[tendencia] ?? MAP.estable;
  return (
    <span style={{ display: 'inline-block', background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: 999, padding: '3px 12px' }}>
      {s.text}
    </span>
  );
}

export default function AnaliticasAvanzadasSection() {
  const { token } = useAuth();

  // --- Rendimiento profundo ---
  const [eficiencia, setEficiencia]         = useState(null);
  const [balance, setBalance]               = useState(null);
  const [insight, setInsight]               = useState(null);
  const [ritmo, setRitmo]                   = useState(null);

  // --- Progreso por materia ---
  const [oposiciones, setOposiciones]       = useState([]);
  const [selOposicion, setSelOposicion]     = useState('');
  const [progMaterias, setProgMaterias]     = useState(null);
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  // Carga en paralelo de métricas de rendimiento
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      testApi.getEficienciaTiempo(token).catch(() => null),
      testApi.getBalancePrecision(token).catch(() => null),
      testApi.getInsightMensual(token).catch(() => null),
      testApi.getRitmoPregunta(token).catch(() => null),
    ]).then(([ef, bal, ins, rit]) => {
      if (cancelled) return;
      setEficiencia(ef);
      setBalance(bal);
      setInsight(ins);
      setRitmo(rit);
    });
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  // Progreso por materia cuando cambia oposición
  useEffect(() => {
    if (!selOposicion) { setProgMaterias(null); return; }
    let cancelled = false;
    setLoadingMaterias(true);
    setProgMaterias(null);
    testApi.getProgresoMaterias(token, selOposicion)
      .then((d) => { if (!cancelled) setProgMaterias(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setProgMaterias([]); })
      .finally(() => { if (!cancelled) setLoadingMaterias(false); });
    return () => { cancelled = true; };
  }, [token, selOposicion]);

  const tiempoMedioMin = Math.round(Number(eficiencia?.tiempoMedioPorTestSegundos ?? 0) / 60);
  const pctAcierto = Number(balance?.porcentajeAcierto ?? 0);
  const pctError   = Number(balance?.porcentajeError   ?? 0);
  const pctBlanco  = Number(balance?.porcentajeBlanco  ?? 0);
  const deltaNota  = Number(insight?.deltaNota7Dias ?? 0);

  return (
    <div style={{ marginTop: '2rem' }}>

      {/* Cabecera de sección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Analíticas avanzadas</h2>
        <span style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.7rem', borderRadius: 6, padding: '2px 8px' }}>Elite</span>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: 13 }}>
        Métricas detalladas de eficiencia, tendencia de aprendizaje y progreso por materia.
      </p>

      {/* ── Bloque 1: Rendimiento profundo ── */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Rendimiento profundo</h3>
          {insight?.tendencia && <TendenciaBadge tendencia={insight.tendencia} />}
        </div>

        {/* Fila KPIs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <KpiValue value={eficiencia?.testsAnalizados ?? '—'} label="Tests analizados" />
          <KpiValue value={`${tiempoMedioMin} min`}           label="Tiempo medio/test" />
          <KpiValue
            value={Number(eficiencia?.aciertosPorMinuto ?? 0).toFixed(2)}
            label="Aciertos / min"
            color="#1d4ed8"
          />
          <KpiValue
            value={`${Number(ritmo?.segundosMediosPorPregunta ?? 0).toFixed(0)}s`}
            label="Seg / pregunta"
          />
          <KpiValue
            value={deltaNota >= 0 ? `+${deltaNota.toFixed(2)}` : deltaNota.toFixed(2)}
            label="Delta nota 7d"
            color={deltaNota >= 0 ? '#22c55e' : '#ef4444'}
          />
          <KpiValue
            value={Number(insight?.notaMediaUltimos30Dias ?? 0).toFixed(2)}
            label="Nota media 30d"
          />
        </div>

        {/* Barra distribución acierto/error/blanco */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6 }}>
            <span>Distribución de respuestas</span>
            <span style={{ display: 'flex', gap: 14 }}>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ {pctAcierto.toFixed(1)}%</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ {pctError.toFixed(1)}%</span>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>— {pctBlanco.toFixed(1)}%</span>
            </span>
          </div>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#f1f5f9' }}>
            <div style={{ width: `${pctAcierto}%`, background: '#22c55e', transition: 'width 0.4s' }} />
            <div style={{ width: `${pctError}%`,   background: '#ef4444', transition: 'width 0.4s' }} />
            <div style={{ width: `${pctBlanco}%`,  background: '#d1d5db', transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Insight textual */}
        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pctBlanco > 20 && (
            <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '3px 10px' }}>
              💡 Muchas respuestas en blanco — practica con tests más cortos y cronometrados
            </span>
          )}
          {pctBlanco <= 20 && pctError > 35 && (
            <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '3px 10px' }}>
              💡 Tasa de error alta — refuerza los temas débiles
            </span>
          )}
          {eficiencia?.tendenciaTiempo === 'mejorando' && (
            <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '3px 10px' }}>
              💡 Tu ritmo de resolución está mejorando
            </span>
          )}
          {eficiencia?.tendenciaTiempo === 'empeorando' && (
            <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '3px 10px' }}>
              💡 Tu tiempo medio ha subido — conviene practicar bloques cortos
            </span>
          )}
          {insight?.tendencia === 'bajando' && (
            <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '3px 10px' }}>
              💡 Tendencia descendente — repasa los temas de esta semana
            </span>
          )}
        </div>
      </div>

      {/* ── Bloque 2: Comparativa mensual ── */}
      {insight && (
        <div style={{ ...CARD, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Comparativa mensual</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { label: 'Tests (30d)',    value: insight.testsUltimos30Dias,                        color: '#1d4ed8' },
              { label: 'Aciertos (30d)', value: insight.aciertosUltimos30Dias,                     color: '#22c55e' },
              { label: 'Nota media',     value: Number(insight.notaMediaUltimos30Dias).toFixed(2), color: '#111827' },
              {
                label: 'Variación 7d',
                value: deltaNota >= 0 ? `+${deltaNota.toFixed(2)}` : deltaNota.toFixed(2),
                color: deltaNota >= 0 ? '#22c55e' : '#ef4444',
              },
            ].map(({ label, value, color }) => (
              <KpiValue key={label} value={value} label={label} color={color} />
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: 5 }}>
              <span>Nota media últimos 30 días</span>
              <span style={{ fontWeight: 700, color: Number(insight.notaMediaUltimos30Dias) >= 5 ? '#22c55e' : '#ef4444' }}>
                {Number(insight.notaMediaUltimos30Dias).toFixed(2)}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Number(insight.notaMediaUltimos30Dias) * 10)}%`,
                  height: '100%',
                  background: Number(insight.notaMediaUltimos30Dias) >= 7 ? '#22c55e' : Number(insight.notaMediaUltimos30Dias) >= 5 ? '#3b82f6' : '#ef4444',
                  borderRadius: 999,
                  transition: 'width 0.5s',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bloque 3: Progreso por materia ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Progreso por materia</h3>
          <select
            value={selOposicion}
            onChange={(e) => setSelOposicion(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff' }}
          >
            <option value="">— Selecciona oposición —</option>
            {oposiciones.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
        </div>

        {!selOposicion && (
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>Selecciona una oposición para ver el desglose por materia.</p>
        )}

        {selOposicion && loadingMaterias && (
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>Cargando…</p>
        )}

        {selOposicion && !loadingMaterias && progMaterias !== null && progMaterias.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>Aún no tienes progreso registrado para esta oposición.</p>
        )}

        {progMaterias && progMaterias.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...progMaterias]
              .sort((a, b) => Number(a.porcentajeAcierto ?? 0) - Number(b.porcentajeAcierto ?? 0))
              .map((m) => {
                const pct = Number(m.porcentajeAcierto ?? 0);
                return (
                  <div key={m.materiaId ?? m.materiaNombre} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{m.materiaNombre}</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        {m.aciertos ?? 0}A · {m.errores ?? 0}E · {m.blancos ?? 0}B · {m.totalRespondidas ?? 0} resp.
                      </span>
                    </div>
                    <HBar pct={pct} />
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
