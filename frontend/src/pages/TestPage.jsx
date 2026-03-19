import { useEffect, useMemo, useRef, useState } from 'react';
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

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!test) {
    return <p>No hay test activo.</p>;
  }

  const question = test.preguntas[index];

  const selectAnswer = (preguntaId, opcionId) => {
    setAnswers((prev) => ({ ...prev, [preguntaId]: opcionId }));
  };

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const tiempoSegundos = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const payload = {
        testId: test.testId,
        tiempoSegundos,
        respuestas: test.preguntas.map((item) => ({
          preguntaId: item.id,
          respuestaId: answers[item.id] || null,
        })),
      };

      const result = await testApi.submit(token, payload);
      sessionStorage.setItem('last_result', JSON.stringify(result));
      navigate('/resultado');
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  };

  const answered = Object.keys(answers).length;

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Pregunta {index + 1} / {test.preguntas.length}</h2>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1rem', color: '#6b7280' }}>
          ⏱ {formatTime(elapsed)}
        </span>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 0 }}>
        {answered} / {test.preguntas.length} respondidas
      </p>
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
        {index < test.preguntas.length - 1 ? (
          <button onClick={() => setIndex(index + 1)}>Siguiente</button>
        ) : (
          <button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar test'}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}