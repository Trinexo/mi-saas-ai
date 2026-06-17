import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

/* ── Paleta ────────────────────────────────────────── */
const O   = '#ea580c';
const OBG = '#fff7ed';
const BD  = '#e5e7eb';
const DK  = '#111827';
const G   = '#374151';
const GL  = '#9ca3af';
const CARD = { background: '#fff', borderRadius: 16, border: `1px solid ${BD}`, boxShadow: '0 1px 4px rgba(0,0,0,.06)' };

export default function RachaObjetivoSection({ oposicionId }) {
  const { token } = useAuth();
  const [rachaData, setRachaData] = useState(null);
  const [objetivoData, setObjetivoData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    testApi.getRacha(token, oposicionId)
      .then((data) => { if (!cancelled) setRachaData(data); })
      .catch(() => {});
    testApi.getObjetivoDiario(token, oposicionId)
      .then((data) => { if (!cancelled) setObjetivoData(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, oposicionId]);

  if (!rachaData && !objetivoData) return null;

  return (
    <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>

      {/* Racha */}
      {rachaData && (
        <div style={{ ...CARD, flex: '1 1 240px', padding: '20px 20px 16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Racha de estudio</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div style={{ background: '#fff7ed', borderRadius: 12, padding: '10px 14px', textAlign: 'center', minWidth: 68 }}>
              <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>🔥</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{rachaData.rachaActual}</div>
              <div style={{ fontSize: '0.62rem', color: GL, marginTop: 2 }}>días</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: G }}>Mejor racha: <strong style={{ color: DK }}>{rachaData.mejorRacha} días</strong></div>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                  background: rachaData.estudioHoy ? '#dcfce7' : '#fee2e2',
                  color: rachaData.estudioHoy ? '#166534' : '#991b1b',
                }}>
                  {rachaData.estudioHoy ? '✓' : '✗'} {rachaData.estudioHoy ? 'Estudiado hoy' : 'Sin estudiar hoy'}
                </span>
              </div>
            </div>
          </div>

          {rachaData.actividad7Dias?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.67rem', color: GL, marginBottom: 6 }}>Últimos 7 días</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {rachaData.actividad7Dias.map((d) => (
                  <div key={d.fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div
                      title={`${d.fecha}: ${d.tests} test${d.tests !== 1 ? 's' : ''}`}
                      style={{ width: '100%', height: 26, borderRadius: 5, background: d.activo ? '#22c55e' : BD, transition: 'background .2s' }}
                    />
                    <span style={{ fontSize: 8, color: GL }}>
                      {new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Objetivo diario */}
      {objetivoData && (
        <div style={{ ...CARD, flex: '1 1 240px', padding: '20px 20px 18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Objetivo diario</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: DK, lineHeight: 1 }}>{objetivoData.preguntasRespondidasHoy}</span>
            <span style={{ fontSize: '1rem', color: GL }}>/ {objetivoData.objetivoPreguntasDia} preguntas</span>
          </div>

          <div style={{ marginBottom: 8, fontSize: '0.78rem', color: objetivoData.cumplido ? '#16a34a' : G }}>
            {objetivoData.cumplido ? '🎉 ¡Objetivo completado hoy!' : `${objetivoData.porcentajeCumplido}% completado`}
          </div>

          <div style={{ height: 10, borderRadius: 999, background: BD, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{
              width: `${Math.min(objetivoData.porcentajeCumplido, 100)}%`,
              height: '100%',
              background: objetivoData.cumplido ? '#22c55e' : O,
              borderRadius: 999,
              transition: 'width .4s',
            }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: '🎯', val: objetivoData.preguntasRespondidasHoy, label: 'Hoy' },
              { icon: '📅', val: objetivoData.diasCumplidosSemana ?? '—', label: 'Esta semana' },
              { icon: '🏆', val: objetivoData.rachaObjetivos ?? '—', label: 'Racha objetivos' },
            ].map(({ icon, val, label }) => (
              <div key={label} style={{ flex: 1, background: OBG, borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem' }}>{icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: DK }}>{val}</div>
                <div style={{ fontSize: '0.62rem', color: GL, marginTop: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
