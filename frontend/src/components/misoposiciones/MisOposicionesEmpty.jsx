import { Link } from 'react-router-dom';

export default function MisOposicionesEmpty() {
  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>Empieza un test desde la página principal para ver tu progreso aquí.</p>
      <Link
        to="/"
        style={{ display: 'inline-block', padding: '10px 24px', background: '#3b82f6', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
      >
        Ir al inicio
      </Link>
    </div>
  );
}
