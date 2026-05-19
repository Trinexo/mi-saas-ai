import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../../services/api';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';
import { Button, Header, P, PageShell, Panel, Progress, Select } from './ProfesorSharedUI';

const TH = { textAlign: 'left', padding: '10px 12px', fontSize: '.72rem', fontWeight: 900, color: '#64748b', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textTransform: 'uppercase' };
const TD = { padding: '10px 12px', fontSize: '.82rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9' };
const INPUT = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: '.85rem', boxSizing: 'border-box' };
const EMPTY_EDIT = { enunciado: '', explicacion: '', referenciaNormativa: '', nivelDificultad: 'media', opciones: [{texto:'',correcta:true},{texto:'',correcta:false},{texto:'',correcta:false},{texto:'',correcta:false}] };

export default function ProfesorPreguntasPage() {
  const { token } = useAuth();
  const [preguntas, setPreguntas] = useState([]);
  const [total, setTotal] = useState(0);
  const [problematicas, setProblematicas] = useState([]);
  const [oposiciones, setOposiciones] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ oposicion_id: '', tema_id: '', nivel_dificultad: '', q: '', page: 1, page_size: 15 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editMsg, setEditMsg] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [temas, setTemas] = useState([]);

  useEffect(() => { profesorApi.getMisOposiciones(token).then((data) => setOposiciones(data ?? [])).catch(() => {}); }, [token]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const oid = searchParams.get('oposicion_id');
    if (oid) setFilters((f) => ({ ...f, page: 1, oposicion_id: oid, tema_id: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!filters.oposicion_id) { setTemas([]); return; }
    fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api')}/temas?oposicion_id=${filters.oposicion_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setTemas(d?.data ?? d ?? [])).catch(() => setTemas([]));
  }, [filters.oposicion_id, token]);

  const startEdit = async (p) => {
    setEditError('');
    setEditMsg('');
    try {
      const data = await profesorApi.getPregunta(token, p.id);
      setEditForm({
        temaId: data.tema_id,
        enunciado: data.enunciado,
        explicacion: data.explicacion || '',
        referenciaNormativa: data.referencia_normativa || '',
        nivelDificultad: data.nivel_dificultad || 'media',
        opciones: data.opciones?.map((o) => ({ texto: o.texto, correcta: o.correcta })) ?? EMPTY_EDIT.opciones,
      });
      setEditingId(p.id);
      setTimeout(() => document.getElementById('profesor-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY_EDIT); setEditMsg(''); setEditError(''); };

  const onEditOpcionTexto = (i, val) => setEditForm((f) => { const ops = [...f.opciones]; ops[i] = { ...ops[i], texto: val }; return { ...f, opciones: ops }; });
  const onEditOpcionCorrecta = (i) => setEditForm((f) => { const ops = f.opciones.map((o, idx) => ({ ...o, correcta: idx === i })); return { ...f, opciones: ops }; });

  const onSaveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    setEditMsg('');
    try {
      await profesorApi.updatePregunta(token, editingId, {
        ...editForm,
        temaId: Number(editForm.temaId),
        explicacion: editForm.explicacion || '',
      });
      setEditMsg('Pregunta actualizada correctamente.');
      setEditingId(null);
      setEditForm(EMPTY_EDIT);
      load();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    setError('');
    setEditError('');
    setEditMsg('');
    try {
      await profesorApi.deletePregunta(token, id);
      if (editingId === id) cancelEdit();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      profesorApi.getMisPreguntas(token, filters),
      profesorApi.getPreguntasProblematicas(token, {
        oposicion_id: filters.oposicion_id || undefined,
        page: 1,
        page_size: 100,
      }),
    ])
      .then(([res, prob]) => {
        setPreguntas(res?.items ?? []);
        setTotal(res?.pagination?.total ?? 0);
        setProblematicas(prob?.items ?? []);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / filters.page_size));
  const updateFilter = (key, value) => setFilters((f) => ({ ...f, page: 1, [key]: value }));
  const updateOposicion = (val) => setFilters((f) => ({ ...f, page: 1, oposicion_id: val, tema_id: '' }));
  const problematicasById = new Map(problematicas.map((item) => [Number(item.id), item]));
  const totalReportes = problematicas.reduce((acc, item) => acc + Number(item.reportes ?? 0), 0);
  const preguntasConActividad = preguntas.filter((p) => Number(p.intentos ?? 0) > 0);
  const mediaAcierto = preguntasConActividad.length
    ? Math.round(
        preguntasConActividad.reduce((acc, p) => acc + (Number(p.aciertos ?? 0) / Number(p.intentos)) * 100, 0)
        / preguntasConActividad.length
      )
    : null;

  return (
    <PageShell>
      <Header title="Banco de preguntas" subtitle="Detecta preguntas ambiguas, demasiado faciles o con baja tasa de aciertos." action={<Button to="/profesor/preguntas/nueva">+ Nueva pregunta</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
        <MiniKpi label="Preguntas disponibles" value={total} />
        <MiniKpi label="Acierto estimado" value={mediaAcierto === null ? '-' : `${mediaAcierto}%`} />
        <MiniKpi label="Reportes abiertos" value={totalReportes} />
        <MiniKpi label="Problematicas" value={problematicas.length} />
      </div>

      <Panel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <span style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8', fontSize: 14 }}>Q</span>
            <input type="text" placeholder="Buscar preguntas..." value={filters.q} onChange={(e) => updateFilter('q', e.target.value)} style={{ width: '100%', height: 38, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 12px 0 36px', boxSizing: 'border-box', fontSize: '.82rem' }} />
          </div>
          <Select value={filters.oposicion_id} onChange={(e) => updateOposicion(e.target.value)}>
            <option value="">Todas las oposiciones</option>
            {oposiciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </Select>
          {temas.length > 0 && (
            <Select value={filters.tema_id} onChange={(e) => updateFilter('tema_id', e.target.value)}>
              <option value="">Todos los temas</option>
              {temas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </Select>
          )}
          <Select value={filters.nivel_dificultad} onChange={(e) => updateFilter('nivel_dificultad', e.target.value)}>
            <option value="">Todas las dificultades</option>
            <option value="facil">Fácil</option>
            <option value="media">Media</option>
            <option value="dificil">Difícil</option>
          </Select>
        </div>

        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={TH}>Pregunta</th><th style={TH}>Oposición</th><th style={TH}>Tema</th><th style={TH}>Dificultad</th><th style={TH}>Intentos</th><th style={TH}>Aciertos</th><th style={TH}>Reportes</th><th style={TH}>Revisión</th><th style={TH}></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#94a3b8' }}>Cargando...</td></tr>}
              {!loading && preguntas.length === 0 && <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#94a3b8' }}>Sin resultados</td></tr>}
              {!loading && preguntas.map((p, index) => {
                const problematica = problematicasById.get(Number(p.id));
                const intentos = Number(p.intentos ?? 0);
                const aciertos = intentos > 0 ? Math.round(100 * Number(p.aciertos ?? 0) / intentos) : 0;
                const reportes = Number(p.reportes ?? 0);
                return (
                  <tr key={p.id} style={{ background: editingId === p.id ? '#fefce8' : undefined }}>
                    <td style={{ ...TD, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 }}>{p.enunciado}</td>
                    <td style={TD}>{p.oposicion_nombre ?? '-'}</td>
                    <td style={TD}>{p.tema_nombre ?? p.bloque_nombre ?? '-'}</td>
                    <td style={TD}>
                      <Badge tone={getDifficultyTone(p.nivel_dificultad)}>
                        {({ facil: 'Fácil', media: 'Media', dificil: 'Difícil' })[p.nivel_dificultad] ?? p.nivel_dificultad ?? '-'}
                      </Badge>
                    </td>
                    <td style={TD}>{intentos || '-'}</td>
                    <td style={{ ...TD, minWidth: 130 }}>{intentos > 0 ? <Progress value={aciertos} color={P} /> : '-'}</td>
                    <td style={TD}>{reportes}</td>
                    <td style={TD}>{problematica ? <Badge tone="danger">Revisar</Badge> : <Badge tone="ok">Correcta</Badge>}</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => editingId === p.id ? cancelEdit() : startEdit(p)} style={{ border: 'none', borderRadius: 7, padding: '4px 12px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', background: editingId === p.id ? '#ede9fe' : '#f1f5f9', color: editingId === p.id ? '#7c3aed' : '#475569' }}>{editingId === p.id ? 'Cerrar' : 'Editar'}</button>
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          disabled={deletingId === p.id}
                          style={{ border: '1px solid #fecaca', borderRadius: 7, padding: '4px 12px', fontSize: '.75rem', fontWeight: 700, cursor: deletingId === p.id ? 'wait' : 'pointer', background: '#fff1f2', color: '#b91c1c', opacity: deletingId === p.id ? 0.7 : 1 }}
                        >
                          {deletingId === p.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, color: '#64748b', fontSize: '.82rem' }}>
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} style={PAGER}>Anterior</button>
            Pag {filters.page} / {totalPages}
            <button disabled={filters.page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} style={PAGER}>Siguiente</button>
          </div>
        )}
      </Panel>

      {editMsg && <div style={{ padding: 12, background: '#dcfce7', color: '#15803d', borderRadius: 8, marginTop: 12 }}>{editMsg}</div>}

      {editingId && (
        <Panel>
          <h3 id="profesor-edit-form" style={{ margin: '0 0 16px', fontSize: '.9rem', fontWeight: 900, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
            Editando pregunta #{editingId}
          </h3>
          {editError && <div style={{ padding: 10, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 12, fontSize: '.82rem' }}>{editError}</div>}
          <form onSubmit={onSaveEdit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600 }}>
              Enunciado *
              <textarea rows={3} required value={editForm.enunciado} onChange={(e) => setEditForm((f) => ({ ...f, enunciado: e.target.value }))} style={{ ...INPUT, resize: 'vertical' }} />
            </label>

            <div>
              <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 8 }}>Opciones (marca la correcta)</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {editForm.opciones.map((op, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="radio" name="correcta" checked={op.correcta} onChange={() => onEditOpcionCorrecta(i)} style={{ cursor: 'pointer', accentColor: '#7c3aed' }} />
                    <input
                      type="text"
                      required
                      value={op.texto}
                      onChange={(e) => onEditOpcionTexto(i, e.target.value)}
                      placeholder={`Opción ${i + 1}`}
                      style={{ ...INPUT, flex: 1, border: op.correcta ? '1.5px solid #7c3aed' : '1px solid #e5e7eb', background: op.correcta ? '#f5f3ff' : '#fff' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600 }}>
                Explicación
                <input value={editForm.explicacion} onChange={(e) => setEditForm((f) => ({ ...f, explicacion: e.target.value }))} style={INPUT} placeholder="Explicación de la respuesta correcta" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600 }}>
                Referencia normativa
                <input value={editForm.referenciaNormativa} onChange={(e) => setEditForm((f) => ({ ...f, referenciaNormativa: e.target.value }))} style={INPUT} placeholder="Ej: Art. 14 CE" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.85rem', fontWeight: 600 }}>
                Dificultad
                <select value={editForm.nivelDificultad} onChange={(e) => setEditForm((f) => ({ ...f, nivelDificultad: e.target.value }))} style={{ ...INPUT, width: 130 }}>
                  <option value="facil">Fácil</option>
                  <option value="media">Media</option>
                  <option value="dificil">Difícil</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={editSaving} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={cancelEdit} style={{ background: '#fff', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}
    </PageShell>
  );
}

function MiniKpi({ label, value }) {
  return <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}><div style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 900 }}>{label}</div><div style={{ color: '#0f172a', fontSize: '1.35rem', fontWeight: 900, marginTop: 6 }}>{value}</div></div>;
}

function Badge({ children, tone = 'default' }) {
  const tones = {
    default: { background: '#fff7ed', color: '#f97316' },
    easy: { background: '#dcfce7', color: '#15803d' },
    medium: { background: '#fff7ed', color: '#ea580c' },
    danger: { background: '#fef2f2', color: '#dc2626' },
    ok: { background: '#dcfce7', color: '#15803d' },
  };
  return <span style={{ ...(tones[tone] ?? tones.default), borderRadius: 999, padding: '3px 8px', fontWeight: 900, fontSize: '.72rem' }}>{children}</span>;
}

function getDifficultyTone(difficulty) {
  if (difficulty === 'facil') return 'easy';
  if (difficulty === 'media') return 'medium';
  if (difficulty === 'dificil') return 'danger';
  return 'default';
}

const ICON_BTN = { minWidth: 34, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#64748b', display: 'inline-grid', placeItems: 'center', marginRight: 5, cursor: 'pointer', fontSize: '.7rem', fontWeight: 800 };
const PAGER = { border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: '6px 12px', color: '#334155', fontWeight: 800, cursor: 'pointer' };
