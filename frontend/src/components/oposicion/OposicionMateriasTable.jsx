import { Link } from 'react-router-dom';

export default function OposicionMateriasTable({ materias, oposicionId, onPracticar }) {
  if (materias.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Progreso por materia</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Materia</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Temas</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, minWidth: 140 }}>Maestría</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>% Acierto</th>
              <th style={{ padding: '8px 12px' }} />
            </tr>
          </thead>
          <tbody>
            {materias.map((m) => {
              const color = m.maestria >= 70 ? '#22c55e' : m.maestria >= 40 ? '#f59e0b' : '#ef4444';
              return (
                <tr key={m.materiaId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>
                    <Link to={`/materia/${m.materiaId}`} style={{ color: '#111827', textDecoration: 'none' }}>
                      {m.materiaNombre}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>
                    {m.temasPracticados}/{m.totalTemas}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${m.maestria}%`, height: '100%', background: color, borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{m.maestria}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{m.porcentajeAcierto}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => onPracticar(m.materiaId)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      Practicar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
