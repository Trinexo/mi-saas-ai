import { useLocation } from 'react-router-dom';
import GenerarTestForm from '../components/forms/GenerarTestForm';

export default function ConfigurarTestPage() {
  const location = useLocation();
  const modoSugerido = location.state?.modoSugerido ?? null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>Crear nuevo test personalizado</h2>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>Configura los criterios de tu test y practica exactamente lo que necesitas</p>
      </div>
      <GenerarTestForm modoSugerido={modoSugerido} />
    </div>
  );
}
