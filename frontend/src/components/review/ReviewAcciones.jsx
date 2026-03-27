import { Link } from 'react-router-dom';

export default function ReviewAcciones({ testInfo, onNuevoTest, onVerProgreso }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '2rem' }}>
      <button
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        onClick={onNuevoTest}
      >
        Nuevo test
      </button>
      <button
        style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        onClick={onVerProgreso}
      >
        Ver progreso
      </button>
      {testInfo?.temaId && (
        <Link
          to={`/tema/${testInfo.temaId}`}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Ver tema
        </Link>
      )}
      {testInfo?.oposicionId && (
        <Link
          to={`/oposicion/${testInfo.oposicionId}`}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Ver oposición
        </Link>
      )}
    </div>
  );
}
