function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestTimer({ index, total, answered, elapsed, remaining }) {
  const isWarning = remaining != null && remaining <= 60 && remaining > 0;
  const isExpired = remaining === 0;
  const timerColor = isExpired ? '#dc2626' : isWarning ? '#d97706' : '#6b7280';
  const timerLabel = remaining != null
    ? `⏳ ${formatTime(remaining)}`
    : `⏱ ${formatTime(elapsed)}`;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Pregunta {index + 1} / {total}</h2>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1rem', color: timerColor, fontWeight: isWarning ? 700 : 400 }}>
          {timerLabel}
        </span>
      </div>
      {isWarning && !isExpired && (
        <p style={{ color: '#d97706', fontSize: '0.82rem', margin: '0 0 0.5rem', fontWeight: 600 }}>
          ⚠ Menos de 1 minuto. El test se enviará automáticamente al terminar.
        </p>
      )}
      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 0 }}>
        {answered} / {total} respondidas
      </p>
    </>
  );
}
