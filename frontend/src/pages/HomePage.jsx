import { Link } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import ResumenOposicionWidget from '../components/widgets/ResumenOposicionWidget';
import ConfigurarOposicionWidget from '../components/widgets/ConfigurarOposicionWidget';
import TestRecomendadoWidget from '../components/widgets/TestRecomendadoWidget';
import FocoHoyWidget from '../components/widgets/FocoHoyWidget';
import ResumenSemanaWidget from '../components/widgets/ResumenSemanaWidget';
import Actividad14Widget from '../components/widgets/Actividad14Widget';
import TemasDebilesWidget from '../components/widgets/TemasDebilesWidget';
import InsightMensualWidget from '../components/widgets/InsightMensualWidget';
import RendimientoModosWidget from '../components/widgets/RendimientoModosWidget';
import ProgresoSemanalWidget from '../components/widgets/ProgresoSemanalWidget';
import EficienciaWidget from '../components/widgets/EficienciaWidget';
import ConsistenciaDiariaWidget from '../components/widgets/ConsistenciaDiariaWidget';
import RitmoPreguntaWidget from '../components/widgets/RitmoPreguntaWidget';
import BalancePrecisionWidget from '../components/widgets/BalancePrecisionWidget';
import TuNivelWidget from '../components/widgets/TuNivelWidget';
import ObjetivoDiarioWidget from '../components/widgets/ObjetivoDiarioWidget';
import TuRachaWidget from '../components/widgets/TuRachaWidget';
import RepasoPendienteWidget from '../components/widgets/RepasoPendienteWidget';

const ACCESOS = [
  { to: '/configurar-test', icon: '▷', label: 'Generar test',      desc: 'Test personalizado',    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { to: '/mis-oposiciones', icon: '◈', label: 'Mis oposiciones',   desc: 'Gestiona tu prep.',      color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { to: '/historial',       icon: '◷', label: 'Historial',         desc: 'Tests anteriores',       color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { to: '/progreso',        icon: '◎', label: 'Progreso',          desc: 'Analiza tu rendimiento', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
];

const GRID2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 };

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 2px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>
            Hola, {user?.nombre || 'alumno'} 👋
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280', textTransform: 'capitalize' }}>{today}</p>
        </div>
        <Link
          to="/configurar-test"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1d4ed8', color: '#fff', padding: '9px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}
        >
          ▷ Nuevo test
        </Link>
      </div>

      {/* Accesos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {ACCESOS.map(({ to, icon, label, desc, color, bg, border }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', transition: 'box-shadow .15s' }}>
              <div style={{ fontSize: '1.3rem', color, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{label}</div>
              <div style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: 2 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Tu oposición */}
      <SectionLabel>Tu oposición</SectionLabel>
      {user?.oposicionPreferidaId ? <ResumenOposicionWidget /> : <ConfigurarOposicionWidget />}

      {/* Test recomendado */}
      <SectionLabel>Test recomendado</SectionLabel>
      <TestRecomendadoWidget />

      {/* Hoy */}
      <SectionLabel>Plan de hoy</SectionLabel>
      <div style={GRID2}>
        <FocoHoyWidget />
        <ObjetivoDiarioWidget />
      </div>
      <div style={GRID2}>
        <TuRachaWidget />
        <RepasoPendienteWidget />
      </div>

      {/* Esta semana */}
      <SectionLabel>Esta semana</SectionLabel>
      <div style={GRID2}>
        <ResumenSemanaWidget />
        <ProgresoSemanalWidget />
      </div>
      <Actividad14Widget />

      {/* Análisis */}
      <SectionLabel>Análisis de rendimiento</SectionLabel>
      <TemasDebilesWidget />
      <div style={GRID2}>
        <RendimientoModosWidget />
        <InsightMensualWidget />
      </div>

      {/* Estadísticas */}
      <SectionLabel>Estadísticas detalladas</SectionLabel>
      <div style={GRID2}>
        <EficienciaWidget />
        <ConsistenciaDiariaWidget />
      </div>
      <div style={GRID2}>
        <RitmoPreguntaWidget />
        <BalancePrecisionWidget />
      </div>

      {/* Nivel */}
      <SectionLabel>Tu nivel</SectionLabel>
      <TuNivelWidget />

    </div>
  );
}