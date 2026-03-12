import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../services/api';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

export default function TestPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const test = useMemo(() => JSON.parse(sessionStorage.getItem('active_test') || 'null'), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');

  if (!test) {
    return <p>No hay test activo.</p>;
  }

  const question = test.preguntas[index];

  const selectAnswer = (preguntaId, opcionId) => {
    setAnswers((prev) => ({ ...prev, [preguntaId]: opcionId }));
  };

  const onSubmit = async () => {
    setError('');
    try {
      const payload = {
        testId: test.testId,
        tiempoSegundos: 0,
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
    }
  };

  return (
    <section className="card">
      <h2>Pregunta {index + 1}</h2>
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
          <button onClick={onSubmit}>Enviar test</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}