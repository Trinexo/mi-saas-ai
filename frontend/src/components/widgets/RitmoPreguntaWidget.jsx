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
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Ritmo de resolución</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Number(data?.segundosMediosPorPregunta ?? 0).toFixed(2)} s</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Seg/pregunta</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.preguntasAnalizadas ?? 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Preguntas</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.testsAnalizados ?? 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tests</span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendenciaRitmo === 'mejorando' && 'Tu ritmo está mejorando, mantén la constancia.'}
        {data?.tendenciaRitmo === 'empeorando' && 'Haz bloques más cortos para recuperar velocidad.'}
        {(!data?.tendenciaRitmo || data?.tendenciaRitmo === 'estable') && 'Ritmo estable, puedes subir intensidad progresivamente.'}
      </p>
    </div>
  );
}
