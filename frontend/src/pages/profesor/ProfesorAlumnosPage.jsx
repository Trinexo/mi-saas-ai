import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';
import { G, Header, P, PageShell, Panel, Progress, Select } from './ProfesorSharedUI';

function PctBar({ pct }) {
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 800 }}>{label}</div>
      <div style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function RiesgoBadge({ riesgo }) {
  const map = { alto: ['#fef2f2', '#ef4444'], medio: ['#fffbeb', '#f59e0b'], bajo: ['#f0fdf4', '#22c55e'] };
  const [bg, color] = map[riesgo] ?? map.bajo;
  return (
    <span style={{ background: bg, color, fontSize: '.7rem', fontWeight: 800, padding: '2px 9px', borderRadius: 999, border: `1px solid ${color}40` }}>
      {riesgo ?? 'bajo'}
    </span>
  );
}

function AlumnoDetalle({ alumnoId, token, oposicionId }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alumnoId) return;
    setLoading(true);
    setDetalle(null);
    profesorApi.getWorkspaceAlumno(token, alumnoId, { oposicion_id: oposicionId || undefined })
      .then((data) => setDetalle(data))
      .catch(() => setDetalle(null))
      .finally(() => setLoading(false));
  }, [token, alumnoId, oposicionId]);

  if (loading) return <div style={{ color: '#64748b', fontSize: 13 }}>Cargando detalle...</div>;
  if (!detalle) return <div style={{ color: '#94a3b8', fontSize: 13 }}>No se pudo cargar el detalle.</div>;

  const { alumno, progresoPorTema = [], ultimosTests = [] } = detalle;

  return (
    <>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        <Metric label="Media" value={`${alumno.mediaAciertos ?? 0}%`} />
        <Metric label="Tests" value={alumno.testsRealizados ?? 0} />
        <Metric label="Simulacros" value={alumno.simulacrosRealizados ?? 0} />
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
          <div style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 800, marginBottom: 4 }}>Riesgo</div>
          <RiesgoBadge riesgo={alumno.riesgo} />
        </div>
      </div>

      {/* Progreso por tema */}
      {progresoPorTema.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>Progreso por tema</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {progresoPorTema.map((t) => (
              <div key={t.temaId} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{t.temaNombre}</span>
                  <span style={{ color: '#94a3b8' }}>{t.intentos} intentos</span>
                </div>
                {t.intentos > 0
                  ? <PctBar pct={t.porcentajeAcierto} />
                  : <div style={{ height: 6, borderRadius: 999, background: '#e5e7eb' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos tests */}
      {ultimosTests.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>Últimos tests</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ultimosTests.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '7px 10px', fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{t.tipoTest}</span>
                  <span style={{ color: '#9ca3af', marginLeft: 6 }}>{new Date(t.fecha).toLocaleDateString('es-ES')}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, color: '#64748b' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>✓{t.aciertos}</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>✗{t.errores}</span>
                  {t.nota != null && <span style={{ color: P, fontWeight: 700 }}>{t.nota.toFixed(1)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {progresoPorTema.length === 0 && ultimosTests.length === 0 && (
        <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
          Este alumno aún no tiene actividad registrada en tus oposiciones.
        </div>
      )}

      <div style={{ marginTop: 12, color: '#64748b', fontSize: '.78rem' }}>
        Última actividad: {alumno.ultima_actividad ? new Date(alumno.ultima_actividad).toLocaleDateString('es-ES') : 'Sin actividad'}
      </div>
    </>
  );
}

export default function ProfesorAlumnosPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState(null);
  const [oposiciones, setOposiciones] = useState([]);
  const [oposicionId, setOposicionId] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    profesorApi.getWorkspaceOposiciones(token)
      .then((data) => {
        const items = data?.items ?? [];
        setOposiciones(items);
        if (items.length === 1) setOposicionId(String(items[0].id));
      })
      .catch(() => setOposiciones([]));
  }, [token]);

  useEffect(() => {
    setStudents(null);
    profesorApi.getWorkspaceAlumnos(token, {
      page: 1,
      page_size: 50,
      oposicion_id: oposicionId || undefined,
    })
      .then((data) => {
        const items = data?.items ?? [];
        setStudents(items);
        setSelected(items[0] ?? null);
      })
      .catch(() => setStudents([]));
  }, [token, oposicionId]);

  if (!students) return <div style={{ color: '#64748b' }}>Cargando...</div>;

  return (
    <PageShell>
      <Header title="Alumnos" subtitle="Seguimiento académico individual y detección temprana de riesgo.">
        <Select value={oposicionId} onChange={(event) => setOposicionId(event.target.value)}>
          <option value="">Todas mis oposiciones</option>
          {oposiciones.map((oposicion) => (
            <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>
          ))}
        </Select>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        <Panel title="Seguimiento alumnos">
          {students.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
              No hay alumnos activos en tus oposiciones.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '.72rem', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Alumno</th>
                    <th>Progreso</th>
                    <th>Media</th>
                    <th>Tests</th>
                    <th>Simulacros</th>
                    <th>Última actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      style={{ cursor: 'pointer', background: selected?.id === s.id ? '#f8fafc' : '#fff' }}
                    >
                      <td style={{ padding: 10, borderTop: '1px solid #f1f5f9', fontWeight: 900 }}>
                        {s.nombre}
                        <div style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 500 }}>
                          {s.oposiciones?.map((o) => o.nombre).join(', ') || 'Oposición asignada'}
                        </div>
                      </td>
                      <td style={{ minWidth: 140 }}><Progress value={s.progreso} color={G} /></td>
                      <td style={{ fontWeight: 900, color: P }}>{s.mediaAciertos ?? 0}%</td>
                      <td>{s.testsRealizados ?? 0}</td>
                      <td>{s.simulacrosRealizados ?? 0}</td>
                      <td style={{ color: '#64748b' }}>
                        {s.ultima_actividad ? new Date(s.ultima_actividad).toLocaleDateString('es-ES') : 'Sin actividad'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title={selected ? `Detalle de ${selected.nombre}` : 'Detalle alumno'}
          subtitle="Progreso por tema y últimos tests"
        >
          {selected
            ? <AlumnoDetalle alumnoId={selected.id} token={token} oposicionId={oposicionId} />
            : <div style={{ color: '#94a3b8', fontSize: 13 }}>Selecciona un alumno para ver su detalle.</div>}
        </Panel>
      </div>
    </PageShell>
  );
}
