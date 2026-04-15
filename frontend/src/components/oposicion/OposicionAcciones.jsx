import { Link } from 'react-router-dom';

export default function OposicionAcciones({ id }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 28 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Acciones rápidas</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to="/configurar-test"
          state={{ oposicionId: Number(id) }}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, textDecoration: 'none' }}
        >
          Test oposición completa
        </Link>
        <Link
          to="/progreso"
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 14, textDecoration: 'none' }}
        >
          Ver progreso detallado
        </Link>
      </div>
    </div>
  );
}
