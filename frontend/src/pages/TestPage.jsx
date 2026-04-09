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
  const feedbackMode = test?.feedbackInmediato === true;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmed, setConfirmed] = useState({}); // preguntaId → true cuando comprobada
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
  const isCurrentConfirmed = !!confirmed[question.id];

  const selectAnswer = (preguntaId, opcionId) => {
    if (feedbackMode && confirmed[preguntaId]) return;
    setAnswers((prev) => ({ ...prev, [preguntaId]: opcionId }));
  };

  const onComprobar = () => {
    if (!answers[question.id]) return;
    setConfirmed((prev) => ({ ...prev, [question.id]: true }));
  };

  const onNextFeedback = () => {
    setIndex((prev) => Math.min(prev + 1, test.preguntas.length - 1));
  };

  const answered = Object.keys(answers).length;

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      {test?.modo === 'simulacro' && (
        <div style={{ background: '#1e293b', color: '#f1f5f9', padding: '8px 14px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
          <span>🎯</span>
          <span>Simulacro en curso — Las respuestas no se muestran hasta el final</span>
        </div>
      )}
      <TestTimer
        index={index}
        total={test.preguntas.length}
        answered={answered}
        elapsed={elapsed}
        remaining={remaining}
        duracion={duracion}
      />
      {!feedbackMode && (
        <TestNavGrid
          preguntas={test.preguntas}
          answers={answers}
          index={index}
          setIndex={setIndex}
        />
      )}
      <TestPregunta
        question={question}
        answers={answers}
        onSelect={selectAnswer}
        feedbackMode={feedbackMode}
        confirmed={isCurrentConfirmed}
        index={index}
        total={test.preguntas.length}
      />
      <TestControles
        index={index}
        total={test.preguntas.length}
        onPrev={() => setIndex(index - 1)}
        onNext={feedbackMode ? onNextFeedback : () => setIndex(Math.min(index + 1, test.preguntas.length - 1))}
        onSubmit={() => onSubmit(answers)}
        submitting={submitting}
        answered={answered}
        error={error}
        feedbackMode={feedbackMode}
        confirmed={isCurrentConfirmed}
        hasAnswer={!!answers[question.id]}
        onComprobar={onComprobar}
      />
    </section>
  );
}