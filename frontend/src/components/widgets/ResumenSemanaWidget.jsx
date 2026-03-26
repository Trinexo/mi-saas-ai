import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function ResumenSemanaWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getResumenSemana(token)
      .then(setData)
      .catch(() => setData({ testsUltimos7Dias: 0, notaMediaUltimos7Dias: 0, tiempoMedioSegundosUltimos7Dias: 0, aciertosTotalesUltimos7Dias: 0 }));
  }, [token]);

  const tiempoMedioMin = Math.round(Number(data?.tiempoMedioSegundosUltimos7Dias || 0) / 60);

  return (
    <section style={SECTION}>
      <h2>Resumen semanal</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {Number(data?.testsUltimos7Dias || 0) === 0
          ? 'Aún no tienes actividad esta semana'
          : `Llevas ${data?.testsUltimos7Dias || 0} tests esta semana, ¡buen ritmo!`}
      </p>
      <ul>
        <li>Tests (7 días): <strong>{data?.testsUltimos7Dias || 0}</strong></li>
        <li>Nota media: <strong>{Number(data?.notaMediaUltimos7Dias || 0).toFixed(2)}</strong></li>
        <li>Tiempo medio: <strong>{tiempoMedioMin} min</strong></li>
        <li>Aciertos totales: <strong>{data?.aciertosTotalesUltimos7Dias || 0}</strong></li>
      </ul>
    </section>
  );
}
