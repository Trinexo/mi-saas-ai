export default function HistorialStats({ testsLast7Days, bestNoteLast30Days, mejorTestSemana, onReintentar }) {
  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tests últimos 7 días</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{testsLast7Days}</div>
        </div>
        <div style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Mejor nota últimos 30 días</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{bestNoteLast30Days.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => onReintentar(mejorTestSemana.id)} disabled={!mejorTestSemana}>
          Reintentar mejor test semanal
        </button>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          {mejorTestSemana
            ? `Mejor nota 7 días: ${Number(mejorTestSemana.nota).toFixed(2)}`
            : 'No hay tests esta semana'}
        </span>
      </div>
    </>
  );
}
