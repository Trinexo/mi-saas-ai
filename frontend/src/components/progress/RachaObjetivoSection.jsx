import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

export default function RachaObjetivoSection() {
  const { token } = useAuth();
  const [rachaData, setRachaData] = useState(null);
  const [objetivoData, setObjetivoData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    testApi.getRacha(token)
      .then((data) => { if (!cancelled) setRachaData(data); })
      .catch(() => { if (!cancelled) setRachaData(null); });
    testApi.getObjetivoDiario(token)
      .then((data) => { if (!cancelled) setObjetivoData(data); })
      .catch(() => { if (!cancelled) setObjetivoData(null); });
    return () => { cancelled = true; };
  }, [token]);

  if (!rachaData && !objetivoData) return null;

  return (
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
      {rachaData && (
        <div style={{ flex: '1 1 200px', background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <h3 style={{ marginTop: 0 }}>Racha de estudio</h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                🔥 {rachaData.rachaActual}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>días seguidos</div>
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{rachaData.mejorRacha}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>mejor racha</div>
            </div>
            <div>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 999,
                fontSize: '0.8rem',
                background: rachaData.estudioHoy ? '#dcfce7' : '#fee2e2',
                color: rachaData.estudioHoy ? '#166534' : '#991b1b',
              }}>
                {rachaData.estudioHoy ? '✓ Estudiado hoy' : '✗ Sin estudiar hoy'}
              </span>
            </div>
          </div>
          {rachaData.actividad7Dias && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '0.75rem' }}>
              {rachaData.actividad7Dias.map((d) => (
                <div
                  key={d.fecha}
                  title={`${d.fecha}: ${d.tests} test${d.tests !== 1 ? 's' : ''}`}
                  style={{ flex: 1, height: 28, borderRadius: 4, background: d.activo ? '#22c55e' : '#e5e7eb' }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {objetivoData && (
        <div style={{ flex: '1 1 200px', background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <h3 style={{ marginTop: 0 }}>Objetivo diario</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <span>{objetivoData.preguntasRespondidasHoy} preguntas hoy</span>
            <span style={{ color: '#6b7280' }}>meta: {objetivoData.objetivoPreguntasDia}</span>
          </div>
          <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
            <div style={{
              width: `${objetivoData.porcentajeCumplido}%`,
              background: objetivoData.cumplido ? '#22c55e' : '#3b82f6',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem' }}>
            {objetivoData.cumplido
              ? '🎉 ¡Objetivo completado!'
              : `${objetivoData.porcentajeCumplido}% completado`}
          </div>
        </div>
      )}
    </div>
  );
}
