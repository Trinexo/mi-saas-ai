import { Link } from 'react-router-dom';

export default function OposicionAcciones({ id, onTestCompleta }) {
  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 28 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Acciones rápidas</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={onTestCompleta}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          Test oposición completa
        </button>
        <Link
          to="/progreso"
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 14, textDecoration: 'none' }}
        >
          Ver progreso detallado
        </Link>
      </div>
    </section>
  );
}
