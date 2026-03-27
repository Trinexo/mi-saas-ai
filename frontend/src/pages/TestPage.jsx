import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../services/api';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import TestControles from '../components/test/TestControles';
import TestNavGrid from '../components/test/TestNavGrid';
import TestPregunta from '../components/test/TestPregunta';
import TestTimer from '../components/test/TestTimer';

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

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <TestTimer
        index={index}
        total={test.preguntas.length}
        answered={answered}
        elapsed={elapsed}
        remaining={remaining}
      />
      <TestNavGrid
        preguntas={test.preguntas}
        answers={answers}
        index={index}
        setIndex={setIndex}
      />
      <TestPregunta
        question={question}
        answers={answers}
        onSelect={selectAnswer}
      />
      <TestControles
        index={index}
        total={test.preguntas.length}
        onPrev={() => setIndex(index - 1)}
        onNext={() => setIndex(Math.min(index + 1, test.preguntas.length - 1))}
        onSubmit={() => onSubmit(answers)}
        submitting={submitting}
        answered={answered}
        error={error}
      />
    </section>
  );
}