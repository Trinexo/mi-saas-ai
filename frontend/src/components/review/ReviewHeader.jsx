export default function ReviewHeader({ onVolver }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Revisión del test</h2>
      <button
        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
        onClick={onVolver}
      >
        ← Volver al resultado
      </button>
    </div>
  );
}
