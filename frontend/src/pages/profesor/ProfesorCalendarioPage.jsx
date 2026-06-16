import { useEffect, useMemo, useState } from 'react';
import { profesorApi } from '../../services/profesorApi';
import TemaMultiSelect from '../../components/forms/TemaMultiSelect.jsx';
import { useAuth } from '../../state/auth.jsx';
import { Button, EmptyState, Header, P, PageShell, Panel } from './ProfesorSharedUI';

const tipoLabel = {
  simulacro: 'Simulacro oficial',
  plantilla_test: 'Test recomendado',
  tema_recomendado: 'Tema recomendado',
};

const estadoColor = {
  borrador: '#64748b',
  publicada: '#10b981',
  bloqueada: '#f59e0b',
  archivada: '#94a3b8',
};

const emptyForm = {
  oposicion_id: '',
  tipo: 'tema_recomendado',
  estado: 'borrador',
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  duracion_minutos: '',
  simulacro_id: '',
  plantilla_test_id: '',
  tema_ids: [],
  numero_preguntas: 20,
  dificultad: 'mixto',
  modo_test: 'normal',
  intentos_maximos: '',
  permitir_reintento: true,
  resultados_visibles_desde: 'inmediato',
  revision_visible_desde: 'inmediato',
  notificar_alumnos: false,
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoOrNull(value) {
  return value ? new Date(value).toISOString() : null;
}

const inputStyle = {
  width: '100%',
  minHeight: 38,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '8px 10px',
  color: '#0f172a',
  background: '#fff',
  fontSize: '.82rem',
};

const labelStyle = { color: '#334155', fontSize: '.76rem', fontWeight: 900, marginBottom: 6, display: 'block' };

function Field({ label, children }) {
  return (
    <label>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export default function ProfesorCalendarioPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [tests, setTests] = useState([]);
  const [simulacros, setSimulacros] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resultados, setResultados] = useState(null);
  const [resultadosLoading, setResultadosLoading] = useState(false);
  const [resultadosError, setResultadosError] = useState('');
  const [recordatorioLoading, setRecordatorioLoading] = useState(false);
  const [recordatorioMessage, setRecordatorioMessage] = useState('');

  const selectedOposicionId = form.oposicion_id ? Number(form.oposicion_id) : null;

  const load = () => {
    setLoading(true);
    setError('');
    return Promise.all([
      profesorApi.listPlanificacion(token),
      profesorApi.getWorkspaceOposiciones(token),
      profesorApi.getWorkspaceTemario(token),
      profesorApi.getMisTests(token, { page: 1, page_size: 100 }),
      profesorApi.getMisSimulacros(token, { page: 1, page_size: 100 }),
    ])
      .then(([plan, ops, temario, testsResp, simsResp]) => {
        const opItems = ops.items ?? [];
        setItems(Array.isArray(plan) ? plan : []);
        setOposiciones(opItems);
        setTemas(temario.items ?? []);
        setTests(testsResp.items ?? testsResp.data ?? []);
        setSimulacros(simsResp.items ?? simsResp.data ?? []);
        if (opItems.length === 1) {
          setForm((current) => current.oposicion_id ? current : ({ ...current, oposicion_id: String(opItems[0].id) }));
        }
      })
      .catch((err) => setError(err.message || 'No se pudo cargar la planificación'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const key = item.fecha_inicio
        ? new Date(item.fecha_inicio).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        : 'Sin fecha';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const temasFiltrados = useMemo(
    () => temas.filter((tema) => !selectedOposicionId || Number(tema.oposicion_id) === selectedOposicionId),
    [temas, selectedOposicionId],
  );

  const testsFiltrados = useMemo(
    () => tests.filter((test) => !selectedOposicionId || Number(test.oposicion_id) === selectedOposicionId),
    [tests, selectedOposicionId],
  );

  const simulacrosFiltrados = useMemo(
    () => simulacros.filter((simulacro) => !selectedOposicionId || Number(simulacro.oposicion_id) === selectedOposicionId),
    [simulacros, selectedOposicionId],
  );

  const update = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'oposicion_id') {
        next.tema_ids = [];
        next.simulacro_id = '';
        next.plantilla_test_id = '';
      }
      if (field === 'tipo') {
        next.tema_ids = [];
        next.simulacro_id = '';
        next.plantilla_test_id = '';
      }
      return next;
    });
  };

  const toggleTema = (temaId) => {
    setForm((current) => ({
      ...current,
      tema_ids: current.tema_ids.includes(temaId)
        ? current.tema_ids.filter((id) => id !== temaId)
        : [...current.tema_ids, temaId],
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, oposicion_id: oposiciones.length === 1 ? String(oposiciones[0].id) : '' });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      oposicion_id: item.oposicion_id ? String(item.oposicion_id) : '',
      tipo: item.tipo || 'tema_recomendado',
      estado: item.estado === 'archivada' ? 'archivada' : item.estado || 'borrador',
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      fecha_inicio: toDateTimeLocal(item.fecha_inicio),
      fecha_fin: toDateTimeLocal(item.fecha_fin),
      duracion_minutos: item.duracion_minutos ?? '',
      simulacro_id: item.simulacro_id ? String(item.simulacro_id) : '',
      plantilla_test_id: item.plantilla_test_id ? String(item.plantilla_test_id) : '',
      tema_ids: (item.temas ?? []).map((tema) => Number(tema.id)),
      numero_preguntas: item.numero_preguntas ?? 20,
      dificultad: item.dificultad || 'mixto',
      modo_test: item.modo_test || 'normal',
      intentos_maximos: item.intentos_maximos ?? '',
      permitir_reintento: item.permitir_reintento ?? true,
      resultados_visibles_desde: item.resultados_visibles_desde || 'inmediato',
      revision_visible_desde: item.revision_visible_desde || 'inmediato',
      notificar_alumnos: item.notificar_alumnos ?? false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      oposicion_id: Number(form.oposicion_id),
      fecha_inicio: toIsoOrNull(form.fecha_inicio),
      fecha_fin: toIsoOrNull(form.fecha_fin),
      descripcion: form.descripcion || null,
      duracion_minutos: form.duracion_minutos ? Number(form.duracion_minutos) : null,
      numero_preguntas: form.numero_preguntas ? Number(form.numero_preguntas) : null,
      intentos_maximos: form.intentos_maximos ? Number(form.intentos_maximos) : null,
      simulacro_id: form.tipo === 'simulacro' ? Number(form.simulacro_id) : null,
      plantilla_test_id: form.tipo === 'plantilla_test' ? Number(form.plantilla_test_id) : null,
      tema_ids: form.tipo === 'tema_recomendado' ? form.tema_ids.map(Number) : [],
      dificultad: (form.dificultad && form.dificultad !== 'mixto') ? form.dificultad : null,
      modo_test: form.modo_test || null,
    };

    try {
      if (editingId) {
        await profesorApi.updatePlanificacion(token, editingId, payload);
      } else {
        await profesorApi.createPlanificacion(token, payload);
      }
      setForm({ ...emptyForm, oposicion_id: oposiciones.length === 1 ? String(oposiciones[0].id) : '' });
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la planificación');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (item) => {
    setSaving(true);
    setError('');
    try {
      await profesorApi.archivePlanificacion(token, item.id);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo archivar la actividad');
    } finally {
      setSaving(false);
    }
  };

  const viewResultados = async (item) => {
    setResultadosLoading(true);
    setResultadosError('');
    setRecordatorioMessage('');
    try {
      const data = await profesorApi.getPlanificacionResultados(token, item.id, { page: 1, page_size: 100 });
      setResultados(data);
    } catch (err) {
      setResultadosError(err.message || 'No se pudieron cargar los resultados');
    } finally {
      setResultadosLoading(false);
    }
  };

  const enviarRecordatorio = async () => {
    if (!resultados?.planificacion?.id) return;
    setRecordatorioLoading(true);
    setRecordatorioMessage('');
    setResultadosError('');
    try {
      const data = await profesorApi.recordarPlanificacionPendientes(token, resultados.planificacion.id);
      setRecordatorioMessage(data?.enviados > 0
        ? `Recordatorio enviado a ${data.enviados} alumno${data.enviados === 1 ? '' : 's'}.`
        : 'No hay alumnos pendientes de completar esta actividad.');
    } catch (err) {
      setResultadosError(err.message || 'No se pudo enviar el recordatorio');
    } finally {
      setRecordatorioLoading(false);
    }
  };

  return (
    <PageShell>
      <Header
        title="Planificación"
        subtitle="Programa simulacros oficiales y actividades del Plan de estudio."
        action={<Button onClick={showForm ? closeForm : openCreate}>{showForm ? 'Cerrar' : 'Nueva actividad'}</Button>}
      />

      {showForm && (
        <Panel title={editingId ? 'Editar actividad' : 'Nueva actividad'} subtitle="El alumno solo verá las actividades publicadas y no bloqueadas." style={{ marginBottom: 14 }}>
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
              <Field label="Oposición">
                <select value={form.oposicion_id} onChange={(event) => update('oposicion_id', event.target.value)} style={inputStyle} required>
                  <option value="">Selecciona oposición</option>
                  {oposiciones.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
                </select>
              </Field>
              <Field label="Tipo">
                <select value={form.tipo} onChange={(event) => update('tipo', event.target.value)} style={inputStyle}>
                  <option value="tema_recomendado">Tema recomendado</option>
                  <option value="plantilla_test">Test recomendado</option>
                  <option value="simulacro">Simulacro oficial</option>
                </select>
              </Field>
              <Field label="Estado">
                <select value={form.estado} onChange={(event) => update('estado', event.target.value)} style={inputStyle}>
                  <option value="borrador">Borrador</option>
                  <option value="publicada">Publicada</option>
                  {editingId && <option value="archivada">Archivada</option>}
                </select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)', gap: 12 }}>
              <Field label="Titulo">
                <input value={form.titulo} onChange={(event) => update('titulo', event.target.value)} style={inputStyle} required minLength={3} />
              </Field>
              <Field label="Descripcion">
                <input value={form.descripcion} onChange={(event) => update('descripcion', event.target.value)} style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Field label="Inicio">
                <input type="datetime-local" value={form.fecha_inicio} onChange={(event) => update('fecha_inicio', event.target.value)} style={inputStyle} required />
              </Field>
              <Field label="Fin">
                <input type="datetime-local" value={form.fecha_fin} onChange={(event) => update('fecha_fin', event.target.value)} style={inputStyle} />
              </Field>
              <Field label="Duración min.">
                <input type="number" min="1" value={form.duracion_minutos} onChange={(event) => update('duracion_minutos', event.target.value)} style={inputStyle} />
              </Field>
              <Field label="Intentos max.">
                <input type="number" min="1" value={form.intentos_maximos} onChange={(event) => update('intentos_maximos', event.target.value)} style={inputStyle} />
              </Field>
            </div>

            {form.tipo === 'tema_recomendado' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <Field label="Número de preguntas">
                    <input type="number" min="1" value={form.numero_preguntas} onChange={(event) => update('numero_preguntas', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Dificultad">
                    <select value={form.dificultad} onChange={(event) => update('dificultad', event.target.value)} style={inputStyle}>
                      <option value="mixto">Mixta</option>
                      <option value="facil">Fácil</option>
                      <option value="media">Media</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </Field>
                  <Field label="Modo">
                    <select value={form.modo_test} onChange={(event) => update('modo_test', event.target.value)} style={inputStyle}>
                      <option value="normal">Normal</option>
                      <option value="adaptativo">Adaptativo</option>
                      <option value="repaso">Repaso</option>
                    </select>
                  </Field>
                </div>
                <div>
                  <span style={labelStyle}>Temas</span>
                  <TemaMultiSelect
                    options={temasFiltrados.map((tema) => ({ value: tema.tema_id, label: tema.tema_nombre }))}
                    selectedValues={form.tema_ids}
                    onToggle={toggleTema}
                    placeholder="Selecciona uno o varios temas"
                    emptyText="No hay temas disponibles para esta oposicion"
                  />
                </div>
              </>
            )}

            {form.tipo === 'plantilla_test' && (
              <Field label="Test recomendado">
                <select value={form.plantilla_test_id} onChange={(event) => update('plantilla_test_id', event.target.value)} style={inputStyle} required>
                  <option value="">Selecciona test</option>
                  {testsFiltrados.map((test) => <option key={test.id} value={test.id}>{test.nombre}</option>)}
                </select>
              </Field>
            )}

            {form.tipo === 'simulacro' && (
              <Field label="Simulacro oficial">
                <select value={form.simulacro_id} onChange={(event) => update('simulacro_id', event.target.value)} style={inputStyle} required>
                  <option value="">Selecciona simulacro</option>
                  {simulacrosFiltrados.map((simulacro) => <option key={simulacro.id} value={simulacro.id}>{simulacro.nombre}</option>)}
                </select>
              </Field>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '.8rem', fontWeight: 800 }}>
                <input type="checkbox" checked={form.notificar_alumnos} onChange={(event) => update('notificar_alumnos', event.target.checked)} />
                Notificar alumnos al publicar
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={closeForm}>Cancelar</Button>
                <button type="submit" disabled={saving} style={{ ...inputStyle, width: 'auto', border: 'none', background: P, color: '#fff', fontWeight: 900, cursor: 'pointer', padding: '0 16px' }}>
                  {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Guardar actividad')}
                </button>
              </div>
            </div>
          </form>
        </Panel>
      )}

      {(resultados || resultadosLoading || resultadosError) && (
        <Panel
          title={resultados?.planificacion?.titulo || 'Resultados de actividad'}
          subtitle="Seguimiento de alumnos para esta actividad planificada."
          style={{ marginBottom: 14 }}
        >
          {resultadosLoading ? (
            <EmptyState title="Cargando resultados" text="Estamos recuperando el seguimiento de los alumnos." />
          ) : resultadosError ? (
            <EmptyState title="No se pudo cargar" text={resultadosError} />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Alumnos', value: resultados.pagination?.total ?? resultados.items?.length ?? 0 },
                  { label: 'Iniciados', value: resultados.planificacion?.alumnos_iniciados ?? 0 },
                  { label: 'Completados', value: resultados.planificacion?.completados ?? 0 },
                  { label: 'Media', value: Number(resultados.planificacion?.nota_media || 0).toFixed(1) },
                ].map((metric) => (
                  <div key={metric.label} style={{ minWidth: 118, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                    <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '1rem' }}>{metric.value}</div>
                    <div style={{ color: '#64748b', fontWeight: 800, fontSize: '.66rem', textTransform: 'uppercase' }}>{metric.label}</div>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <Button onClick={enviarRecordatorio} disabled={recordatorioLoading}>
                  {recordatorioLoading ? 'Enviando...' : 'Recordar pendientes'}
                </Button>
                <Button variant="secondary" onClick={() => setResultados(null)}>Cerrar</Button>
              </div>
              {recordatorioMessage && (
                <div style={{ marginBottom: 14, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#047857', borderRadius: 10, padding: '9px 12px', fontSize: '.78rem', fontWeight: 800 }}>
                  {recordatorioMessage}
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '.68rem', textTransform: 'uppercase' }}>
                      {['Alumno', 'Estado', 'Intentos', 'Completados', 'Nota media', 'Mejor nota', 'Ultimo intento'].map((head) => (
                        <th key={head} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(resultados.items ?? []).map((row) => (
                      <tr key={row.alumnoId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '.84rem' }}>{row.alumnoNombre}</div>
                          <div style={{ color: '#94a3b8', fontSize: '.7rem' }}>{row.alumnoEmail}</div>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{
                            borderRadius: 999,
                            padding: '4px 9px',
                            fontWeight: 900,
                            fontSize: '.68rem',
                            color: row.estado === 'completado' ? '#047857' : row.estado === 'iniciado' ? '#7c3aed' : '#64748b',
                            background: row.estado === 'completado' ? '#d1fae5' : row.estado === 'iniciado' ? '#ede9fe' : '#f1f5f9',
                          }}>
                            {row.estado}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px', color: '#334155', fontWeight: 800 }}>{row.intentos}</td>
                        <td style={{ padding: '11px 12px', color: '#334155', fontWeight: 800 }}>{row.completados}</td>
                        <td style={{ padding: '11px 12px', color: '#334155', fontWeight: 800 }}>{row.notaMedia == null ? '-' : row.notaMedia.toFixed(1)}</td>
                        <td style={{ padding: '11px 12px', color: '#334155', fontWeight: 800 }}>{row.mejorNota == null ? '-' : row.mejorNota.toFixed(1)}</td>
                        <td style={{ padding: '11px 12px', color: '#64748b', fontSize: '.76rem' }}>
                          {row.ultimaActividad ? formatDate(row.ultimaActividad) : 'Sin iniciar'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      )}

      <Panel
        title="Agenda académica"
        subtitle="Actividades visibles para el profesor; el alumno solo ve las publicadas y disponibles."
      >
        {loading ? (
          <EmptyState title="Cargando planificación" text="Estamos recuperando las actividades programadas." />
        ) : error ? (
          <EmptyState title="No se pudo cargar" text={error} />
        ) : items.length === 0 ? (
          <EmptyState title="Sin actividades" text="Todavía no hay simulacros ni tests planificados." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([day, dayItems]) => (
              <div key={day}>
                <div style={{ marginBottom: 8, color: '#475569', fontSize: '.78rem', fontWeight: 900, textTransform: 'capitalize' }}>
                  {day}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {dayItems.map((item) => {
                    const estado = item.estado_profesor || item.estado;
                    const iniciados = Number(item.alumnos_iniciados || 0);
                    const completados = Number(item.completados || 0);
                    const notaMedia = Number(item.nota_media || 0);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '150px minmax(220px, 1fr) minmax(210px, auto) auto auto auto auto',
                          gap: 14,
                          alignItems: 'center',
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: 12,
                          background: '#fff',
                        }}
                      >
                        <div>
                          <div style={{ color: P, fontWeight: 900, fontSize: '.82rem' }}>{formatDate(item.fecha_inicio)}</div>
                          {item.fecha_fin && <div style={{ color: '#94a3b8', fontSize: '.72rem' }}>Hasta {formatDate(item.fecha_fin)}</div>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.titulo}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '.76rem', marginTop: 3 }}>
                            {tipoLabel[item.tipo] || item.tipo} · {item.oposicion_nombre}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 8, justifyContent: 'end' }}>
                          {[
                            { label: 'Iniciados', value: iniciados },
                            { label: 'Completados', value: completados },
                            { label: 'Media', value: completados > 0 ? notaMedia.toFixed(1) : '-' },
                          ].map((metric) => (
                            <div key={metric.label} style={{ minWidth: 62, border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 8px', background: '#f8fafc' }}>
                              <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '.78rem' }}>{metric.value}</div>
                              <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '.58rem', textTransform: 'uppercase' }}>{metric.label}</div>
                            </div>
                          ))}
                        </div>
                        <span style={{
                          borderRadius: 999,
                          padding: '5px 10px',
                          color: estadoColor[estado] || '#64748b',
                          background: `${estadoColor[estado] || '#64748b'}18`,
                          fontWeight: 900,
                          fontSize: '.72rem',
                          whiteSpace: 'nowrap',
                        }}>
                          {estado}
                        </span>
                        <button type="button" disabled={saving} onClick={() => openEdit(item)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, minHeight: 34, padding: '0 10px', color: P, fontWeight: 900, cursor: 'pointer' }}>
                          Editar
                        </button>
                        <button type="button" disabled={resultadosLoading} onClick={() => viewResultados(item)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, minHeight: 34, padding: '0 10px', color: '#7c3aed', fontWeight: 900, cursor: 'pointer' }}>
                          Resultados
                        </button>
                        <button type="button" disabled={saving || estado === 'archivada'} onClick={() => archive(item)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, minHeight: 34, padding: '0 10px', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>
                          Archivar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
