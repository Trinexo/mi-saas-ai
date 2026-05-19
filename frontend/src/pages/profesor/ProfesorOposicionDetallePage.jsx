import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';
import { B, Button, EmptyState, G, Header, KpiCard, P, PageShell, Panel, Progress, R } from './ProfesorSharedUI';

const fmtDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
};

const YAxisTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#334155" fontWeight={600}>
    {payload.value}
  </text>
);

const pct = (value) => Math.max(0, Math.min(100, Number(value ?? 0)));

export default function ProfesorOposicionDetallePage() {
  const { slug } = useParams();
  const { token } = useAuth();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    profesorApi.getWorkspaceOposicion(token, slug)
      .then((data) => {
        if (alive) setDetail(data);
      })
      .catch((err) => {
        if (alive) setError(err?.message || 'No se pudo cargar la oposición');
      });
    return () => { alive = false; };
  }, [token, slug]);

  const oposicion = detail?.oposicion;
  const temario = useMemo(() => detail?.temario ?? [], [detail]);
  const temasFallados = useMemo(
    () => [...temario]
      .filter((tema) => Number(tema.errores ?? 0) + Number(tema.aciertos ?? 0) + Number(tema.blancos ?? 0) > 0)
      .map((tema) => ({
        ...tema,
        tasaFallo: Math.round(
          ((Number(tema.errores ?? 0) + Number(tema.blancos ?? 0)) * 100)
          / (Number(tema.errores ?? 0) + Number(tema.aciertos ?? 0) + Number(tema.blancos ?? 0)),
        ),
      }))
      .sort((a, b) => b.tasaFallo - a.tasaFallo),
    [temario],
  );
  const rendimiento = temario.map((tema) => ({
    name: tema.tema_nombre.match(/^Tema\s+\d+/i)?.[0] ?? tema.tema_nombre.slice(0, 10),
    fullName: tema.tema_nombre,
    value: pct(tema.media_aciertos),
  }));

  if (error) {
    return (
      <PageShell>
        <Panel><EmptyState title="Oposición no disponible" text={error} /></Panel>
      </PageShell>
    );
  }

  if (!detail) return <div style={{ color: '#64748b' }}>Cargando...</div>;
  if (!oposicion) {
    return (
      <PageShell>
        <Panel><EmptyState title="Oposición no encontrada" text="No tienes acceso a esta oposición." /></Panel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header
        title={oposicion.nombre}
        subtitle={`${oposicion.categoria ?? 'Oposición'} · ${oposicion.alumnosActivos ?? 0} alumnos · Activa`}
        action={<Button to="/profesor/simulacros/nuevo">Crear simulacro</Button>}
      >
        <Button to="/profesor/oposiciones" variant="secondary">Volver</Button>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Progreso medio" value={`${pct(oposicion.progresoMedio)}%`} delta="Datos de alumnos activos" color={G} />
        <KpiCard label="Media de aciertos" value={`${pct(oposicion.mediaAciertos)}%`} delta="Sobre sesiones finalizadas" color={G} />
        <KpiCard label="Tests creados" value={oposicion.plantillasTest ?? oposicion.tests ?? 0} delta="Plantillas disponibles" color={B} />
        <KpiCard label="Simulacros" value={oposicion.simulacros ?? 0} delta="Oficiales y borradores" color={P} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Panel title="Rendimiento por temas">
          {rendimiento.length ? (
            <div style={{ maxHeight: 340, overflowY: 'auto', overflowX: 'hidden' }}>
              <div style={{ height: Math.max(200, rendimiento.length * 44) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rendimiento} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                    <CartesianGrid stroke="#eef2f7" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={<YAxisTick />}
                      width={62}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      formatter={(val, _name, props) => [`${val}%`, props.payload?.fullName ?? _name]}
                    />
                    <Bar dataKey="value" fill={P} radius={[0, 6, 6, 0]} barSize={22}>
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(v) => `${v}%`}
                        style={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState title="Sin datos de rendimiento" text="Aún no hay sesiones finalizadas para calcular rendimiento por tema." />
          )}
        </Panel>

        <Panel title="Temas con mayor tasa de fallo" action={<Link to="/profesor/estadisticas" style={{ color: P, fontWeight: 800, fontSize: '.78rem', textDecoration: 'none' }}>Ver análisis</Link>}>
          {temasFallados.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {temasFallados.slice(0, 9).map((row) => (
                  <tr key={row.tema_id}>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 800, fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}><Link to={`/profesor/estadisticas/${slug}/${row.tema_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{row.tema_nombre}</Link></td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', color: R, fontWeight: 900, textAlign: 'right' }}>{row.tasaFallo}%</td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', color: '#64748b', textAlign: 'right', fontSize: '.76rem' }}>{row.preguntas ?? 0} preguntas</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Sin temas" text="Esta oposición aún no tiene temario conectado." />
          )}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Panel title="Actividad reciente de alumnos">
          {(detail.alumnos ?? []).length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
              {detail.alumnos.map((student) => (
                <div key={student.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                  <strong style={{ color: '#0f172a', fontSize: '.84rem' }}>{student.nombre}</strong>
                  <div style={{ color: '#64748b', fontSize: '.72rem', margin: '4px 0 10px' }}>
                    {fmtDate(student.ultima_actividad)} · media {pct(student.mediaAciertos)}%
                  </div>
                  <Progress value={student.progreso} color={G} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin alumnos activos" text="Todavía no hay alumnos activos en esta oposición." />
          )}
        </Panel>

        <Panel title="Simulacros activos">
          {(detail.simulacros ?? []).length ? detail.simulacros.map((simulacro) => (
            <div key={simulacro.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontSize: '.82rem' }}>
              <div>
                <span style={{ fontWeight: 800 }}>{simulacro.nombre}</span>
                <div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 3 }}>
                  {simulacro.total_preguntas ?? 0} preguntas · media {pct(simulacro.media_aciertos)}%
                </div>
              </div>
              <span style={{ color: '#64748b', textAlign: 'right' }}>{simulacro.estado}</span>
            </div>
          )) : (
            <EmptyState title="Sin simulacros" text="Crea un simulacro oficial para esta oposición desde el workspace profesor." />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
