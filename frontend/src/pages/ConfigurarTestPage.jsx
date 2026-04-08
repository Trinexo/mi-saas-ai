import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GenerarTestForm from '../components/forms/GenerarTestForm';
import SimulacroForm from '../components/forms/SimulacroForm';

const TABS = [
  { key: 'practica', label: 'Práctica' },
  { key: 'simulacro', label: 'Simulacro' },
];

const TAB_ACTIVE = {
  padding: '8px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const TAB_INACTIVE = {
  padding: '8px 20px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#334155',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

export default function ConfigurarTestPage() {
  const location = useLocation();
  const modoSugerido = location.state?.modoSugerido ?? null;
  const [tab, setTab] = useState('practica');

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Configurar test</span>
      </nav>

      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>Configurar test</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            style={tab === t.key ? TAB_ACTIVE : TAB_INACTIVE}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'practica' && <GenerarTestForm modoSugerido={modoSugerido} />}
      {tab === 'simulacro' && <SimulacroForm />}
    </main>
  );
}
