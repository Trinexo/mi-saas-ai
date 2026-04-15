function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestTimer({ index, total, answered, elapsed, remaining, duracion }) {
  const isUrgent  = remaining != null && remaining <= 300 && remaining > 60;  // < 5 min
  const isWarning = remaining != null && remaining <= 60  && remaining > 0;   // < 1 min
  const isExpired = remaining === 0;

  const timerColor = isExpired ? '#dc2626'
    : isWarning               ? '#dc2626'
    : isUrgent                ? '#d97706'
    : '#6b7280';

  const timerLabel = remaining != null
    ? `⏳ ${formatTime(remaining)}`
    : `⏱ ${formatTime(elapsed)}`;

  const pctRespondidas = total > 0 ? Math.round((answered / total) * 100) : 0;
  const pctTiempo = duracion > 0 && remaining != null
    ? Math.max(0, Math.round((remaining / duracion) * 100))
    : null;

  // Animación de parpadeo cuando queda < 1 min
  const pulseStyle = (isWarning || isExpired) ? {
    animation: 'timerPulse 0.8s ease-in-out infinite',
  } : {};

  return (
    <>
      <style>{`
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>Pregunta {index + 1} <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ {total}</span></h2>
        <span style={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: '1rem',
          color: timerColor,
          fontWeight: (isUrgent || isWarning || isExpired) ? 700 : 500,
          ...pulseStyle,
        }}>
          {timerLabel}
        </span>
      </div>

      {/* Barra de progreso de respuestas */}
      <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', marginBottom: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pctRespondidas}%`, background: '#22c55e', borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.75rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{answered} / {total} respondidas</span>
        <span>{pctRespondidas}%</span>
      </p>

      {/* Barra de tiempo restante */}
      {pctTiempo !== null && (
        <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pctTiempo}%`,
            background: (isExpired || isWarning) ? '#dc2626' : isUrgent ? '#f59e0b' : '#1d4ed8',
            borderRadius: 2,
            transition: 'width 1s linear',
          }} />
        </div>
      )}

      {isUrgent && !isWarning && !isExpired && (
        <p style={{ color: '#d97706', fontSize: '0.82rem', margin: '-4px 0 10px', fontWeight: 600 }}>
          ⚠ Menos de 5 minutos. El test se enviará automáticamente al terminar.
        </p>
      )}
      {isWarning && !isExpired && (
        <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '-4px 0 10px', fontWeight: 700, ...pulseStyle }}>
          🚨 ¡Menos de 1 minuto! El test se enviará automáticamente.
        </p>
      )}
    </>
  );
}
