import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

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

function TendenciaBadge({ tendencia }) {
  const map = {
    subiendo: { bg: '#dcfce7', color: '#166534', text: 'Tendencia positiva' },
    mejorando: { bg: '#dcfce7', color: '#166534', text: 'Mejorando' },
    bajando: { bg: '#fee2e2', color: '#991b1b', text: 'Tendencia descendente' },
    empeorando: { bg: '#fee2e2', color: '#991b1b', text: 'Empeorando' },
    estable: { bg: '#f1f5f9', color: '#475569', text: 'Estable' },
  };
  const style = map[tendencia] ?? map.estable;
  return (
    <span style={{ display: 'inline-block', background: style.bg, color: style.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: 999, padding: '3px 12px' }}>
      {style.text}
    </span>
  );
}

export default function AnaliticasAvanzadasSection({ oposicionId, options = {} }) {
  const { token } = useAuth();
  const [eficiencia, setEficiencia] = useState(null);
  const [balance, setBalance] = useState(null);
  const [insight, setInsight] = useState(null);
  const [ritmo, setRitmo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      testApi.getEficienciaTiempo(token, oposicionId, options).catch(() => null),
      testApi.getBalancePrecision(token, oposicionId, options).catch(() => null),
      testApi.getInsightMensual(token, oposicionId, options).catch(() => null),
      testApi.getRitmoPregunta(token, oposicionId, options).catch(() => null),
    ]).then(([ef, bal, ins, rit]) => {
      if (cancelled) return;
      setEficiencia(ef);
      setBalance(bal);
      setInsight(ins);
      setRitmo(rit);
    });
    return () => { cancelled = true; };
  }, [token, oposicionId, options?.modo_preparacion, options?.albacer_modulo_id]);

  const tiempoMedioMin = Math.round(Number(eficiencia?.tiempoMedioPorTestSegundos ?? 0) / 60);
  const pctAcierto = Number(balance?.porcentajeAcierto ?? 0);
  const pctError = Number(balance?.porcentajeError ?? 0);
  const pctBlanco = Number(balance?.porcentajeBlanco ?? 0);
  const deltaNota = Number(insight?.deltaNota7Dias ?? 0);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Analíticas avanzadas</h2>
        <span style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.7rem', borderRadius: 6, padding: '2px 8px' }}>Elite</span>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: 13 }}>
        Métricas de eficiencia, velocidad, precisión y tendencia mensual de la oposición activa.
      </p>

      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Rendimiento profundo</h3>
          {insight?.tendencia && <TendenciaBadge tendencia={insight.tendencia} />}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <KpiValue value={eficiencia?.testsAnalizados ?? 0} label="Tests analizados" />
          <KpiValue value={`${tiempoMedioMin} min`} label="Tiempo medio/test" />
          <KpiValue value={Number(eficiencia?.aciertosPorMinuto ?? 0).toFixed(2)} label="Aciertos/min" color="#1d4ed8" />
          <KpiValue value={`${Number(ritmo?.segundosMediosPorPregunta ?? 0).toFixed(0)}s`} label="Segundos/pregunta" />
          <KpiValue value={deltaNota >= 0 ? `+${deltaNota.toFixed(2)}` : deltaNota.toFixed(2)} label="Delta nota 7d" color={deltaNota >= 0 ? '#22c55e' : '#ef4444'} />
          <KpiValue value={Number(insight?.notaMediaUltimos30Dias ?? 0).toFixed(2)} label="Nota media 30d" />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
            <span>Distribución de respuestas en los últimos 30 días</span>
            <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>Acierto {pctAcierto.toFixed(1)}%</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Error {pctError.toFixed(1)}%</span>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>Blanco {pctBlanco.toFixed(1)}%</span>
            </span>
          </div>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#f1f5f9' }}>
            <div style={{ width: `${pctAcierto}%`, background: '#22c55e', transition: 'width 0.4s' }} />
            <div style={{ width: `${pctError}%`, background: '#ef4444', transition: 'width 0.4s' }} />
            <div style={{ width: `${pctBlanco}%`, background: '#d1d5db', transition: 'width 0.4s' }} />
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pctBlanco > 20 && (
            <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '3px 10px' }}>
              Muchas respuestas en blanco: practica tests cortos y cronometrados.
            </span>
          )}
          {pctBlanco <= 20 && pctError > 35 && (
            <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '3px 10px' }}>
              Tasa de error alta: refuerza los temas débiles.
            </span>
          )}
          {eficiencia?.tendenciaTiempo === 'mejorando' && (
            <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '3px 10px' }}>
              Tu ritmo de resolución está mejorando.
            </span>
          )}
          {eficiencia?.tendenciaTiempo === 'empeorando' && (
            <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '3px 10px' }}>
              Tu tiempo medio ha subido: conviene practicar bloques cortos.
            </span>
          )}
          {insight?.tendencia === 'bajando' && (
            <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '3px 10px' }}>
              Tendencia descendente: repasa los temas de esta semana.
            </span>
          )}
        </div>
      </div>

      {insight && (
        <div style={{ ...CARD, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Comparativa mensual</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <KpiValue value={insight.testsUltimos30Dias} label="Tests 30d" color="#1d4ed8" />
            <KpiValue value={insight.aciertosUltimos30Dias} label="Aciertos 30d" color="#22c55e" />
            <KpiValue value={Number(insight.notaMediaUltimos30Dias).toFixed(2)} label="Nota media 30d" />
            <KpiValue
              value={deltaNota >= 0 ? `+${deltaNota.toFixed(2)}` : deltaNota.toFixed(2)}
              label="Variación 7d"
              color={deltaNota >= 0 ? '#22c55e' : '#ef4444'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
