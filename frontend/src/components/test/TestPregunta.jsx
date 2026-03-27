export default function TestPregunta({ question, answers, onSelect }) {
  return (
    <>
      <p>{question.enunciado}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '1rem 0' }}>
        {question.opciones.map((option) => {
          const isSelected = answers[question.id] === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(question.id, option.id)}
              style={{
                textAlign: 'left',
                padding: '10px 16px',
                borderRadius: 8,
                border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                background: isSelected ? '#eef2ff' : '#f8fafc',
                color: isSelected ? '#4338ca' : '#334155',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              {option.texto}
            </button>
          );
        })}
      </div>
    </>
  );
}
