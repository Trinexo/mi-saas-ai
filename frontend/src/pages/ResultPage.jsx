import { Link } from 'react-router-dom';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };
const DIFICULTAD_LABEL = { mixto: 'Mixto', facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

export default function ResultPage() {
  const result = JSON.parse(sessionStorage.getItem('last_result') || 'null');
  const activeTest = JSON.parse(sessionStorage.getItem('active_test') || 'null');

  if (!result) {
    return <p>No hay resultados para mostrar.</p>;
  }

  const modoLabel = MODO_LABEL[activeTest?.modo] ?? activeTest?.modo ?? '—';
  const dificultadLabel = DIFICULTAD_LABEL[activeTest?.dificultad] ?? activeTest?.dificultad ?? '—';

  return (
    <section className="card">
      <h2>Resultado del test</h2>
      {activeTest && (
        <div className="badges">
          <span className="badge">{modoLabel}</span>
          <span className="badge">{dificultadLabel}</span>
        </div>
      )}
      <ul>
        <li>Aciertos: {result.aciertos}</li>
        <li>Errores: {result.errores}</li>
        <li>Blancos: {result.blancos}</li>
        <li>Nota: {result.nota}</li>
      </ul>
      <div className="actions">
        <Link to="/">Nuevo test</Link>
        <Link to="/progreso">Ver progreso</Link>
        {result.testId && <Link to={`/revision/${result.testId}`}>Ver revisión</Link>}
        <Link to="/historial">Historial</Link>
      </div>
    </section>
  );
}