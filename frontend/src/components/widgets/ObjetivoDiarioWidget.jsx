import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function ObjetivoDiarioWidget() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getObjetivoDiario(token)
      .then(setData)
      .catch(() => setData({ objetivoPreguntasDia: 10, preguntasRespondidasHoy: 0, porcentajeCumplido: 0, cumplido: false }));
  }, [token]);

  const respondidas = Number(data?.preguntasRespondidasHoy ?? 0);
  const objetivo = Number(data?.objetivoPreguntasDia ?? 10);
  const pct = Math.min(100, objetivo > 0 ? Math.round((respondidas / objetivo) * 100) : 0);
  const color = pct >= 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  const faltan = Math.max(0, objetivo - respondidas);

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Objetivo de hoy</h2>
      <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 0.4rem' }}>
        <span><strong style={{ fontSize: '1.25rem' }}>{respondidas}</strong> / {objetivo} preguntas</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </p>
      <div style={{ background: '#e5e7eb', borderRadius: 999, height: 12, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
        {data?.cumplido
          ? '¡Objetivo del día completado! ✅'
          : faltan > 0
            ? `Te faltan ${faltan} preguntas para completar tu objetivo`
            : 'Empieza un test para sumar progreso'}
      </p>
    </div>
  );
}
