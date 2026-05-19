import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';
import { A, B, Button, EmptyState, G, Header, KpiCard, P, PageShell, Panel, R } from './ProfesorSharedUI';

const pct = (v) => Math.max(0, Math.min(100, Number(v ?? 0)));

const colorByRate = (rate) => {
  if (rate >= 60) return G;
  if (rate >= 40) return A;
  return R;
};

export default function ProfesorTemaDetallePage() {
  const { temaId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    profesorApi.getWorkspaceTema(token, temaId)
      .then((res) => { if (alive) setData(res); })
      .catch((err) => { if (alive) setError(err?.message || 'No se pudo cargar el tema'); });
    return () => { alive = false; };
  }, [token, temaId]);

  if (error) {
    return (
      <PageShell>
        <Panel><EmptyState title="Tema no disponible" text={error} /></Panel>
      </PageShell>
    );
  }

  if (!data) return <div style={{ color: '#64748b' }}>Cargando...</div>;

  const { tema, preguntas, reportes } = data;

  const totalRespuestas = (tema.aciertos ?? 0) + (tema.errores ?? 0) + (tema.blancos ?? 0);
  const tasaFallo = totalRespuestas > 0
    ? Math.round(((tema.errores + tema.blancos) * 100) / totalRespuestas)
    : null;

  return (
    <PageShell>
      <Header
        title={tema.tema_nombre}
        subtitle={`${tema.oposicion_nombre} · ${tema.preguntas ?? 0} preguntas`}
      >
        <Button to={`/profesor/estadisticas/${tema.oposicion_slug}`} variant="secondary">Ver oposición</Button>
        <Button to="/profesor/temario" variant="secondary">Volver</Button>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Preguntas" value={tema.preguntas ?? 0} delta="En el banco" color={B} />
        <KpiCard label="Media de aciertos" value={`${pct(tema.media_aciertos)}%`} delta="Sesiones finalizadas" color={colorByRate(pct(tema.media_aciertos))} />
        <KpiCard label="Tasa de fallo" value={tasaFallo !== null ? `${tasaFallo}%` : '—'} delta="Errores + blancos" color={tasaFallo !== null && tasaFallo > 50 ? R : A} />
        <KpiCard label="Reportes abiertos" value={tema.reportes_abiertos ?? 0} delta="Pendientes de revisión" color={tema.reportes_abiertos > 0 ? R : G} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Panel title="Preguntas del tema" subtitle="Ordenadas de menor a mayor tasa de acierto">
          {preguntas.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '7px 0', textAlign: 'left', fontSize: '.74rem', color: '#64748b', fontWeight: 700 }}>Enunciado</th>
                  <th style={{ padding: '7px 0', textAlign: 'right', fontSize: '.74rem', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>Veces resp.</th>
                  <th style={{ padding: '7px 0', textAlign: 'right', fontSize: '.74rem', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>% Acierto</th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map((q) => (
                  <tr key={q.pregunta_id}>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: '.8rem', color: '#334155', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.enunciado}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '.8rem', color: '#64748b' }}>
                      {q.veces_respondida}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, fontSize: '.82rem', color: colorByRate(q.tasa_acierto) }}>
                      {q.veces_respondida > 0 ? `${q.tasa_acierto}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Sin preguntas" text="Este tema todavía no tiene preguntas en el banco." />
          )}
        </Panel>

        <Panel title={`Reportes abiertos (${reportes.length})`}>
          {reportes.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reportes.map((r) => (
                <div key={r.id} style={{ border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', background: '#fffbeb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '.74rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.04em' }}>Reporte</span>
                    <span style={{ fontSize: '.72rem', color: '#b45309' }}>{r.alumno_nombre ?? 'Alumno'}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '.8rem', color: '#334155', fontStyle: 'italic' }}>
                    «{r.pregunta_enunciado}»
                  </p>
                  {r.motivo && (
                    <p style={{ margin: 0, fontSize: '.78rem', color: '#64748b' }}>{r.motivo}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin reportes" text="No hay reportes abiertos en este tema." />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
