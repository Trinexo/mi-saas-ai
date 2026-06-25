import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const O   = '#ea580c';
const OBG = '#fff7ed';
const BD  = '#e5e7eb';
const DK  = '#111827';
const GL  = '#9ca3af';

/* Tooltip personalizado */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const nota = payload[0]?.value;
  const color = nota >= 7 ? '#16a34a' : nota >= 5 ? '#2563eb' : '#dc2626';
  return (
    <div style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: '0.78rem' }}>
      <div style={{ fontWeight: 700, color: DK, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 800, fontSize: '1rem' }}>{Number(nota).toFixed(2)}</div>
      <div style={{ color: GL, fontSize: '0.68rem' }}>Nota</div>
    </div>
  );
}

export default function EvolucionSection({ oposicionId, modoPreparacion = 'experto' }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    testApi.evolucionStats(token, 30, oposicionId, { modo_preparacion: modoPreparacion })
      .then((d) => { if (!cancelled) setData(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, oposicionId, modoPreparacion]);

  if (loading || !data || data.length < 2) return null;

  const notas  = data.map((e) => Number(e.nota));
  const media  = (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2);
  const tendencia = notas.length >= 2 ? notas[notas.length - 1] - notas[0] : 0;

  const chartData = data.map((e) => ({
    fecha: new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    nota:  Number(Number(e.nota).toFixed(2)),
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BD}`, boxShadow: '0 1px 4px rgba(0,0,0,.06)', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Evolución de nota</div>
          <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>{data.length} últimos tests</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: DK, lineHeight: 1 }}>{media}</div>
            <div style={{ fontSize: '0.68rem', color: GL }}>nota media</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1, color: tendencia >= 0 ? '#16a34a' : '#dc2626' }}>
              {tendencia >= 0 ? '↑' : '↓'} {Math.abs(tendencia).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.68rem', color: GL }}>tendencia</div>
          </div>
        </div>
      </div>

      {/* Gráfica Recharts */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradNota" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={O} stopOpacity={0.25} />
              <stop offset="95%" stopColor={O} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BD} vertical={false} />
          <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: GL }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: GL }} tickLine={false} axisLine={false} tickCount={6} />
          <ReferenceLine y={5} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Aprobado', position: 'insideTopRight', fontSize: 9, fill: GL }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="nota" stroke={O} strokeWidth={2.5} fill="url(#gradNota)" dot={{ r: 3, fill: O, strokeWidth: 0 }} activeDot={{ r: 5, fill: O }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
