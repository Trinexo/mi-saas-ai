import { Link } from 'react-router-dom';

const LINK_SECONDARY = { padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' };

export default function ResultAcciones({ activeTest }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Link to="/" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
        Nuevo test
      </Link>
      {activeTest?.testId && (
        <Link to={`/revision/${activeTest.testId}`} style={LINK_SECONDARY}>Revisar respuestas</Link>
      )}
      {activeTest?.temaId && (
        <Link to={`/tema/${activeTest.temaId}`} style={LINK_SECONDARY}>Ver tema</Link>
      )}
      {activeTest?.oposicionId && !activeTest?.temaId && (
        <Link to={`/oposicion/${activeTest.oposicionId}`} style={LINK_SECONDARY}>Ver oposición</Link>
      )}
      <Link to="/progreso" style={LINK_SECONDARY}>Ver progreso</Link>
      <Link to="/historial" style={LINK_SECONDARY}>Historial</Link>
    </div>
  );
}
