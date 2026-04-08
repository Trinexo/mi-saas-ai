import { Link } from 'react-router-dom';

const BTN = { padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
const BTN_PRIMARY = { ...BTN, background: '#6366f1', color: '#fff', border: 'none' };
const BTN_WARN = { ...BTN, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };

export default function ReviewAcciones({ testInfo, errores = 0, onNuevoTest, onVerProgreso }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '2rem' }}>
      <button style={BTN_PRIMARY} onClick={onNuevoTest}>
        Nuevo test
      </button>
      <button style={BTN} onClick={onVerProgreso}>
        Ver progreso
      </button>
      {errores > 0 && (
        <Link
          to="/configurar-test"
          state={{ modoSugerido: 'marcadas' }}
          style={BTN_WARN}
        >
          Repetir errores ({errores})
        </Link>
      )}
      {testInfo?.temaId && (
        <Link to={`/tema/${testInfo.temaId}`} style={BTN}>
          Ver tema
        </Link>
      )}
      {testInfo?.oposicionId && (
        <Link to={`/oposicion/${testInfo.oposicionId}`} style={BTN}>
          Ver oposici&oacute;n
        </Link>
      )}
    </div>
  );
}
