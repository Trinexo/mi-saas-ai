import { Link } from 'react-router-dom';

export default function ResultPage() {
  const result = JSON.parse(sessionStorage.getItem('last_result') || 'null');

  if (!result) {
    return <p>No hay resultados para mostrar.</p>;
  }

  return (
    <section className="card">
      <h2>Resultado del test</h2>
      <ul>
        <li>Aciertos: {result.aciertos}</li>
        <li>Errores: {result.errores}</li>
        <li>Blancos: {result.blancos}</li>
        <li>Nota: {result.nota}</li>
      </ul>
      <div className="actions">
        <Link to="/">Nuevo test</Link>
        <Link to="/progreso">Ver progreso</Link>
      </div>
    </section>
  );
}