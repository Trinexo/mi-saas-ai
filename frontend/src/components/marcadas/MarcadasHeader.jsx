import { Link } from 'react-router-dom';

export default function MarcadasHeader({ preguntas, preguntasFiltradas, filtroTema, onPracticar, isLoading }) {
  return (
    <>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Marcadas</span>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Preguntas marcadas ★</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {preguntas.length} {preguntas.length === 1 ? 'pregunta marcada' : 'preguntas marcadas'}
            {filtroTema && preguntasFiltradas.length !== preguntas.length
              ? ` · mostrando ${preguntasFiltradas.length} con el filtro activo`
              : ''}
          </p>
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
    </>
  );
}
