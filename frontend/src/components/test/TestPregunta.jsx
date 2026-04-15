export default function TestPregunta({ question, answers, onSelect, feedbackMode = false, confirmed = false, index = 0, total = 1 }) {
  const selectedId = answers[question.id];
  const correctId = question.opcionCorrectaId;

  const getOptionStyle = (optionId) => {
    const isSelected = selectedId === optionId;

    if (feedbackMode && confirmed) {
      const isCorrect = optionId === correctId;
      const isWrong = isSelected && !isCorrect;
      if (isCorrect) return {
        textAlign: 'left', padding: '10px 16px', borderRadius: 8,
        border: '2px solid #22c55e', background: '#f0fdf4',
        color: '#15803d', fontWeight: 600, cursor: 'default', fontSize: '0.95rem',
      };
      if (isWrong) return {
        textAlign: 'left', padding: '10px 16px', borderRadius: 8,
        border: '2px solid #ef4444', background: '#fef2f2',
        color: '#dc2626', fontWeight: 600, cursor: 'default', fontSize: '0.95rem',
      };
      return {
        textAlign: 'left', padding: '10px 16px', borderRadius: 8,
        border: '1px solid #e5e7eb', background: '#f9fafb',
        color: '#94a3b8', fontWeight: 400, cursor: 'default', fontSize: '0.95rem',
      };
    }

    return {
      textAlign: 'left', padding: '10px 16px', borderRadius: 8,
      border: isSelected ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
      background: isSelected ? '#dbeafe' : '#f9fafb',
      color: isSelected ? '#1d4ed8' : '#374151',
      fontWeight: isSelected ? 600 : 400,
      cursor: feedbackMode && confirmed ? 'default' : 'pointer',
      fontSize: '0.95rem',
    };
  };

  const canSelect = !feedbackMode || !confirmed;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pregunta {index + 1} de {total}</span>
        {feedbackMode && confirmed && (
          <span style={{ fontSize: '0.75rem', color: answers[question.id] === question.opcionCorrectaId ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
            {answers[question.id] === question.opcionCorrectaId ? '✓ Correcta' : '✗ Incorrecta'}
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 1rem', fontWeight: 500, color: '#111827', lineHeight: 1.5 }}>{question.enunciado}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '1rem 0' }}>
        {question.opciones.map((option) => (
          <button
            key={option.id}
            onClick={() => canSelect && onSelect(question.id, option.id)}
            style={getOptionStyle(option.id)}
          >
            {option.texto}
          </button>
        ))}
      </div>
      {feedbackMode && confirmed && question.explicacion && (
        <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 13, color: '#475569' }}>
          <strong>Explicación:</strong> {question.explicacion}
        </div>
      )}
    </>
  );
}
