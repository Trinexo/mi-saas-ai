import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { testApi } from '../services/testApi';

const O   = '#ea580c';
const OBG = '#fff7ed';
const BD  = '#e5e7eb';
const DK  = '#111827';
const G   = '#374151';
const GL  = '#6b7280';

const CARD = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

const MEDAL = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: 12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `4px solid ${OBG}`, borderTopColor: O, animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

function PercentilGauge({ pct }) {
  const deg = Math.round((pct / 100) * 180);
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? O : '#dc2626';
  const label = pct >= 70 ? 'Excelente' : pct >= 40 ? 'En progreso' : 'Empieza aqui';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 160, height: 80 }}>
        <svg width="160" height="80" viewBox="0 0 160 80">
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#f3f4f6" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(deg / 180) * 220} 220`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: DK, lineHeight: 1, letterSpacing: '-0.03em' }}>{pct}%</div>
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color, background: `${color}15`, padding: '3px 12px', borderRadius: 20 }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: GL, textAlign: 'center' }}>
        Superas al <strong style={{ color: DK }}>{pct}%</strong> de los opositores
      </div>
    </div>
  );
}

function RankingRow({ row }) {
  const isMe = row.isMe;
  const pct = row.rendimiento;
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? O : '#dc2626';
  return (
    <tr style={{ background: isMe ? OBG : 'transparent', borderTop: `1px solid ${BD}` }}>
      <td style={{ padding: '11px 8px', textAlign: 'center', width: 44 }}>
        {MEDAL[row.posicion]
          ? <span style={{ fontSize: '1.1rem' }}>{MEDAL[row.posicion]}</span>
          : <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isMe ? O : G }}>{row.posicion}</span>}
      </td>
      <td style={{ padding: '11px 8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: isMe ? O : DK }}>
          {isMe ? '\u2014 Tu \u2014' : row.alias}
        </span>
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color }}>
        {pct}%
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'center', fontSize: '0.82rem', color: G }}>
        {row.testsRealizados}
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed' }}>
        {row.score} pts
      </td>
    </tr>
  );
}

export default function RankingPage() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const { actualizarRankingPublico } = useUserAccesos();
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingConsent, setSavingConsent] = useState(false);

  useEffect(() => {
    if (!token || !oposicionActiva?.id) {
      setRanking(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    testApi.getRanking(token, oposicionActiva.id)
      .then(setRanking)
      .catch((err) => setError(err.message || 'No se pudo cargar el ranking'))
      .finally(() => setLoading(false));
  }, [token, oposicionActiva?.id]);

  const miScore = ranking?.miScore;
  const percentil = ranking?.percentilSuperado ?? null;
  const totalParticipantes = ranking?.totalParticipantes ?? 0;
  const top = ranking?.top ?? [];
  const rankingPublico = Boolean(ranking?.rankingPublico);

  const toggleRankingPublico = async () => {
    if (!oposicionActiva?.id || savingConsent) return;
    const nextValue = !rankingPublico;
    setSavingConsent(true);
    setError('');
    try {
      await actualizarRankingPublico(oposicionActiva.id, nextValue);
      const data = await testApi.getRanking(token, oposicionActiva.id);
      setRanking(data);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar tu participacion en el ranking');
    } finally {
      setSavingConsent(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: DK, letterSpacing: '-0.02em' }}>Ranking</h1>
          {oposicionActiva && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: OBG, color: O, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid #fb923c40' }}>
              {oposicionActiva.nombre}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: GL }}>
          Tu posicion entre los opositores de esta preparacion. Datos actualizados en tiempo real.
        </p>
      </div>

      {!oposicionActiva ? (
        <div style={{ ...CARD, padding: '3rem', textAlign: 'center', color: GL }}>
          Selecciona una oposicion activa para ver tu ranking.
        </div>
      ) : loading ? (
        <Spinner />
      ) : error ? (
        <div style={{ ...CARD, padding: '2rem', color: '#dc2626', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>
      ) : (
        <>
          <div style={{ ...CARD, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: rankingPublico ? '#f0fdf4' : '#f8fafc' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: DK }}>
                Participacion publica en ranking
              </div>
              <div style={{ fontSize: '0.78rem', color: GL, marginTop: 3, lineHeight: 1.45 }}>
                {rankingPublico
                  ? 'Apareces con alias anonimo en el ranking publico de esta oposicion.'
                  : 'Tu puntuacion se calcula para ti, pero no apareces en el ranking publico.'}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleRankingPublico}
              disabled={savingConsent}
              style={{
                minWidth: 174,
                padding: '9px 14px',
                borderRadius: 999,
                border: rankingPublico ? '1px solid #86efac' : `1px solid ${BD}`,
                background: rankingPublico ? '#16a34a' : '#fff',
                color: rankingPublico ? '#fff' : DK,
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: savingConsent ? 'wait' : 'pointer',
              }}
            >
              {savingConsent ? 'Guardando...' : rankingPublico ? 'Participando' : 'Activar ranking'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>

            <div style={{ ...CARD, padding: '28px 24px', flex: '0 0 auto', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu percentil</div>
              {percentil > 0
                ? <PercentilGauge pct={percentil} />
                : <div style={{ fontSize: '0.85rem', color: GL, textAlign: 'center', padding: '1rem' }}>
                    Completa tests para calcular tu posicion
                  </div>}
            </div>

            <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Tests realizados',  value: miScore?.testsRealizados != null ? String(miScore.testsRealizados) : '\u2014', icon: '\uD83D\uDCDD', color: '#2563eb', bg: '#eff6ff' },
                { label: 'Rendimiento',        value: miScore?.rendimiento != null ? `${miScore.rendimiento}%` : '\u2014',           icon: '\uD83C\uDFAF', color: O,         bg: OBG       },
                { label: 'Tu puntuacion',      value: miScore?.score != null ? `${miScore.score} pts` : '\u2014',                    icon: '\u2B50',       color: '#7c3aed', bg: '#fdf4ff' },
                { label: 'Opositores activos', value: totalParticipantes > 0 ? String(totalParticipantes) : '\u2014',                icon: '\uD83D\uDC65', color: '#0891b2', bg: '#ecfeff' },
              ].map(({ label, value, icon, color, bg }) => (
                <div key={label} style={{ ...CARD, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: DK, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {top.length > 0 ? (
            <div style={{ ...CARD, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: DK }}>Tabla de posiciones</div>
                <div style={{ fontSize: '0.75rem', color: GL, marginTop: 3 }}>
                  Puntuacion = 60% rendimiento + 25% actividad + 15% evolucion
                  &nbsp;&middot;&nbsp;Los demas opositores aparecen de forma anonima
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ fontSize: '0.68rem', color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {['#', 'Opositor', 'Aciertos', 'Tests', 'Score'].map((h, i) => (
                      <th key={h} style={{ fontWeight: 600, textAlign: i <= 1 ? 'center' : 'center', padding: '0 8px 10px', borderBottom: `1px solid ${BD}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top.map((row) => <RankingRow key={`${row.posicion}-${row.isMe}`} row={row} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ ...CARD, padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{'\uD83C\uDFC1'}</div>
              <div style={{ fontWeight: 700, color: DK, marginBottom: 6 }}>Se el primero en el ranking</div>
              <div style={{ fontSize: '0.85rem', color: GL }}>
                Aun no hay opositores con actividad en esta preparacion.
                Completa tu primer test para aparecer.
              </div>
            </div>
          )}

          <div style={{ ...CARD, padding: '14px 18px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{'\uD83D\uDD12'}</span>
            <span style={{ fontSize: '0.78rem', color: GL, lineHeight: 1.5 }}>
              Tu nombre no es visible para otros usuarios. El ranking muestra alias anonimos.
              Puedes activar o desactivar tu participacion publica por oposicion.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
