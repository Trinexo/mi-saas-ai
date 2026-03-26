import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function EficienciaWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getEficienciaTiempo(token)
      .then(setData)
      .catch(() => setData({ tiempoMedioPorTestSegundos: 0, aciertosPorMinuto: 0, testsAnalizados: 0, tendenciaTiempo: 'estable' }));
  }, [token]);

  return (
    <section style={SECTION}>
      <h2>Eficiencia</h2>
      <ul>
        <li>Tests analizados: <strong>{data?.testsAnalizados ?? 0}</strong></li>
        <li>Tiempo medio/test: <strong>{Math.round(Number(data?.tiempoMedioPorTestSegundos ?? 0) / 60)} min</strong></li>
        <li>Aciertos por minuto: <strong>{Number(data?.aciertosPorMinuto ?? 0).toFixed(2)}</strong></li>
      </ul>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendenciaTiempo === 'mejorando' && 'Tu ritmo de resolución está mejorando.'}
        {data?.tendenciaTiempo === 'empeorando' && 'Tu tiempo medio ha subido; conviene practicar bloques cortos.'}
        {(!data?.tendenciaTiempo || data?.tendenciaTiempo === 'estable') && 'Mantienes un ritmo estable de resolución.'}
      </p>
    </section>
  );
}
