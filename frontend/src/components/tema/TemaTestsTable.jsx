import { Link } from 'react-router-dom';

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TemaTestsTable({ tests }) {
  if (tests.length === 0) return null;

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Últimos tests en este tema</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Nota</th>
              <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Aciertos</th>
              <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Errores</th>
              <th style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Tiempo</th>
              <th style={{ padding: '6px 10px' }} />
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => {
              const notaColor = t.nota >= 5 ? '#22c55e' : '#ef4444';
              return (
                <tr key={t.testId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', color: '#475569', fontSize: 13 }}>
                    {new Date(t.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: notaColor }}>
                    {Number(t.nota).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>{t.aciertos}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{t.errores}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                    {formatTime(t.tiempoSegundos) ?? '—'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <Link
                      to={`/revision/${t.testId}`}
                      style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Revisar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
