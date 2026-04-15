export default function TestNavGrid({ preguntas, answers, index, setIndex }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
      {preguntas.map((pregunta, i) => {
        const isAnswered = answers[pregunta.id] != null;
        const isCurrent = i === index;
        return (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: isCurrent ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: isCurrent ? '#2563eb' : isAnswered ? '#dcfce7' : '#f9fafb',
              color: isCurrent ? '#fff' : isAnswered ? '#15803d' : '#374151',
              fontWeight: isCurrent ? 700 : 400,
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: 0,
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
