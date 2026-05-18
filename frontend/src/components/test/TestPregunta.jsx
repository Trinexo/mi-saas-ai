const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

const DIFICULTAD_BADGE = {
  facil:   { label: 'Fácil',    bg: '#dcfce7', color: '#166534' },
  media:   { label: 'Media',    bg: '#fef9c3', color: '#854d0e' },
  dificil: { label: 'Difícil',  bg: '#fee2e2', color: '#991b1b' },
};

export default function TestPregunta({ question, answers, onSelect, feedbackMode = false, confirmed = false, index = 0, total = 1, marcada = false, onToggleMarcada, onReportar }) {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pregunta {index + 1} de {total}</span>
          {feedbackMode && confirmed && (
            <span style={{ fontSize: '0.75rem', color: answers[question.id] === question.opcionCorrectaId ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {answers[question.id] === question.opcionCorrectaId ? '✓ Correcta' : '✗ Incorrecta'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onToggleMarcada && (
            <button
              onClick={onToggleMarcada}
              title={marcada ? 'Quitar marca' : 'Marcar pregunta'}
              style={{
                background: marcada ? '#fffbeb' : 'none',
                border: marcada ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                fontSize: '0.9rem', color: marcada ? '#d97706' : '#9ca3af', lineHeight: 1,
              }}
            >
              🔖
            </button>
          )}
          {onReportar && (
            <button
              onClick={onReportar}
              title="Reportar pregunta"
              style={{
                background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1,
              }}
            >
              ⚠️
            </button>
          )}
        </div>
      </div>
      {question.imagen_url && (
        <div style={{ margin: '0 0 0.75rem', textAlign: 'center' }}>
          <img
            src={`${BACKEND_BASE}${question.imagen_url}`}
            alt="Imagen de la pregunta"
            style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid #e5e7eb', objectFit: 'contain' }}
          />
        </div>
      )}
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
      {feedbackMode && confirmed && question.nivel_dificultad && (() => {
        const d = DIFICULTAD_BADGE[question.nivel_dificultad];
        return d ? (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: d.bg, color: d.color }}>
              Dificultad: {d.label}
            </span>
          </div>
        ) : null;
      })()}
      {feedbackMode && confirmed && question.audio_url && (
        <div style={{ marginTop: 6 }}>
          <audio controls src={`${BACKEND_BASE}${question.audio_url}`} style={{ width: '100%', height: 36 }} />
        </div>
      )}
    </>
  );
}
