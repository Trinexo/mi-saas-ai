import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUserPlan } from '../../hooks/useUserPlan';
import { testApi } from '../../services/testApi';

const LINK_SECONDARY = { padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, textDecoration: 'none' };

export default function ResultAcciones({ activeTest, result }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const { hasAccess } = useUserPlan();

  const puedeReforzar = (result?.errores ?? 0) > 0 && !!activeTest?.temaId;

  const onRefuerzo = async () => {
    const test = await runAction(() =>
      testApi.generateRefuerzo(token, { temaId: Number(activeTest.temaId), numeroPreguntas: Math.min(result.errores, 20) })
    );
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
      <Link to="/configurar-test" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
        Nuevo test
      </Link>

      {puedeReforzar && (
        hasAccess('pro') ? (
          <button
            disabled={isLoading}
            onClick={onRefuerzo}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 14, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Generando...' : '🔁 Reforzar preguntas falladas'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/planes')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            🔒 Reforzar (Pro)
          </button>
        )
      )}

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
