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
    <section style={SECTION}>
      <h2>Rendimiento por modo</h2>
      {data.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>Aún no hay datos suficientes por modo en los últimos 30 días.</p>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
            Mejor modo actual: <strong>{data[0].modo}</strong> (nota media {Number(data[0].notaMedia).toFixed(2)})
          </p>
          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Modo</th>
                  <th>Tests</th>
                  <th>Nota media</th>
                  <th>Aciertos</th>
                  <th>Errores</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.modo}>
                    <td>{item.modo}</td>
                    <td>{item.tests}</td>
                    <td>{Number(item.notaMedia).toFixed(2)}</td>
                    <td>{item.aciertosTotales}</td>
                    <td>{item.erroresTotales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
