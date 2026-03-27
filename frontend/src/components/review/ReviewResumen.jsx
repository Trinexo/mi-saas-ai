export default function ReviewResumen({ correctas, errores, blancos }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0', flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 600 }}>
        ✓ {correctas} correctas
      </span>
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
        ✗ {errores} errores
      </span>
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#f3f4f6', color: '#374151', fontSize: 12, fontWeight: 600 }}>
        — {blancos} en blanco
      </span>
    </div>
  );
}
