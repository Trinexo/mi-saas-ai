import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function TemasDebilesWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction, setErrorMessage } = useAsyncAction();
  const [data, setData] = useState([]);

  useEffect(() => {
    testApi.getTemasDebiles(token)
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  }, [token]);

  const onRefuerzo = async () => {
    const top = data[0];
    if (!top?.temaId) {
      setErrorMessage('Todavía no hay datos suficientes para recomendar refuerzo por tema');
      return;
    }
    const test = await runAction(() => testApi.generateRefuerzo(token, { temaId: Number(top.temaId), numeroPreguntas: 10 }));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  return (
    <section style={SECTION}>
      <h2>Tema a reforzar</h2>
      {data[0] ? (
        <>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
            <strong>{data[0].temaNombre}</strong> · {data[0].materiaNombre} · {data[0].oposicionNombre}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
            Acierto actual: {data[0].porcentajeAcierto}% ({data[0].aciertos}A · {data[0].errores}E)
          </p>
          <button disabled={isLoading} onClick={onRefuerzo}>
            {isLoading ? 'Generando...' : 'Hacer refuerzo del tema'}
          </button>
        </>
      ) : (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
          Aún no hay datos suficientes para identificar un tema débil.
        </p>
      )}
    </section>
  );
}
