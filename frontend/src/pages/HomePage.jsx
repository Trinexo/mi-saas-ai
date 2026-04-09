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
  { to: '/configurar-test', icon: '▷', label: 'Generar test', desc: 'Crea un test personalizado', bg: '#eff6ff', color: '#1d4ed8' },
  { to: '/mis-oposiciones', icon: '◈', label: 'Mis oposiciones', desc: 'Gestiona tu preparacion', bg: '#f0fdf4', color: '#15803d' },
  { to: '/historial', icon: '◷', label: 'Historial', desc: 'Revisa tests anteriores', bg: '#fff7ed', color: '#c2410c' },
  { to: '/progreso', icon: '◎', label: 'Progreso', desc: 'Analiza tu rendimiento', bg: '#faf5ff', color: '#7c3aed' },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      {/* Cabecera de bienvenida */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>
          Hola, {user?.nombre || 'alumno'} 👋
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Sigue con tu preparacion de hoy</p>
      </div>

      {/* Accesos rapidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: 20 }}>
        {ACCESOS.map(({ to, icon, label, desc, bg, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{ background: bg, borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.25rem', color, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {user?.oposicionPreferidaId ? <ResumenOposicionWidget /> : <ConfigurarOposicionWidget />}
      <TestRecomendadoWidget />
      <FocoHoyWidget />
      <ResumenSemanaWidget />
      <Actividad14Widget />
      <TemasDebilesWidget />
      <InsightMensualWidget />
      <RendimientoModosWidget />
      <ProgresoSemanalWidget />
      <EficienciaWidget />
      <ConsistenciaDiariaWidget />
      <RitmoPreguntaWidget />
      <BalancePrecisionWidget />
      <TuNivelWidget />
      <ObjetivoDiarioWidget />
      <TuRachaWidget />
      <RepasoPendienteWidget />
    </>
  );
}