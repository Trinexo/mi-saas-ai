import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';
import { B, EmptyState, G, Header, P, PageShell, Panel, R, Select } from './ProfesorSharedUI';

export default function ProfesorEstadisticasPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState('30');
  const series = useMemo(() => stats?.evolucion ?? [], [stats]);
  const cards = stats?.rendimientoPorOposicion ?? [];
  const students = stats?.rankingAlumnos ?? [];
  const problematicas = stats?.preguntasProblematicas ?? [];

  useEffect(() => {
    profesorApi.getWorkspaceEstadisticas(token, { page: 1, page_size: 20 })
      .then(setStats)
      .catch(() => setStats({ evolucion: [], rendimientoPorOposicion: [], rankingAlumnos: [], preguntasProblematicas: [], distribucionDificultad: [] }));
  }, [token, range]);

  if (!stats) return <div style={{ color: '#64748b' }}>Cargando...</div>;

  const pie = (stats.distribucionDificultad?.length ? stats.distribucionDificultad : [
    { nivel_dificultad: 'facil',   total: 0 },
    { nivel_dificultad: 'media',   total: 0 },
    { nivel_dificultad: 'dificil', total: 0 },
  ]).map((item, index) => ({
    name: ({ facil: 'Fácil', media: 'Media', dificil: 'Difícil' })[item.nivel_dificultad] ?? `Nivel ${item.nivel_dificultad}`,
    value: Number(item.total ?? 0),
    color: [B, G, '#f59e0b', R, P][index % 5],
  }));

  return (
    <PageShell>
      <Header title="Estadísticas" subtitle="Panel analítico para decidir dónde reforzar contenido y seguimiento.">
        <Select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </Select>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Panel title="Evolución de aciertos (%)">
          {series.length ? (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area dataKey="aciertos" stroke={P} fill="#ede9fe" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Sin evolución todavía" text="Los datos aparecerán cuando haya sesiones finalizadas." />
          )}
        </Panel>
        <Panel title="Distribución de resultados">
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} innerRadius={56} outerRadius={88} dataKey="value">
                  {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Rendimiento por oposición">
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cards.map((c) => ({ name: c.nombre.slice(0, 18), value: c.mediaAciertos ?? c.media_aciertos ?? 0 }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={G} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        <Panel title="Ranking alumnos por media">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{students.map((s, i) => (
              <tr key={s.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #f1f5f9', fontWeight: 900 }}>{i + 1}. {s.nombre}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{s.testsRealizados ?? 0} tests</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f1f5f9', color: G, fontWeight: 900, textAlign: 'right' }}>{s.mediaAciertos ?? 0}%</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
        <Panel title="Preguntas problemáticas">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{problematicas.slice(0, 6).map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #f1f5f9', fontWeight: 800, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.enunciado}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f1f5f9', color: R, fontWeight: 900, textAlign: 'right' }}>{p.tasa_fallo ?? 0}% fallo</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>
    </PageShell>
  );
}
