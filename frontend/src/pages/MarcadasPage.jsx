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
  const [filtroTema, setFiltroTema] = useState('');
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

  const preguntasFiltradas = preguntas
    ? preguntas.filter((p) =>
        filtroTema === '' ||
        (p.temaNombre ?? '').toLowerCase().includes(filtroTema.toLowerCase()),
      )
    : [];

  if (error) return <p style={{ color: '#dc2626', padding: '1rem' }}>{error}</p>;
  if (!preguntas) return <p>Cargando preguntas marcadas...</p>;

  return (
    <section>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Marcadas</span>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Preguntas marcadas ★</h2>
          {preguntas && (
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {preguntas.length} {preguntas.length === 1 ? 'pregunta marcada' : 'preguntas marcadas'}
              {filtroTema && preguntasFiltradas.length !== preguntas.length
                ? ` · mostrando ${preguntasFiltradas.length} con el filtro activo`
                : ''}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={onPracticar}
            disabled={preguntas.length === 0 || isLoading}
            title={preguntas.length === 0 ? 'Marca primero alguna pregunta' : `Practicar con ${Math.min(preguntas.length, 20)} preguntas`}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: preguntas.length === 0 || isLoading ? 0.6 : 1 }}
          >
            {isLoading ? 'Generando...' : '▶ Practicar'}
          </button>
          <Link to="/progreso" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Ver progreso →</Link>
        </div>
      </div>

      {preguntas && preguntas.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Filtrar por tema..."
            value={filtroTema}
            onChange={(e) => setFiltroTema(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', maxWidth: 320, boxSizing: 'border-box' }}
          />
        </div>
      )}

      {preguntas.length === 0 ? (
        <p style={{ color: '#6b7280' }}>
          No tienes preguntas marcadas. Puedes marcar preguntas desde la pantalla de revisión de un test.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {preguntasFiltradas.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Ningún resultado para «{filtroTema}». Prueba con otro término.</p>
          ) : (
            preguntasFiltradas.map((pregunta) => (
            <div key={pregunta.id} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>{pregunta.enunciado}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '4px 0 0' }}>
                    {pregunta.temaId
                      ? <Link to={`/tema/${pregunta.temaId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{pregunta.temaNombre}</Link>
                      : pregunta.temaNombre}
                    {pregunta.oposicionNombre && (
                      <> · <Link to={`/oposicion/${pregunta.oposicionId}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{pregunta.oposicionNombre}</Link></>
                    )}
                    {' · '}{DIFICULTAD_LABEL[pregunta.nivelDificultad] ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => onDesmarcar(pregunta.id)}
                  title="Quitar marca"
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  ☆ Quitar
                </button>
              </div>
              {pregunta.explicacion && (
                <div style={{ marginTop: '0.75rem', padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, fontSize: 13, color: '#0369a1', border: '1px solid #bae6fd' }}>
                  {pregunta.explicacion}
                </div>
              )}
            </div>
          )))}
        </div>
      )}
    </section>
  );
}
