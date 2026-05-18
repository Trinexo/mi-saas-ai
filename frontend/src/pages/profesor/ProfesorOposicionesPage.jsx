import { useEffect, useMemo, useState } from 'react';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';
import { buildOposicionCards } from './profesorWorkspaceData';
import { Button, EmptyState, Header, P, PageShell, Panel, Progress } from './ProfesorSharedUI';

export default function ProfesorOposicionesPage() {
  const { token } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const cards = useMemo(() => workspace ? buildOposicionCards(workspace) : [], [workspace]);

  useEffect(() => {
    profesorApi.getWorkspaceOposiciones(token)
      .then((data) => setWorkspace({ oposiciones: data.items ?? [] }))
      .catch(() => setWorkspace({ oposiciones: [] }));
  }, [token]);

  if (!workspace) return <div style={{ color: '#64748b' }}>Cargando...</div>;

  return (
    <PageShell>
      <Header title="Mis oposiciones" subtitle="Gestiona y supervisa todas las oposiciones asignadas." />
      {cards.length === 0 ? (
        <Panel><EmptyState title="Sin oposiciones asignadas" text="Contacta con un administrador para asignarte oposiciones." /></Panel>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
          {cards.map((o) => (
            <Panel key={o.id} style={{ minHeight: 218 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ede9fe', color: P, display: 'grid', placeItems: 'center', fontWeight: 900 }}>OP</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: '.95rem', fontWeight: 900, color: '#0f172a' }}>{o.nombre}</h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.76rem' }}>{o.alumnos} alumnos activos</p>
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '.76rem', fontWeight: 800, marginBottom: 7 }}>
                  <span>Progreso medio</span><span style={{ color: '#0f172a' }}>{o.progreso}%</span>
                </div>
                <Progress value={o.progreso} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16, color: '#64748b', fontSize: '.75rem' }}>
                <div><strong style={{ display: 'block', color: '#0f172a', fontSize: '.95rem' }}>{o.tests}</strong>Tests</div>
                <div><strong style={{ display: 'block', color: '#0f172a', fontSize: '.95rem' }}>{o.simulacros}</strong>Simulacros</div>
                <div><strong style={{ display: 'block', color: '#0f172a', fontSize: '.95rem' }}>{o.ultimoSimulacro}</strong>Último</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Button to={`/profesor/estadisticas/${o.slug}`} variant="secondary">Ver estadísticas</Button>
                <Button to="/profesor/simulacros/nuevo">Crear simulacro</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
