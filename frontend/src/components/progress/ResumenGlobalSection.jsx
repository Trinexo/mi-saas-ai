import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';
import { getErrorMessage } from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/* ── Paleta ────────────────────────────────────────── */
const O   = '#ea580c';
const OBG = '#fff7ed';
const BD  = '#e5e7eb';
const DK  = '#111827';
const G   = '#374151';
const GL  = '#9ca3af';

const CARD = { background: '#fff', borderRadius: 16, border: `1px solid ${BD}`, boxShadow: '0 1px 4px rgba(0,0,0,.06)' };

function formatTime(segundos) {
  if (!segundos) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* Tooltip para donut */
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
      <span style={{ fontWeight: 700, color: DK }}>{payload[0].name}: </span>
      <span style={{ color: payload[0].payload.color }}>{payload[0].value}</span>
    </div>
  );
}

export default function ResumenGlobalSection({ oposicionId, modoPreparacion = 'experto', options = null }) {
  const { token } = useAuth();
  const { isMobile } = useBreakpoint();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const queryOptions = options ?? { modo_preparacion: modoPreparacion };
    testApi
      .userStats(token, oposicionId, queryOptions)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e, 'No se pudo cargar el progreso')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, oposicionId, modoPreparacion, options]);

  if (error) return (
    <div style={{ display: 'flex', gap: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}>
      <span>⚠️</span>{error}
    </div>
  );
  if (loading || !stats) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `4px solid ${OBG}`, borderTopColor: O, animation: 'spin .8s linear infinite' }} />
    </div>
  );

  const totalRespondidas = (stats.aciertos || 0) + (stats.errores || 0) + (stats.blancos || 0);
  const pctAcierto = totalRespondidas > 0 ? Math.round((stats.aciertos / totalRespondidas) * 100) : 0;

  const donutData = [
    { name: 'Aciertos', value: stats.aciertos || 0, color: '#16a34a' },
    { name: 'Errores',  value: stats.errores  || 0, color: '#dc2626' },
    { name: 'En blanco',value: stats.blancos  || 0, color: GL       },
  ].filter((d) => d.value > 0);

  const kpis = [
    { value: stats.totalTests,                  label: 'Tests realizados',   icon: '📝', color: '#2563eb', bg: '#eff6ff'  },
    { value: `${pctAcierto}%`,                  label: 'Tasa de acierto',    icon: '🎯', color: O,         bg: OBG        },
    { value: Number(stats.notaMedia).toFixed(2),label: 'Nota media',         icon: '⭐', color: '#16a34a', bg: '#f0fdf4'  },
    { value: formatTime(stats.tiempoMedio),     label: 'Tiempo medio/test',  icon: '⏱', color: '#9333ea', bg: '#fdf4ff'  },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>

      {/* KPIs */}
      <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          {kpis.map(({ value, label, icon, color, bg }) => (
            <div key={label} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: DK, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: GL, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra acierto/error/blanco */}
        <div style={{ ...CARD, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Distribución de respuestas</div>
          <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 10 }}>
            {donutData.map((d) => (
              <div key={d.name} style={{ flex: d.value, background: d.color, minWidth: 4 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {donutData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: G }}>{d.name}: <strong style={{ color: DK }}>{d.value}</strong></span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: GL }}>{totalRespondidas} totales</div>
          </div>
        </div>
      </div>

      {/* Donut */}
      {donutData.length > 0 && (
        <div style={{ ...CARD, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 180, flex: '0 0 auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Aciertos</div>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                  {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: DK, lineHeight: 1 }}>{pctAcierto}%</div>
              <div style={{ fontSize: '0.62rem', color: GL }}>acierto</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, width: '100%' }}>
            {donutData.map((d) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span style={{ color: G, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: d.color, display: 'inline-block' }} />{d.name}
                </span>
                <strong style={{ color: DK }}>{totalRespondidas > 0 ? `${Math.round((d.value / totalRespondidas) * 100)}%` : '—'}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
