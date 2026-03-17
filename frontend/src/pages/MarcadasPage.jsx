import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { marcadasApi } from '../services/marcadasApi';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

const DIFICULTAD_LABEL = { 1: 'Fácil', 2: 'Media', 3: 'Difícil' };

export default function MarcadasPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState(null);
  const { error, isLoading, runAction } = useAsyncAction();

  useEffect(() => {
    runAction(() => marcadasApi.getMarcadas(token)).then((data) => {
      if (Array.isArray(data)) setPreguntas(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onDesmarcar = async (preguntaId) => {
    await marcadasApi.desmarcar(token, preguntaId);
    setPreguntas((prev) => prev.filter((p) => p.id !== preguntaId));
  };

  const onPracticar = async () => {
    const numeroPreguntas = Math.min(preguntas.length, 20);
    const test = await runAction(() =>
      testApi.generate(token, { modo: 'marcadas', numeroPreguntas }),
    );
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!preguntas) return <p>Cargando preguntas marcadas...</p>;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Preguntas marcadas ★</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={onPracticar}
            disabled={preguntas.length === 0 || isLoading}
            title={preguntas.length === 0 ? 'Marca primero alguna pregunta' : `Practicar con ${Math.min(preguntas.length, 20)} preguntas`}
          >
            {isLoading ? 'Generando...' : '▶ Practicar'}
          </button>
          <Link to="/progreso">← Volver al progreso</Link>
        </div>
      </div>

      {preguntas.length === 0 ? (
        <p style={{ color: '#6b7280' }}>
          No tienes preguntas marcadas. Puedes marcar preguntas desde la pantalla de revisión de un test.
        </p>
      ) : (
        <div className="review-list">
          {preguntas.map((pregunta) => (
            <div key={pregunta.id} className="review-question">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>{pregunta.enunciado}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '4px 0 0' }}>
                    {pregunta.temaNombre} · {DIFICULTAD_LABEL[pregunta.nivelDificultad] ?? '—'}
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => onDesmarcar(pregunta.id)}
                  title="Quitar marca"
                >
                  ☆ Quitar
                </button>
              </div>
              {pregunta.explicacion && (
                <div className="review-explanation" style={{ marginTop: '0.75rem' }}>
                  {pregunta.explicacion}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
