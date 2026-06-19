import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const BD = '#e5e7eb';
const DK = '#111827';
const G = '#374151';
const GL = '#9ca3af';
const O = '#ea580c';
const OBG = '#fff7ed';

const CARD = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

export default function RachaObjetivoSection({ oposicionId }) {
  const { token } = useAuth();
  const { isTablet } = useBreakpoint();
  const [rachaData, setRachaData] = useState(null);
  const [objetivoData, setObjetivoData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    testApi.getRacha(token, oposicionId)
      .then((data) => { if (!cancelled) setRachaData(data); })
      .catch(() => { if (!cancelled) setRachaData(null); });
    testApi.getObjetivoDiario(token, oposicionId)
      .then((data) => { if (!cancelled) setObjetivoData(data); })
      .catch(() => { if (!cancelled) setObjetivoData(null); });
    return () => { cancelled = true; };
  }, [token, oposicionId]);

  if (!rachaData && !objetivoData) return null;

  const objetivo = Number(objetivoData?.objetivoPreguntasDia ?? 0);
  const respondidas = Number(objetivoData?.preguntasRespondidasHoy ?? 0);
  const porcentaje = Number(objetivoData?.porcentajeCumplido ?? 0);
  const showTwoColumns = !isTablet && rachaData && objetivoData;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showTwoColumns ? 'minmax(240px, 0.72fr) minmax(420px, 1.28fr)' : '1fr', gap: 16, alignItems: 'start' }}>
      {rachaData && (
        <div style={{ ...CARD, padding: '14px 14px 12px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Racha de estudio</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: OBG, borderRadius: 12, padding: '10px 12px', textAlign: 'center', minWidth: 74 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🔥</span>
                <span>{rachaData.rachaActual}</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: GL, marginTop: 2 }}>días</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', color: G }}>Mejor racha: <strong style={{ color: DK }}>{rachaData.mejorRacha} días</strong></div>
              <div style={{ marginTop: 7 }}>
                <span style={{
                  display: 'inline-flex',
                  padding: '3px 9px',
                  borderRadius: 999,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: rachaData.estudioHoy ? '#dcfce7' : '#fee2e2',
                  color: rachaData.estudioHoy ? '#166534' : '#991b1b',
                }}>
                  {rachaData.estudioHoy ? 'Estudiado hoy' : 'Sin estudiar hoy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {objetivoData && (
        <div style={{ ...CARD, padding: '14px 14px 12px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Objetivo diario</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 6 }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: DK, lineHeight: 1 }}>{respondidas}</span>
            <span style={{ fontSize: '0.92rem', color: GL }}>/ {objetivo} preguntas</span>
          </div>
          <div style={{ marginBottom: 8, fontSize: '0.76rem', color: objetivoData.cumplido ? '#16a34a' : G }}>
            {objetivoData.cumplido ? 'Objetivo completado hoy' : `${porcentaje}% completado`}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: BD, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(porcentaje, 100)}%`,
              height: '100%',
              background: objetivoData.cumplido ? '#22c55e' : O,
              borderRadius: 999,
              transition: 'width .4s',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
