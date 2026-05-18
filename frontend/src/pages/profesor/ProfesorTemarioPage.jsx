import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';
import { Button, EmptyState, Header, PageShell, Panel, P, Progress } from './ProfesorSharedUI';

export default function ProfesorTemarioPage() {
  const { token } = useAuth();
  const [temario, setTemario] = useState(null);

  useEffect(() => { profesorApi.getWorkspaceTemario(token).then((data) => setTemario(data?.items ?? [])).catch(() => setTemario([])); }, [token]);
  if (!temario) return <div style={{ color: '#64748b' }}>Cargando...</div>;

  return (
    <PageShell>
      <Header title="Temario" subtitle="Acceso académico a temas y contenido asociado." action={<Button to="/profesor/tests/nuevo">+ Crear test</Button>} />
      <Panel title="Temas asignados">
        {temario.length === 0 ? <EmptyState title="Sin temario asignado" text="Los temas de tus oposiciones aparecerán aquí." /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {temario.map((tema) => (
              <div key={tema.tema_id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong style={{ color: '#0f172a' }}>{tema.tema_nombre}</strong>
                  <span style={{ color: P, fontWeight: 900 }}>{tema.media_aciertos ?? 0}%</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '.78rem', margin: '8px 0 12px' }}>{tema.oposicion_nombre} · {tema.preguntas ?? 0} preguntas · {tema.reportes_abiertos ?? 0} reportes</p>
                <Progress value={tema.media_aciertos ?? 0} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <Button to={`/profesor/estadisticas/${tema.oposicion_slug}/${tema.tema_id}`} variant="secondary">Ver detalle</Button>
                  <Button to="/profesor/preguntas/nueva">Nueva pregunta</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
