/**
 * EvolucionChart — gráfica SVG inline de evolución de nota.
 * Props: data = [{ fecha, nota, tipoTest }]
 */
export default function EvolucionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p style={{ color: '#6b7280', marginTop: '0.75rem' }}>
        Aún no hay suficientes tests para mostrar la evolución.
      </p>
    );
  }

  const W = 600;
  const H = 180;
  const PAD = { top: 16, right: 16, bottom: 36, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const notas = data.map((d) => d.nota);
  const minNota = Math.max(0, Math.min(...notas) - 1);
  const maxNota = Math.min(10, Math.max(...notas) + 1);

  const xScale = (i) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yScale = (v) => PAD.top + innerH - ((v - minNota) / (maxNota - minNota)) * innerH;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.nota)}`).join(' ');
  const area = [
    `${xScale(0)},${PAD.top + innerH}`,
    ...data.map((d, i) => `${xScale(i)},${yScale(d.nota)}`),
    `${xScale(data.length - 1)},${PAD.top + innerH}`,
  ].join(' ');

  const yTicks = [minNota, (minNota + maxNota) / 2, maxNota].map(Math.round);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}
      aria-label="Gráfica de evolución de nota"
    >
      {/* Área rellena */}
      <polygon points={area} fill="rgba(99,102,241,0.12)" />

      {/* Línea de tendencia */}
      <polyline
        points={points}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Puntos */}
      {data.map((d, i) => (
        <g key={i}>
          <circle
            cx={xScale(i)}
            cy={yScale(d.nota)}
            r={5}
            fill="#1d4ed8"
            stroke="#fff"
            strokeWidth={2}
          />
          <title>{`${new Date(d.fecha).toLocaleDateString('es-ES')} · ${d.tipoTest} · ${d.nota}`}</title>
        </g>
      ))}

      {/* Eje Y */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            y1={yScale(v)}
            x2={PAD.left + innerW}
            y2={yScale(v)}
            stroke="#e5e7eb"
            strokeDasharray="4 3"
          />
          <text x={PAD.left - 6} y={yScale(v) + 4} textAnchor="end" fontSize={11} fill="#6b7280">
            {v}
          </text>
        </g>
      ))}

      {/* Eje X — primera y última fecha */}
      <text
        x={xScale(0)}
        y={H - 8}
        textAnchor="middle"
        fontSize={10}
        fill="#6b7280"
      >
        {new Date(data[0].fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
      </text>
      {data.length > 1 && (
        <text
          x={xScale(data.length - 1)}
          y={H - 8}
          textAnchor="middle"
          fontSize={10}
          fill="#6b7280"
        >
          {new Date(data[data.length - 1].fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
        </text>
      )}
    </svg>
  );
}
