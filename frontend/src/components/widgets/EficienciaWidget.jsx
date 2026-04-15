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
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Eficiencia</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{data?.testsAnalizados ?? 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tests analizados</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Math.round(Number(data?.tiempoMedioPorTestSegundos ?? 0) / 60)} min</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tiempo medio/test</span>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: '1 1 100px' }}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Number(data?.aciertosPorMinuto ?? 0).toFixed(2)}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Aciertos/min</span>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {data?.tendenciaTiempo === 'mejorando' && 'Tu ritmo de resolución está mejorando.'}
        {data?.tendenciaTiempo === 'empeorando' && 'Tu tiempo medio ha subido; conviene practicar bloques cortos.'}
        {(!data?.tendenciaTiempo || data?.tendenciaTiempo === 'estable') && 'Mantienes un ritmo estable de resolución.'}
      </p>
    </div>
  );
}
