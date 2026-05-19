import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../state/auth.jsx';
import { getErrorMessage } from '../../services/api';
import { buildAlerts, buildOposicionCards, loadProfesorWorkspace } from './profesorWorkspaceData';
import { A, B, Button, EmptyState, G, Header, KpiCard, P, PageShell, Panel, Progress, R, Select } from './ProfesorSharedUI';

export default function ProfesorDashboardPage() {
  const { token, user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [oposicionesOptions, setOposicionesOptions] = useState([]);
  const [error, setError] = useState('');
  const [oposicionId, setOposicionId] = useState('');

  useEffect(() => {
    setError('');
    loadProfesorWorkspace(token, { oposicion_id: oposicionId || undefined })
      .then((data) => {
        setWorkspace(data);
        if (!oposicionId || oposicionesOptions.length === 0) {
          setOposicionesOptions(data.oposiciones);
        }
        if (!oposicionId && data.oposiciones.length === 1) {
          setOposicionId(String(data.oposiciones[0].id));
        }
      })
      .catch((e) => setError(getErrorMessage(e)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, oposicionId]);

  const series = useMemo(() => workspace?.evolucion ?? [], [workspace]);
  const cards = useMemo(() => workspace ? buildOposicionCards(workspace) : [], [workspace]);
  const alerts = useMemo(() => workspace ? buildAlerts(workspace) : [], [workspace]);

  if (error) return <div style={{ padding: 16, background: '#fef2f2', color: R, borderRadius: 10 }}>{error}</div>;
  if (!workspace) return <div style={{ color: '#64748b' }}>Cargando...</div>;

  const activeStudents = workspace.kpis?.alumnos_activos ?? cards.reduce((acc, item) => acc + item.alumnos, 0);
  const averageScore = workspace.kpis?.media_aciertos ?? (cards.length ? Math.round(cards.reduce((acc, item) => acc + item.aciertos, 0) / cards.length) : 0);
  const activityItems = (workspace.actividad.length ? workspace.actividad : workspace.preguntas).slice(0, 6);

  return (
    <PageShell>
      <Header
        title={`Hola, ${user?.nombre ?? 'Profesor'}`}
        subtitle="Aquí tienes un resumen académico de tus oposiciones."
        action={<Button to="/profesor/preguntas/nueva">+ Nueva pregunta</Button>}
      >
        <input placeholder="Buscar alumnos, tests o preguntas..." style={{ width: 260, height: 38, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 12px', fontSize: '.82rem' }} />
        <Select value={oposicionId} onChange={(event) => setOposicionId(event.target.value)}>
          <option value="">Todas las oposiciones</option>
          {oposicionesOptions.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
        </Select>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Alumnos activos" value={activeStudents} delta="Alumnos con acceso activo" color={G} to="/profesor/alumnos" />
        <KpiCard label="Tests realizados hoy" value={workspace.kpis?.tests_realizados_hoy ?? workspace.totals.tests} delta="Sesiones finalizadas hoy" color={G} to="/profesor/tests" />
        <KpiCard label="Media de aciertos" value={`${averageScore}%`} delta="Sobre sesiones finalizadas" color={G} to="/profesor/estadisticas" />
        <KpiCard label="Simulacros completados" value={workspace.kpis?.simulacros_completados ?? workspace.totals.simulacros} delta="Modo simulacro" color={G} to="/profesor/simulacros" />
        <KpiCard label="Preguntas pendientes revisión" value={workspace.kpis?.preguntas_pendientes_revision ?? workspace.totals.reportes} delta="Ver pendientes" color={P} to="/profesor/revision" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Panel title="Evolución del rendimiento" subtitle="Últimos 30 días">
          {series.length ? (
            <div style={{ height: 258, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={258}>
                <LineChart data={series}>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="aciertos" stroke={P} strokeWidth={3} dot={{ r: 3 }} name="Media aciertos (%)" />
                  <Line type="monotone" dataKey="tiempo" stroke={G} strokeWidth={3} dot={{ r: 3 }} name="Tiempo medio (min)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Sin evolución todavía" text="Cuando los alumnos completen tests aparecerá la evolución real." />
          )}
        </Panel>

        <Panel title="Actividad reciente" action={<Link to="/profesor/actividad" style={{ color: P, fontWeight: 800, fontSize: '.78rem', textDecoration: 'none' }}>Ver todo</Link>}>
          {activityItems.map((item, index) => (
            <div key={item.id ?? index} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: index < activityItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: index % 2 ? '#ede9fe' : '#dcfce7', color: index % 2 ? P : G, display: 'grid', placeItems: 'center', fontWeight: 900 }}>{index + 1}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.enunciado ?? item.titulo ?? 'Actividad académica registrada'}</div>
                <div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 3 }}>{item.oposicion_nombre ?? 'Oposición'} · {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'Hoy'}</div>
              </div>
            </div>
          ))}
          {activityItems.length === 0 && <EmptyState title="Sin actividad reciente" text="Cuando crees contenido o recibas reportes aparecerá aquí." />}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Panel title="Mis oposiciones" subtitle="Workspaces académicos asignados">
          {cards.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
              {cards.slice(0, 4).map((oposicion) => (
                <Link key={oposicion.id} to={`/profesor/estadisticas/${oposicion.slug}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, textDecoration: 'none', color: '#0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                    <strong style={{ fontSize: '.86rem' }}>{oposicion.nombre}</strong>
                    <span style={{ color: P, fontWeight: 900 }}>{oposicion.progreso}%</span>
                  </div>
                  <Progress value={oposicion.progreso} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14, color: '#64748b', fontSize: '.72rem' }}>
                    <span>{oposicion.alumnos} alumnos</span>
                    <span>{oposicion.tests} tests</span>
                    <span>{oposicion.simulacros} simulacros</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin oposiciones asignadas" text="Cuando tengas oposiciones asignadas aparecerán aquí." />
          )}
        </Panel>

        <Panel title="Alertas importantes">
          <div style={{ display: 'grid', gap: 10 }}>
            {alerts.map((alert) => {
              const color = alert.level === 'danger' ? R : alert.level === 'warning' ? A : B;
              return (
                <Link key={alert.title} to="/profesor/revision" style={{ display: 'block', padding: 12, borderRadius: 10, background: `${color}12`, color: '#0f172a', textDecoration: 'none', border: `1px solid ${color}22` }}>
                  <div style={{ color, fontWeight: 900, fontSize: '.82rem' }}>{alert.title}</div>
                  <div style={{ color: '#64748b', fontSize: '.75rem', marginTop: 4 }}>{alert.text}</div>
                </Link>
              );
            })}
          </div>
          {series.length > 0 && (
            <div style={{ height: 112, marginTop: 14, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={112}>
                <AreaChart data={series}>
                  <Area dataKey="actividad" stroke={P} fill="#ede9fe" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
