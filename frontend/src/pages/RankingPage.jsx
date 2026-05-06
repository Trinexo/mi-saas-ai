import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { testApi } from '../services/testApi';

/* ── Paleta ─────────────────────────────────────────── */
const O    = '#ea580c';
const OBG  = '#fff7ed';
const BD   = '#e5e7eb';
const DK   = '#111827';
const G    = '#374151';
const GL   = '#6b7280';

const CARD = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

/* ── Datos demo del ranking (top 10 posiciones) ─── */
const TOP_DEMO = [
  { pos: 1,  alias: 'Opositor_1891', pct: 97, tests: 142, racha: 38 },
  { pos: 2,  alias: 'Preparando2025', pct: 95, tests: 128, racha: 22 },
  { pos: 3,  alias: 'Jurista_M',      pct: 93, tests: 119, racha: 31 },
  { pos: 4,  alias: 'Admin_Sevilla',  pct: 91, tests: 107, racha: 15 },
  { pos: 5,  alias: 'L39_Pro',        pct: 89, tests: 98,  racha: 11 },
  { pos: 6,  alias: 'ConstEsp22',     pct: 87, tests: 90,  racha: 9  },
  { pos: 7,  alias: 'Ops_Valencia',   pct: 85, tests: 85,  racha: 7  },
  { pos: 8,  alias: 'TÚ',             pct: null, tests: null, racha: null, isMe: true },
  { pos: 9,  alias: 'Auxiliar_BCN',   pct: 79, tests: 67,  racha: 4  },
  { pos: 10, alias: 'TestDaily',      pct: 77, tests: 62,  racha: 3  },
];

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

/* ── Spinner ──────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: 12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `4px solid ${OBG}`, borderTopColor: O, animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

/* ── Gauge de percentil ───────────────────────────── */
function PercentilGauge({ pct }) {
  const deg = Math.round((pct / 100) * 180);
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? O : '#dc2626';
  const label = pct >= 80 ? 'Excelente' : pct >= 60 ? 'Bien' : pct >= 40 ? 'En progreso' : 'Empieza aquí';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 160, height: 80 }}>
        {/* Track semicírculo */}
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

/* ── Fila ranking ─────────────────────────────────── */
function RankingRow({ row, userPct, userTests, userRacha }) {
  const isMe = row.isMe;
  const pct    = isMe ? userPct    : row.pct;
  const tests  = isMe ? userTests  : row.tests;
  const racha  = isMe ? userRacha  : row.racha;

  return (
    <tr style={{ background: isMe ? OBG : 'transparent', borderTop: `1px solid ${BD}` }}>
      <td style={{ padding: '11px 8px', fontWeight: 800, fontSize: '0.9rem', color: MEDAL[row.pos] ? 'transparent' : G, textShadow: MEDAL[row.pos] ? 'none' : 'none', textAlign: 'center', width: 40 }}>
        {MEDAL[row.pos] ? (
          <span style={{ fontSize: '1.1rem' }}>{MEDAL[row.pos]}</span>
        ) : (
          <span style={{ color: isMe ? O : G }}>{row.pos}</span>
        )}
      </td>
      <td style={{ padding: '11px 8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: isMe ? O : DK }}>
          {isMe ? '— Tú —' : row.alias}
        </span>
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: pct != null ? (pct >= 80 ? '#16a34a' : pct >= 50 ? O : '#dc2626') : GL }}>
        {pct != null ? `${pct}%` : <span style={{ color: GL }}>—</span>}
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'center', fontSize: '0.82rem', color: G }}>
        {tests != null ? tests : <span style={{ color: GL }}>—</span>}
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'center', fontSize: '0.82rem', color: G }}>
        {racha != null ? `${racha} 🔥` : <span style={{ color: GL }}>—</span>}
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════
   RankingPage
   ══════════════════════════════════════════════════ */
export default function RankingPage() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const [stats, setStats] = useState(null);
  const [racha, setRacha] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      testApi.userStats(token).catch(() => null),
      testApi.getRacha(token).catch(() => null),
    ]).then(([s, r]) => {
      setStats(s);
      setRacha(r);
    }).finally(() => setLoading(false));
  }, [token]);

  const total    = (stats?.aciertos || 0) + (stats?.errores || 0) + (stats?.blancos || 0);
  const pctUser  = total > 0 ? Math.round((stats.aciertos / total) * 100) : null;
  const totalTests = stats?.totalTests ?? null;
  const rachaUser  = racha?.rachaActual ?? null;

  /* Posición simulada: percentil basado en aciertos */
  const posicion = pctUser != null
    ? pctUser >= 90 ? 3
    : pctUser >= 80 ? 8
    : pctUser >= 70 ? 15
    : pctUser >= 55 ? 30
    : 50
    : null;

  const rows = TOP_DEMO.map((r) => r.isMe ? { ...r, pct: pctUser, tests: totalTests, racha: rachaUser } : r);

  /* ─── Render ─────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: DK, letterSpacing: '-0.02em' }}>Ranking</h1>
          {oposicionActiva && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: OBG, color: O, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid #fb923c40' }}>
              🎯 {oposicionActiva.nombre}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: GL }}>
          Tu posición entre la comunidad de opositores de la plataforma.
        </p>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Fila superior: percentil + stats personales */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>

            {/* Gauge */}
            <div style={{ ...CARD, padding: '28px 24px', flex: '0 0 auto', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu percentil</div>
              {pctUser != null
                ? <PercentilGauge pct={pctUser} />
                : <div style={{ fontSize: '0.85rem', color: GL, textAlign: 'center', padding: '1rem' }}>Completa tests para<br />calcular tu posición</div>}
            </div>

            {/* KPIs personales */}
            <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Tests realizados',  value: totalTests  != null ? String(totalTests)       : '—', icon: '📝', color: '#2563eb', bg: '#eff6ff'  },
                { label: 'Tasa de aciertos',  value: pctUser     != null ? `${pctUser}%`            : '—', icon: '🎯', color: O,         bg: OBG        },
                { label: 'Racha actual',       value: rachaUser   != null ? `${rachaUser} días`      : '—', icon: '🔥', color: O,         bg: OBG        },
                { label: 'Posición estimada',  value: posicion    != null ? `Top ${posicion}%`       : '—', icon: '🏆', color: '#9333ea', bg: '#fdf4ff'  },
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

          {/* Tabla ranking */}
          <div style={{ ...CARD, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: DK }}>Tabla de posiciones</div>
              <div style={{ fontSize: '0.75rem', color: GL, marginTop: 3 }}>
                Basada en tasa de aciertos · Actualizado diariamente
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ fontSize: '0.68rem', color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {['#', 'Opositor', 'Aciertos', 'Tests', 'Racha'].map((h, i) => (
                    <th key={h} style={{ fontWeight: 600, textAlign: i <= 1 ? 'center' : 'center', padding: '0 8px 10px', borderBottom: `1px solid ${BD}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <RankingRow
                    key={row.pos}
                    row={row}
                    userPct={pctUser}
                    userTests={totalTests}
                    userRacha={rachaUser}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Aviso de datos */}
          <div style={{ ...CARD, padding: '14px 18px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
            <span style={{ fontSize: '0.78rem', color: GL, lineHeight: 1.5 }}>
              El ranking global mostrará datos reales de otros usuarios cuando el módulo esté disponible.
              Los datos actuales son ilustrativos para que veas tu posición estimada.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
