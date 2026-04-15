import { useNavigate } from 'react-router-dom';
import { useUserPlan } from '../hooks/useUserPlan';
import ResumenGlobalSection from '../components/progress/ResumenGlobalSection';
import RachaObjetivoSection from '../components/progress/RachaObjetivoSection';
import EvolucionSection from '../components/progress/EvolucionSection';
import EstadisticasPorTemaSection from '../components/progress/EstadisticasPorTemaSection';
import ProgresoTemasSection from '../components/progress/ProgresoTemasSection';
import RachaTemasSection from '../components/progress/RachaTemasSection';
import AnaliticasAvanzadasSection from '../components/progress/AnaliticasAvanzadasSection';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { hasAccess, loading } = useUserPlan();
  const esElite = hasAccess('elite');
  const esPro   = hasAccess('pro');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Mi progreso</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Estadísticas de tu preparación</p>
      </div>
      <ResumenGlobalSection />
      <RachaObjetivoSection />
      <EvolucionSection />
      <EstadisticasPorTemaSection />
      <ProgresoTemasSection />
      <RachaTemasSection />

      {/* Analíticas avanzadas — solo Elite */}
      {!loading && esElite && <AnaliticasAvanzadasSection />}

      {/* Teaser para Pro — invitar a Elite */}
      {!loading && !esElite && esPro && (
        <div style={{ marginTop: '2rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>🔒</span>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#4c1d95' }}>Analíticas avanzadas (Elite)</h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6 }}>
              Desglosa tu rendimiento por materia, analiza tu eficiencia de tiempo, detecta patrones de error y sigue tu tendencia mensual con precisión.
            </p>
            <button
              onClick={() => navigate('/planes')}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Ver plan Elite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}