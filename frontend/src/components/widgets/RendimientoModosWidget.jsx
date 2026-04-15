import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function RendimientoModosWidget() {
  const { token } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    testApi.getRendimientoModos(token)
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  }, [token]);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Rendimiento por modo</h2>
      {data.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>Aún no hay datos suficientes por modo en los últimos 30 días.</p>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
            Mejor modo actual: <strong>{data[0].modo}</strong> (nota media {Number(data[0].notaMedia).toFixed(2)})
          </p>
          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Modo', 'Tests', 'Nota media', 'Aciertos', 'Errores'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.modo}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>{item.modo}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>{item.tests}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>{Number(item.notaMedia).toFixed(2)}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>{item.aciertosTotales}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>{item.erroresTotales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
