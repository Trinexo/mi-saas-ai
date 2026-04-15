export default function TestControles({ index, total, onPrev, onNext, onSubmit, submitting, answered, error, feedbackMode = false, confirmed = false, hasAnswer = false, onComprobar }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '1.5rem' }}>
        {!feedbackMode && (
          <button
            disabled={index === 0}
            onClick={onPrev}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', cursor: 'pointer', opacity: index === 0 ? 0.5 : 1 }}
          >
            Anterior
          </button>
        )}
        {feedbackMode && !confirmed && (
          <button
            disabled={!hasAnswer}
            onClick={onComprobar}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: hasAnswer ? 'pointer' : 'not-allowed', opacity: hasAnswer ? 1 : 0.5 }}
          >
            Comprobar
          </button>
        )}
        {(!feedbackMode || confirmed) && (
          <button
            onClick={onNext}
            disabled={index === total - 1}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', cursor: 'pointer', opacity: index === total - 1 ? 0.5 : 1 }}
          >
            Siguiente
          </button>
        )}
        {(!feedbackMode || (confirmed && index === total - 1)) && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Enviando...' : feedbackMode ? 'Ver resultado' : `Enviar test (${answered}/${total})`}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', gap: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '8px 14px', marginTop: '0.75rem', fontSize: '0.875rem' }}>
          <span>⚠️</span>{error}
        </div>
      )}
    </>
  );
}
