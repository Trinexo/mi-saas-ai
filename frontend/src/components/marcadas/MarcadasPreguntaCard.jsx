import { Link } from 'react-router-dom';

const DIFICULTAD_LABEL = { 1: 'Fácil', 2: 'Media', 3: 'Difícil' };

export default function MarcadasPreguntaCard({ pregunta, onDesmarcar }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
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
  );
}
