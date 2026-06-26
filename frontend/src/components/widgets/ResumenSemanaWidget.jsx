import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

const SECTION = {
  background: '#fff',
  borderRadius: 12,
  padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  marginBottom: 16,
};

const MINI_CARD = {
  background: '#f9fafb',
  borderRadius: 8,
  padding: '10px 14px',
  textAlign: 'center',
  flex: '1 1 100px',
};

export default function ResumenSemanaWidget({ oposicionId, options = {} }) {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [semana, setSemana] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      testApi.getResumenSemana(token, oposicionId, options).catch(() => ({
        testsUltimos7Dias: 0,
        notaMediaUltimos7Dias: 0,
        tiempoMedioSegundosUltimos7Dias: 0,
        aciertosTotalesUltimos7Dias: 0,
      })),
      testApi.getProgresoSemanal(token, oposicionId, options).catch(() => ({
        dias: [],
        testsSemana: 0,
        notaMediaSemana: 0,
      })),
    ]).then(([resumenData, semanaData]) => {
      if (cancelled) return;
      setResumen(resumenData);
      setSemana(semanaData);
    });

    return () => { cancelled = true; };
  }, [token, oposicionId, options?.modo_preparacion, options?.albacer_modulo_id]);

  const testsUltimos7Dias = Number(resumen?.testsUltimos7Dias || 0);
  const tiempoMedioMin = Math.round(Number(resumen?.tiempoMedioSegundosUltimos7Dias || 0) / 60);
  const dias = semana?.dias ?? [];

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Actividad de la semana</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        {testsUltimos7Dias === 0
          ? 'Aún no tienes actividad esta semana'
          : `Llevas ${testsUltimos7Dias} tests esta semana. Buen ritmo.`}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        <div style={MINI_CARD}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{testsUltimos7Dias}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tests 7d</span>
        </div>
        <div style={MINI_CARD}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{Number(resumen?.notaMediaUltimos7Dias || 0).toFixed(2)}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Nota media</span>
        </div>
        <div style={MINI_CARD}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{tiempoMedioMin} min</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Tiempo medio</span>
        </div>
        <div style={MINI_CARD}>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: '#111827' }}>{resumen?.aciertosTotalesUltimos7Dias || 0}</span>
          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>Aciertos</span>
        </div>
      </div>

      {dias.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, color: '#6b7280', marginBottom: 8, flexWrap: 'wrap' }}>
            <span>Distribución diaria</span>
            <span>{semana?.testsSemana ?? 0} tests · nota {Number(semana?.notaMediaSemana ?? 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {dias.map((d) => {
              const tests = Number(d.tests || 0);
              const intensity = Math.min(1, tests / 4);
              const alpha = 0.16 + (intensity * 0.74);
              return (
                <div key={d.fecha} style={{ display: 'grid', gap: 5 }}>
                  <div
                    title={`${d.fecha}: ${tests} test(s)`}
                    style={{ height: 20, borderRadius: 6, background: tests > 0 ? `rgba(22, 163, 74, ${alpha})` : '#e5e7eb' }}
                  />
                  <span style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
                    {new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'narrow' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
