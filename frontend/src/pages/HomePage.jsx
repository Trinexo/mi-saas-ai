import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { testApi } from '../services/testApi';
import { useAsyncAction } from '../hooks/useAsyncAction';
import FocoHoyWidget from '../components/widgets/FocoHoyWidget';
import ObjetivoDiarioWidget from '../components/widgets/ObjetivoDiarioWidget';
import TuRachaWidget from '../components/widgets/TuRachaWidget';
import RepasoPendienteWidget from '../components/widgets/RepasoPendienteWidget';
import TemasDebilesWidget from '../components/widgets/TemasDebilesWidget';

/* ── Paleta ───────────────────────────────────────────────── */
const O  = '#ea580c';   // naranja primario
const OL = '#fb923c';   // naranja claro
const OBG = '#fff7ed';  // fondo naranja suave
const DK = '#111827';   // negro/oscuro
const DM = '#1f2937';   // gris muy oscuro

/* ── Accesos rápidos ──────────────────────────────────────── */
const ACCESOS = [
  { to:'/configurar-test', icon:'▷', label:'Generar test',    desc:'Crea un test a tu medida',         accent: O },
  { to:'/mis-oposiciones', icon:'◈', label:'Mis oposiciones', desc:'Gestiona tu preparación',          accent:'#16a34a' },
  { to:'/historial',       icon:'◷', label:'Historial',       desc:'Todos tus tests anteriores',       accent:'#9333ea' },
  { to:'/catalogo',        icon:'◫', label:'Catálogo',        desc:'Explora el banco de preguntas',    accent:'#0369a1' },
];

/* ── Card de acción grande ────────────────────────────────── */
function AccionCard({ to, icon, label, desc, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        background:    hov ? DM : DK,
        border:        `1.5px solid ${hov ? accent : '#374151'}`,
        borderRadius:  18,
        padding:       '24px 20px',
        transition:    'all .18s ease',
        transform:     hov ? 'translateY(-5px)' : 'none',
        boxShadow:     hov ? `0 12px 32px ${accent}30` : '0 2px 8px rgba(0,0,0,.25)',
        cursor:        'pointer',
        minHeight:     130,
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
      }}>
        <div style={{ fontSize: '1.75rem', color: hov ? accent : '#9ca3af', transition: 'color .18s' }}>{icon}</div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5, flex: 1 }}>{desc}</div>
        <div style={{ fontSize: '0.78rem', color: accent, fontWeight: 700, opacity: hov ? 1 : 0, transition: 'opacity .15s', marginTop: 4 }}>
          Ir ahora →
        </div>
      </div>
    </Link>
  );
}

/* ── CTA de test recomendado ──────────────────────────────── */
function TestRecomendadoCard() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const [data, setData] = useState(null);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    testApi.getRecommended(token)
      .then(setData)
      .catch(() => setData({ modo:'adaptativo', temaId:null, oposicionId:null, oposicionNombre:null, numeroPreguntas:10, motivo:'Empieza con un test rápido de 10 preguntas' }));
  }, [token]);

  const onStart = async () => {
    if (!data) return;
    let test;
    if (data.modo === 'refuerzo') {
      const p = { numeroPreguntas: Number(data.numeroPreguntas || 10) };
      if (data.temaId) p.temaId = Number(data.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, p));
    } else {
      const p = { modo: data.modo || 'adaptativo', numeroPreguntas: Number(data.numeroPreguntas || 10), dificultad: data.dificultad || 'mixto' };
      if (data.temasMix?.length) p.temasMix = data.temasMix;
      else if (data.temaId) p.temaId = Number(data.temaId);
      if (data.oposicionId) p.oposicionId = Number(data.oposicionId);
      test = await runAction(() => testApi.generate(token, p));
    }
    if (test) { sessionStorage.setItem('active_test', JSON.stringify(test)); navigate('/test'); }
  };

  const MODO_LABEL = { repaso:'Repaso espaciado', adaptativo:'Test adaptativo', normal:'Test de presentación', refuerzo:'Test de refuerzo', simulacro:'Simulacro' };

  return (
    <div style={{
      background:    `linear-gradient(135deg, ${DK} 0%, ${DM} 100%)`,
      borderRadius:  20,
      padding:       '28px 28px 24px',
      boxShadow:     '0 4px 24px rgba(0,0,0,.22)',
      marginBottom:  0,
      borderLeft:    `4px solid ${O}`,
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* fondo decorativo */}
      <div style={{ position:'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius:'50%', background: `${O}12`, pointerEvents:'none' }} />

      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: OL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        Recomendado ahora
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 6, maxWidth: 340 }}>
        {data?.motivo || 'Cargando recomendación…'}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, marginTop: 10 }}>
        {data?.oposicionNombre && (
          <span style={{ background: 'rgba(234,88,12,.18)', color: OL, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>{data.oposicionNombre}</span>
        )}
        {data?.modo && (
          <span style={{ background: 'rgba(255,255,255,.08)', color: '#d1d5db', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>{MODO_LABEL[data.modo] || data.modo}</span>
        )}
        {data?.numeroPreguntas && (
          <span style={{ background: 'rgba(255,255,255,.08)', color: '#d1d5db', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>{data.numeroPreguntas} preguntas</span>
        )}
      </div>
      <button
        disabled={isLoading || !data}
        onClick={onStart}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:      'inline-flex', alignItems: 'center', gap: 8,
          background:   hov ? '#c2410c' : O,
          color:        '#fff',
          border:       'none',
          borderRadius: 12,
          padding:      '12px 28px',
          fontWeight:   800,
          fontSize:     '0.95rem',
          cursor:       isLoading || !data ? 'not-allowed' : 'pointer',
          opacity:      isLoading || !data ? 0.7 : 1,
          boxShadow:    `0 4px 16px ${O}50`,
          transition:   'all .15s',
        }}
      >
        {isLoading ? 'Generando…' : '▷  Empezar test'}
      </button>
    </div>
  );
}

/* ── Mini resumen de stats ───────────────────────────────── */
function MiniStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [racha, setRacha] = useState(null);

  useEffect(() => {
    testApi.userStats(token).then(setStats).catch(() => {});
    testApi.getRacha(token).then(setRacha).catch(() => {});
  }, [token]);

  const total = (stats?.aciertos || 0) + (stats?.errores || 0) + (stats?.blancos || 0);
  const pct   = total > 0 ? Math.round((stats.aciertos / total) * 100) : null;

  const ITEMS = [
    { v: stats?.totalTests ?? '–',                         label: 'Tests',       icon: '◷', color: O         },
    { v: pct != null ? `${pct}%` : '–',                   label: 'Aciertos',    icon: '◎', color: '#16a34a' },
    { v: stats ? Number(stats.notaMedia).toFixed(1) : '–', label: 'Nota media',  icon: '◈', color: '#9333ea' },
    { v: racha ? `${racha.rachaActual}d` : '–',           label: 'Racha',       icon: '★', color: '#d97706' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tu actividad</span>
        <Link to="/progreso" style={{ fontSize: '0.8rem', color: O, textDecoration: 'none', fontWeight: 700 }}>Ver todo →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {ITEMS.map(({ v, label, icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '18px 10px 14px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.07)', border: '1.5px solid #f3f4f6' }}>
            <div style={{ fontSize: '0.9rem', color, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: DK, lineHeight: 1, letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Separador de sección ────────────────────────────────── */
function Section({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 14px' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
  );
}

/* ── Page principal ──────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const nombre = user?.nombre?.split(' ')[0] || 'alumno';
  const hour   = new Date().getHours();
  const saludo = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div style={{
        background:   `linear-gradient(135deg, ${DK} 0%, #1c1c1c 100%)`,
        borderRadius: 22,
        padding:      '28px 28px 24px',
        marginBottom: 24,
        boxShadow:    '0 6px 28px rgba(0,0,0,.18)',
        display:      'flex',
        justifyContent: 'space-between',
        alignItems:   'flex-end',
        flexWrap:     'wrap',
        gap:          16,
        borderBottom: `3px solid ${O}`,
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{saludo},</p>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {nombre} <span style={{ color: O }}>👋</span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          to="/configurar-test"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: O, color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem', boxShadow: `0 4px 16px ${O}55`, whiteSpace: 'nowrap' }}
        >
          ▷ Nuevo test
        </Link>
      </div>

      {/* ── Accesos rápidos ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {ACCESOS.map((a) => <AccionCard key={a.to} {...a} />)}
      </div>

      {/* ── Test recomendado ─────────────────────────── */}
      <TestRecomendadoCard />

      {/* ── Plan de hoy ──────────────────────────────── */}
      <Section label="Tu plan de hoy" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <FocoHoyWidget />
        <ObjetivoDiarioWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <TuRachaWidget />
        <RepasoPendienteWidget />
      </div>

      {/* ── Temas débiles ────────────────────────────── */}
      <Section label="Refuerza tus puntos débiles" />
      <TemasDebilesWidget />

      {/* ── Mini stats ───────────────────────────────── */}
      <Section label="" />
      <MiniStats />

    </div>
  );
}
