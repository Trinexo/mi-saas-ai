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
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Resumen semanal</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {Number(data?.testsUltimos7Dias || 0) === 0
          ? 'Aún no tienes actividad esta semana'
          : `Llevas ${data?.testsUltimos7Dias || 0} tests esta semana, ¡buen ritmo!`}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.testsUltimos7Dias || 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tests 7d</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Number(data?.notaMediaUltimos7Dias || 0).toFixed(2)}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Nota media</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{tiempoMedioMin} min</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tiempo medio</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.aciertosTotalesUltimos7Dias || 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Aciertos</span>
        </div>
      </div>
    </div>
  );
}
