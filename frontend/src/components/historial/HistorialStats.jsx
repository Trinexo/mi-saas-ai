const CARD = {
  background: '#fff', borderRadius: 12, padding: '16px 20px',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)', flex: '1 1 160px',
};
const LABEL = { margin: '0 0 4px', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' };

export default function HistorialStats({ testsLast7Days, bestNoteLast30Days, mejorTestSemana, onReintentar }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <div style={CARD}>
        <p style={LABEL}>Tests esta semana</p>
        <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#111827' }}>{testsLast7Days}</p>
      </div>
      <div style={CARD}>
        <p style={LABEL}>Mejor nota (30 d)</p>
        <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: bestNoteLast30Days >= 5 ? '#16a34a' : (bestNoteLast30Days > 0 ? '#dc2626' : '#94a3b8') }}>
          {bestNoteLast30Days > 0 ? bestNoteLast30Days.toFixed(2) : '—'}
        </p>
      </div>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <p style={LABEL}>Mejor test semanal</p>
        {mejorTestSemana ? (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{Number(mejorTestSemana.nota).toFixed(2)}</p>
            <button
              onClick={() => onReintentar(mejorTestSemana.id)}
              style={{ alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 7, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              Repetir
            </button>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Sin tests esta semana</p>
        )}
      </div>
    </div>
  );
}
