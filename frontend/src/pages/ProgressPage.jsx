import { Link } from 'react-router-dom';
import ResumenGlobalSection from '../components/progress/ResumenGlobalSection';
import RachaObjetivoSection from '../components/progress/RachaObjetivoSection';
import EvolucionSection from '../components/progress/EvolucionSection';
import EstadisticasPorTemaSection from '../components/progress/EstadisticasPorTemaSection';
import ProgresoTemasSection from '../components/progress/ProgresoTemasSection';
import RachaTemasSection from '../components/progress/RachaTemasSection';

export default function ProgressPage() {
  return (
    <>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', maxWidth: 900, margin: '0 auto 16px', padding: '0 16px' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Mi progreso</span>
      </nav>
      <ResumenGlobalSection />
      <RachaObjetivoSection />
      <EvolucionSection />
      <EstadisticasPorTemaSection />
      <ProgresoTemasSection />
      <RachaTemasSection />
    </>
  );
}