import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../services/api';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const test = useMemo(() => JSON.parse(sessionStorage.getItem('active_test') || 'null'), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const duracion = test?.duracionSegundos ?? null;
  const remaining = duracion != null ? Math.max(0, duracion - elapsed) : null;
  const isWarning = remaining != null && remaining <= 60 && remaining > 0;
  const isExpired = remaining === 0;

  const onSubmit = useCallback(async (answersSnapshot) => {
    setError('');
    setSubmitting(true);
    try {
      const tiempoSegundos = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const payload = {
        testId: test.testId,
        tiempoSegundos,
        respuestas: test.preguntas.map((item) => ({
          preguntaId: item.id,
          respuestaId: answersSnapshot[item.id] || null,
        })),
      };

      const result = await testApi.submit(token, payload);
      sessionStorage.setItem('last_result', JSON.stringify(result));
      navigate('/resultado');
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, test]);

  // Referencia estable a answers para el auto-submit
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit cuando el countdown llega a 0
  useEffect(() => {
    if (isExpired && !submitting) {
      onSubmit(answersRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  if (!test) {
    return <p>No hay test activo.</p>;
  }

  const question = test.preguntas[index];

  const selectAnswer = (preguntaId, opcionId) => {
    setAnswers((prev) => ({ ...prev, [preguntaId]: opcionId }));
  };

  const answered = Object.keys(answers).length;

  const timerColor = isExpired ? '#dc2626' : isWarning ? '#d97706' : '#6b7280';
  const timerLabel = remaining != null
    ? `⏳ ${formatTime(remaining)}`
    : `⏱ ${formatTime(elapsed)}`;

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Pregunta {index + 1} / {test.preguntas.length}</h2>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1rem', color: timerColor, fontWeight: isWarning ? 700 : 400 }}>
          {timerLabel}
        </span>
      </div>
      {isWarning && !isExpired && (
        <p style={{ color: '#d97706', fontSize: '0.82rem', margin: '0 0 0.5rem', fontWeight: 600 }}>
          ⚠ Menos de 1 minuto. El test se enviará automáticamente al terminar.
        </p>
      )}
      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 0 }}>
        {answered} / {test.preguntas.length} respondidas
      </p>

      {/* Panel de navegación numérica */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {test.preguntas.map((pregunta, i) => {
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
                border: isCurrent ? '2px solid #2563eb' : '1px solid #d1d5db',
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

      <p>{question.enunciado}</p>
      <div className="options">
        {question.opciones.map((option) => (
          <button
            key={option.id}
            className={answers[question.id] === option.id ? 'selected' : ''}
            onClick={() => selectAnswer(question.id, option.id)}
          >
            {option.texto}
          </button>
        ))}
      </div>

      <div className="actions">
        <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Anterior
        </button>
        <button onClick={() => setIndex(Math.min(index + 1, test.preguntas.length - 1))} disabled={index === test.preguntas.length - 1}>
          Siguiente
        </button>
        <button onClick={() => onSubmit(answers)} disabled={submitting}>
          {submitting ? 'Enviando...' : `Enviar test (${answered}/${test.preguntas.length})`}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}