import { Link } from 'react-router-dom';

export default function TemaAcciones({ bloqueId, temaId, oposicionId }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Link
        to="/configurar-test"
        state={{ bloqueId, temaId, oposicionId }}
        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
      >
        Practicar este bloque
      </Link>
      <Link
        to={`/tema/${temaId}`}
        style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
      >
        Ver tema
      </Link>
    </div>
  );
}
