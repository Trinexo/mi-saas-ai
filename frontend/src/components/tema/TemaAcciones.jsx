import { Link } from 'react-router-dom';

export default function TemaAcciones({ onPracticar, materiaId }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <button
        onClick={onPracticar}
        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
      >
        Practicar este tema
      </button>
      <Link
        to={`/materia/${materiaId}`}
        style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
      >
        Ver materia
      </Link>
    </div>
  );
}
