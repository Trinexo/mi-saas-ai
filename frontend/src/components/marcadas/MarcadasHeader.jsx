import { Link } from 'react-router-dom';

export default function MarcadasHeader({ preguntas, preguntasFiltradas, filtroTema, onPracticar, isLoading }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Preguntas marcadas</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
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
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: preguntas.length === 0 || isLoading ? 0.5 : 1, fontSize: '0.875rem' }}
        >
          {isLoading ? 'Generando...' : '▶ Practicar'}
        </button>
        <Link to="/progreso" style={{ fontSize: '0.8rem', color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>Ver progreso →</Link>
      </div>
    </div>
  );
}
