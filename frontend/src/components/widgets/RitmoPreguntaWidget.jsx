import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function RitmoPreguntaWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getRitmoPregunta(token)
      .then(setData)
      .catch(() => setData({ segundosMediosPorPregunta: 0, preguntasAnalizadas: 0, testsAnalizados: 0, tendenciaRitmo: 'estable' }));
  }, [token]);

  return (
    <section style={SECTION}>
      <h2>Ritmo de resolución</h2>
      <ul>
        <li>Segundos por pregunta: <strong>{Number(data?.segundosMediosPorPregunta ?? 0).toFixed(2)} s</strong></li>
        <li>Preguntas analizadas: <strong>{data?.preguntasAnalizadas ?? 0}</strong></li>
        <li>Tests analizados: <strong>{data?.testsAnalizados ?? 0}</strong></li>
      </ul>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendenciaRitmo === 'mejorando' && 'Tu ritmo está mejorando, mantén la constancia.'}
        {data?.tendenciaRitmo === 'empeorando' && 'Haz bloques más cortos para recuperar velocidad.'}
        {(!data?.tendenciaRitmo || data?.tendenciaRitmo === 'estable') && 'Ritmo estable, puedes subir intensidad progresivamente.'}
      </p>
    </section>
  );
}
