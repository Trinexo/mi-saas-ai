export default function TestControles({ index, total, onPrev, onNext, onSubmit, submitting, answered, error }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <button
          disabled={index === 0}
          onClick={onPrev}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', cursor: 'pointer', opacity: index === 0 ? 0.5 : 1 }}
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={index === total - 1}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', cursor: 'pointer', opacity: index === total - 1 ? 0.5 : 1 }}
        >
          Siguiente
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Enviando...' : `Enviar test (${answered}/${total})`}
        </button>
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}
    </>
  );
}
