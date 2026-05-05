import { useNavigate } from 'react-router-dom';
import { useUserPlan } from '../hooks/useUserPlan';
import ResumenGlobalSection from '../components/progress/ResumenGlobalSection';
import RachaObjetivoSection from '../components/progress/RachaObjetivoSection';
import EvolucionSection from '../components/progress/EvolucionSection';
import EstadisticasPorTemaSection from '../components/progress/EstadisticasPorTemaSection';
import ProgresoTemasSection from '../components/progress/ProgresoTemasSection';
import RachaTemasSection from '../components/progress/RachaTemasSection';
import AnaliticasAvanzadasSection from '../components/progress/AnaliticasAvanzadasSection';
import ResumenSemanaWidget from '../components/widgets/ResumenSemanaWidget';
import ProgresoSemanalWidget from '../components/widgets/ProgresoSemanalWidget';
import Actividad14Widget from '../components/widgets/Actividad14Widget';
import TemasDebilesWidget from '../components/widgets/TemasDebilesWidget';
import RendimientoModosWidget from '../components/widgets/RendimientoModosWidget';
import InsightMensualWidget from '../components/widgets/InsightMensualWidget';
import EficienciaWidget from '../components/widgets/EficienciaWidget';
import ConsistenciaDiariaWidget from '../components/widgets/ConsistenciaDiariaWidget';
import RitmoPreguntaWidget from '../components/widgets/RitmoPreguntaWidget';
import BalancePrecisionWidget from '../components/widgets/BalancePrecisionWidget';
import TuNivelWidget from '../components/widgets/TuNivelWidget';

const GRID2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { hasAccess, loading } = useUserPlan();
  const esElite = hasAccess('elite');
  const esPro   = hasAccess('pro');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Mi progreso</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>Estadísticas y análisis completo de tu preparación</p>
      </div>

      <SectionLabel>Resumen global</SectionLabel>
      <ResumenGlobalSection />
      <RachaObjetivoSection />

      <SectionLabel>Esta semana</SectionLabel>
      <div style={GRID2}>
        <ResumenSemanaWidget />
        <ProgresoSemanalWidget />
      </div>
      <Actividad14Widget />

      <SectionLabel>Evolución</SectionLabel>
      <EvolucionSection />

      <SectionLabel>Temas</SectionLabel>
      <EstadisticasPorTemaSection />
      <ProgresoTemasSection />
      <RachaTemasSection />

      <SectionLabel>Análisis de rendimiento</SectionLabel>
      <TemasDebilesWidget />
      <div style={GRID2}>
        <RendimientoModosWidget />
        <InsightMensualWidget />
      </div>

      <SectionLabel>Estadísticas detalladas</SectionLabel>
      <div style={GRID2}>
        <EficienciaWidget />
        <ConsistenciaDiariaWidget />
      </div>
      <div style={GRID2}>
        <RitmoPreguntaWidget />
        <BalancePrecisionWidget />
      </div>

      <SectionLabel>Tu nivel</SectionLabel>
      <TuNivelWidget />

      {/* Analíticas avanzadas — solo Elite */}
      {!loading && esElite && (
        <>
          <SectionLabel>Analíticas avanzadas</SectionLabel>
          <AnaliticasAvanzadasSection />
        </>
      )}

      {/* Teaser para Pro — invitar a Elite */}
      {!loading && !esElite && esPro && (
        <div style={{ marginTop: '2rem', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🔒</div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Analíticas avanzadas — Plan Elite</h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>
              Desglosa tu rendimiento por materia, analiza tu eficiencia de tiempo, detecta patrones de error y sigue tu tendencia mensual con precisión.
            </p>
            <button
              onClick={() => navigate('/planes')}
              style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: '#ea580c', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Ver plan Elite →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}