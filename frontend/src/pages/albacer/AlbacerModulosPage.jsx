import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';
import { profesorApi } from '../../services/profesorApi';
import { albacerApi } from '../../services/albacerApi';
import { Button, EmptyState, Header, PageShell, Panel, P } from '../profesor/ProfesorSharedUI';

const FIELD = {
  width: '100%',
  minHeight: 40,
  border: '1px solid #e5e7eb',
  borderRadius: 9,
  background: '#fff',
  padding: '0 12px',
  color: '#0f172a',
  fontSize: '.86rem',
  boxSizing: 'border-box',
};

const TEXTAREA = {
  ...FIELD,
  minHeight: 92,
  padding: '10px 12px',
  resize: 'vertical',
};

const TH = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#64748b',
  fontSize: '.72rem',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const TD = {
  padding: '12px',
  borderBottom: '1px solid #f1f5f9',
  color: '#334155',
  fontSize: '.84rem',
  verticalAlign: 'top',
};

const STATUS = {
  borrador: { label: 'Borrador', bg: '#f3f4f6', color: '#374151' },
  publicado: { label: 'Publicado', bg: '#dcfce7', color: '#166534' },
  archivado: { label: 'Archivado', bg: '#f1f5f9', color: '#64748b' },
};

const emptyForm = {
  id: null,
  oposicion_id: '',
  nombre: '',
  descripcion: '',
  orden: 0,
  estado: 'borrador',
  tema_ids: [],
};

const emptyTestForm = {
  nombre: '',
  descripcion: '',
  estado: 'borrador',
  nivel_dificultad: '',
  duracion_minutos: '',
  mezclar_preguntas: true,
  mostrar_resultados: true,
  mostrar_explicaciones: false,
  tipo_puntuacion: 'estandar',
  pts_acierto: 1,
  pts_fallo: -0.25,
  pts_blanco: 0,
  tema_ids: [],
};

function normalizeOposiciones(payload) {
  const items = payload?.items ?? payload?.oposiciones ?? payload ?? [];
  return Array.isArray(items) ? items.map((item) => ({
    id: Number(item.id ?? item.oposicion_id),
    nombre: item.nombre ?? item.oposicion_nombre ?? 'Oposición',
  })).filter((item) => item.id) : [];
}

function normalizeTemaIds(items) {
  return [...new Set(
    (Array.isArray(items) ? items : [])
      .map((value) => String(value))
      .filter(Boolean),
  )];
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        border: '1px solid #e5e7eb',
        background: value ? '#f5f3ff' : '#fff',
        color: value ? P : '#475569',
        borderRadius: 9,
        padding: '9px 10px',
        fontWeight: 900,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'inline-block', width: 30, color: value ? P : '#94a3b8' }}>{value ? 'ON' : 'OFF'}</span>
      {label}
    </button>
  );
}

function normalizeTemas(payload) {
  const items = payload?.items ?? payload ?? [];
  return Array.isArray(items) ? items.map((item) => ({
    id: Number(item.id ?? item.tema_id),
    nombre: item.nombre ?? item.tema_nombre ?? 'Tema',
  })).filter((item) => item.id) : [];
}

function Badge({ estado }) {
  const config = STATUS[estado] ?? STATUS.borrador;
  return (
    <span style={{ background: config.bg, color: config.color, borderRadius: 999, padding: '3px 10px', fontSize: '.74rem', fontWeight: 900 }}>
      {config.label}
    </span>
  );
}

function Metric({ label, value, accent = P }) {
  return (
    <Panel style={{ padding: 16, minHeight: 88 }}>
      <div style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>{label}</div>
      <div style={{ color: '#0f172a', fontSize: '1.55rem', lineHeight: 1, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ width: 36, height: 3, background: accent, borderRadius: 99, marginTop: 12 }} />
    </Panel>
  );
}

function TemaPicker({ temas, selected, onChange }) {
  const selectedSet = new Set(selected.map(Number));
  const toggleTema = (id) => {
    const numericId = Number(id);
    const next = selectedSet.has(numericId)
      ? selected.filter((temaId) => Number(temaId) !== numericId)
      : [...selected, numericId];
    onChange(next);
  };

  if (!temas.length) {
    return <div style={{ color: '#94a3b8', fontSize: '.82rem', padding: '12px 0' }}>Selecciona una oposición con temas disponibles.</div>;
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, maxHeight: 210, overflowY: 'auto', padding: 8 }}>
      {temas.map((tema) => (
        <label key={tema.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 9px', borderRadius: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectedSet.has(tema.id)}
            onChange={() => toggleTema(tema.id)}
            style={{ marginTop: 2, accentColor: P }}
          />
          <span style={{ color: '#334155', fontSize: '.84rem', lineHeight: 1.35 }}>{tema.nombre}</span>
        </label>
      ))}
    </div>
  );
}

function ModuloModal({ open, form, temas, oposiciones, saving, error, isAdmin, onClose, onChange, onSave }) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', zIndex: 800, display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ width: 'min(760px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 24px 80px rgba(15,23,42,.28)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 950 }}>{form.id ? 'Editar módulo Albacer' : 'Nuevo módulo Albacer'}</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.82rem' }}>Define el nivel, sus temas y el estado de publicación.</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f8fafc', color: '#64748b', borderRadius: 9, width: 34, height: 34, cursor: 'pointer', fontWeight: 900 }}>x</button>
        </div>

        <div className="albacer-modulo-modal-grid" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(220px, .8fr)', gap: 18 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Nombre del módulo</span>
              <input value={form.nombre} onChange={(event) => onChange({ nombre: event.target.value })} style={FIELD} placeholder="Módulo 1 - Bases constitucionales" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Descripción</span>
              <textarea value={form.descripcion ?? ''} onChange={(event) => onChange({ descripcion: event.target.value })} style={TEXTAREA} placeholder="Objetivo académico y alcance del módulo" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Temas incluidos</span>
              <TemaPicker temas={temas} selected={form.tema_ids} onChange={(tema_ids) => onChange({ tema_ids })} />
            </label>
          </div>

          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Oposición</span>
              <select
                value={form.oposicion_id}
                onChange={(event) => onChange({ oposicion_id: event.target.value, tema_ids: [] })}
                disabled={Boolean(form.id) && !isAdmin}
                style={FIELD}
              >
                <option value="">Selecciona oposición</option>
                {oposiciones.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Orden / nivel</span>
              <input type="number" min="0" value={form.orden} onChange={(event) => onChange({ orden: event.target.value })} style={FIELD} />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Estado</span>
              <select value={form.estado} onChange={(event) => onChange({ estado: event.target.value })} style={FIELD}>
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
                <option value="archivado">Archivado</option>
              </select>
            </label>

            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, color: '#64748b', fontSize: '.8rem', lineHeight: 1.45 }}>
              Al publicar un módulo quedará preparado para que el alumno lo reciba como nivel del Modo Albacer cuando activemos la pantalla de alumno.
            </div>
          </div>
        </div>

        {error && <div style={{ margin: '0 20px 14px', background: '#fef2f2', color: '#b91c1c', borderRadius: 9, padding: '10px 12px', fontSize: '.82rem', fontWeight: 800 }}>{error}</div>}

        <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar módulo'}</Button>
        </div>
      </div>
    </div>
  );
}

function ModuloTestModal({ open, modulo, item, testId, temasModulo, token, isAdmin, api, onClose, onChanged }) {
  const [form, setForm] = useState(emptyTestForm);
  const [preguntas, setPreguntas] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState('');
  const [temaId, setTemaId] = useState('');
  const [dificultad, setDificultad] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const testApi = useMemo(() => (isAdmin
    ? {
      get: adminApi.getTest,
      update: adminApi.updateTest,
      addPreguntas: adminApi.addPreguntasTest,
      removePregunta: adminApi.removePreguntaTest,
      listPreguntas: adminApi.listPreguntas,
    }
    : {
      get: profesorApi.getMiTest,
      update: profesorApi.updateMiTest,
      addPreguntas: profesorApi.addPreguntasMiTest,
      removePregunta: profesorApi.removePreguntaMiTest,
      listPreguntas: profesorApi.getMisPreguntas,
    }), [isAdmin]);

  const selectedTemaIds = useMemo(
    () => normalizeTemaIds(form.tema_ids.length ? form.tema_ids : (modulo?.tema_ids ?? [])),
    [form.tema_ids, modulo?.tema_ids],
  );
  const preguntaIds = useMemo(() => new Set(preguntas.map((pregunta) => Number(pregunta.id))), [preguntas]);

  const loadTest = useCallback(async () => {
    if (!open || !testId) return;
    setLoading(true);
    setError('');
    try {
      const test = await testApi.get(token, testId);
      const temaIds = normalizeTemaIds((test.temas ?? []).map((tema) => tema.id));
      setForm({
        nombre: test.nombre ?? '',
        descripcion: test.descripcion ?? '',
        estado: test.estado ?? 'borrador',
        nivel_dificultad: test.nivel_dificultad ?? '',
        duracion_minutos: test.duracion_minutos ?? '',
        mezclar_preguntas: test.mezclar_preguntas ?? true,
        mostrar_resultados: test.mostrar_resultados ?? true,
        mostrar_explicaciones: test.mostrar_explicaciones ?? false,
        tipo_puntuacion: test.tipo_puntuacion ?? 'estandar',
        pts_acierto: test.pts_acierto ?? 1,
        pts_fallo: test.pts_fallo ?? -0.25,
        pts_blanco: test.pts_blanco ?? 0,
        tema_ids: temaIds.length ? temaIds : normalizeTemaIds(test.tema_id ? [test.tema_id] : (modulo?.tema_ids ?? [])),
      });
      setPreguntas(test.preguntas ?? []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el test del modulo.');
    } finally {
      setLoading(false);
    }
  }, [modulo?.tema_ids, open, testApi, testId, token]);

  const loadCandidates = useCallback(async () => {
    if (!open || !modulo?.oposicion_id) return;
    setLoadingCandidates(true);
    try {
      const effectiveTemaIds = temaId ? [temaId] : selectedTemaIds;
      const payload = await testApi.listPreguntas(token, {
        q: q || undefined,
        oposicion_id: modulo.oposicion_id,
        tema_id: temaId || undefined,
        tema_ids: !temaId && effectiveTemaIds.length ? effectiveTemaIds.join(',') : undefined,
        nivel_dificultad: dificultad || undefined,
        page: 1,
        page_size: 30,
      });
      setCandidates(payload?.items ?? []);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [dificultad, modulo?.oposicion_id, open, q, selectedTemaIds, temaId, testApi, token]);

  useEffect(() => { loadTest(); }, [loadTest]);
  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  if (!open) return null;

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveTest = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre del test es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        oposicion_id: Number(modulo.oposicion_id),
        tema_ids: form.tema_ids.map(Number),
        nivel_dificultad: form.nivel_dificultad || null,
        duracion_minutos: form.duracion_minutos ? Number(form.duracion_minutos) : null,
        pts_acierto: Number(form.pts_acierto),
        pts_fallo: Number(form.pts_fallo),
        pts_blanco: Number(form.pts_blanco),
      };
      await testApi.update(token, testId, payload);
      if (item?.id) {
        await api.updateItem(token, modulo.id, item.id, {
          titulo: form.nombre.trim(),
          descripcion: form.descripcion?.trim() || null,
        });
      }
      await onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el test.');
    } finally {
      setSaving(false);
    }
  };

  const removePregunta = async (preguntaId) => {
    setSaving(true);
    setError('');
    try {
      await testApi.removePregunta(token, testId, preguntaId);
      await loadTest();
      await onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo quitar la pregunta.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCandidate = (id) => {
    if (preguntaIds.has(Number(id))) return;
    setSelected((current) => (
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    ));
  };

  const addPreguntas = async () => {
    if (!selected.length) return;
    setSaving(true);
    setError('');
    try {
      await testApi.addPreguntas(token, testId, selected.map(Number));
      setSelected([]);
      await loadTest();
      await loadCandidates();
      await onChanged();
    } catch (err) {
      setError(err.message || 'No se pudieron anadir las preguntas.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.52)', zIndex: 900, display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ width: 'min(1120px, 100%)', maxHeight: '92vh', overflow: 'hidden', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 24px 80px rgba(15,23,42,.28)', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 950 }}>Test del modulo</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.82rem' }}>{modulo?.nombre}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f8fafc', color: '#64748b', borderRadius: 9, width: 34, height: 34, cursor: 'pointer', fontWeight: 900 }}>x</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 20, display: 'grid', gap: 16 }}>
          {loading ? (
            <div style={{ color: '#64748b', padding: 28, textAlign: 'center' }}>Cargando test...</div>
          ) : (
            <>
              {error && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: '.84rem', fontWeight: 800 }}>{error}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, .95fr) minmax(360px, 1.2fr)', gap: 16, alignItems: 'start' }}>
                <Panel title="Configuracion del test" style={{ padding: 18 }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 5 }}>
                      <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Nombre</span>
                      <input value={form.nombre} onChange={(event) => setField('nombre', event.target.value)} style={FIELD} />
                    </label>
                    <label style={{ display: 'grid', gap: 5 }}>
                      <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Descripcion</span>
                      <textarea value={form.descripcion ?? ''} onChange={(event) => setField('descripcion', event.target.value)} style={TEXTAREA} />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 5 }}>
                        <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Estado</span>
                        <select value={form.estado} onChange={(event) => setField('estado', event.target.value)} style={FIELD}>
                          <option value="borrador">Borrador</option>
                          <option value="publicado">Publicado</option>
                          <option value="archivado">Archivado</option>
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 5 }}>
                        <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Dificultad</span>
                        <select value={form.nivel_dificultad ?? ''} onChange={(event) => setField('nivel_dificultad', event.target.value)} style={FIELD}>
                          <option value="">Mixta</option>
                          <option value="facil">Facil</option>
                          <option value="media">Media</option>
                          <option value="dificil">Dificil</option>
                        </select>
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 5 }}>
                        <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Acierto</span>
                        <input type="number" step="0.01" value={form.pts_acierto} onChange={(event) => setField('pts_acierto', event.target.value)} style={FIELD} />
                      </label>
                      <label style={{ display: 'grid', gap: 5 }}>
                        <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Fallo</span>
                        <input type="number" step="0.01" value={form.pts_fallo} onChange={(event) => setField('pts_fallo', event.target.value)} style={FIELD} />
                      </label>
                      <label style={{ display: 'grid', gap: 5 }}>
                        <span style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>Blanco</span>
                        <input type="number" step="0.01" value={form.pts_blanco} onChange={(event) => setField('pts_blanco', event.target.value)} style={FIELD} />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      <Toggle value={form.mezclar_preguntas} onChange={(value) => setField('mezclar_preguntas', value)} label="Mezclar preguntas" />
                      <Toggle value={form.mostrar_resultados} onChange={(value) => setField('mostrar_resultados', value)} label="Mostrar resultados al finalizar" />
                      <Toggle value={form.mostrar_explicaciones} onChange={(value) => setField('mostrar_explicaciones', value)} label="Mostrar explicaciones" />
                    </div>
                  </div>
                </Panel>

                <Panel title={`Preguntas seleccionadas (${preguntas.length})`} style={{ padding: 18 }}>
                  {preguntas.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: 16, textAlign: 'center' }}>Este test aun no tiene preguntas.</div>
                  ) : (
                    <div style={{ maxHeight: 360, overflowY: 'auto', display: 'grid', gap: 8 }}>
                      {preguntas.map((pregunta) => (
                        <div key={pregunta.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#0f172a', fontSize: '.84rem', fontWeight: 850, lineHeight: 1.35 }}>{pregunta.enunciado}</div>
                            <div style={{ color: '#94a3b8', fontSize: '.74rem', marginTop: 4 }}>{pregunta.tema_nombre ?? 'Sin tema'} · {pregunta.nivel_dificultad ?? 'sin dificultad'}</div>
                          </div>
                          <button onClick={() => removePregunta(pregunta.id)} disabled={saving} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>Quitar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel title="Anadir preguntas" subtitle="Filtra por los temas del modulo y selecciona las preguntas que quieres incorporar." style={{ padding: 18 }}>
                <div className="albacer-test-modal-tools" style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, .8fr) minmax(140px, .55fr) auto', gap: 10, marginBottom: 12 }}>
                  <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar preguntas..." style={FIELD} />
                  <select value={temaId} onChange={(event) => setTemaId(event.target.value)} style={FIELD}>
                    <option value="">Temas del modulo</option>
                    {temasModulo.map((tema) => <option key={tema.id} value={tema.id}>{tema.nombre}</option>)}
                  </select>
                  <select value={dificultad} onChange={(event) => setDificultad(event.target.value)} style={FIELD}>
                    <option value="">Dificultad</option>
                    <option value="facil">Facil</option>
                    <option value="media">Media</option>
                    <option value="dificil">Dificil</option>
                  </select>
                  <button onClick={addPreguntas} disabled={saving || selected.length === 0} style={{ border: 'none', background: selected.length ? P : '#c4b5fd', color: '#fff', borderRadius: 9, padding: '0 14px', minHeight: 40, fontWeight: 900, cursor: selected.length ? 'pointer' : 'not-allowed' }}>Anadir {selected.length || ''}</button>
                </div>
                {loadingCandidates ? (
                  <div style={{ color: '#64748b', padding: 18, textAlign: 'center' }}>Cargando preguntas...</div>
                ) : candidates.length === 0 ? (
                  <div style={{ color: '#94a3b8', padding: 18, textAlign: 'center' }}>No hay preguntas con esos filtros.</div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                    {candidates.map((pregunta) => {
                      const exists = preguntaIds.has(Number(pregunta.id));
                      const checked = selected.includes(pregunta.id);
                      return (
                        <label key={pregunta.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: 11, borderBottom: '1px solid #f1f5f9', cursor: exists ? 'not-allowed' : 'pointer', background: checked ? '#f5f3ff' : '#fff' }}>
                          <input type="checkbox" checked={checked || exists} disabled={exists} onChange={() => toggleCandidate(pregunta.id)} style={{ accentColor: P }} />
                          <span>
                            <span style={{ display: 'block', color: '#0f172a', fontSize: '.83rem', fontWeight: 800, lineHeight: 1.35 }}>{pregunta.enunciado}</span>
                            <span style={{ display: 'block', color: exists ? '#16a34a' : '#94a3b8', fontSize: '.72rem', marginTop: 3 }}>{exists ? 'Ya esta en este test' : (pregunta.tema_nombre ?? 'Sin tema')}</span>
                          </span>
                          <span style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 900 }}>{pregunta.nivel_dificultad ?? '-'}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#334155', borderRadius: 9, padding: '9px 14px', fontWeight: 900, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={saveTest} disabled={saving || loading} style={{ border: 'none', background: saving ? '#c4b5fd' : P, color: '#fff', borderRadius: 9, padding: '9px 16px', fontWeight: 950, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AlbacerModulosPage({ scope = 'profesor' }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = scope === 'admin' || user?.role === 'admin';
  const [oposiciones, setOposiciones] = useState([]);
  const [selectedOposicion, setSelectedOposicion] = useState('');
  const [temas, setTemas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [contentModulo, setContentModulo] = useState(null);
  const [items, setItems] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [itemTipo, setItemTipo] = useState('test');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');
  const [autoForm, setAutoForm] = useState({
    numero_tests: 2,
    preguntas_por_test: 20,
    preguntas_simulacro_final: 50,
    nivel_dificultad: '',
    permitir_repetidas: false,
  });
  const [testEditor, setTestEditor] = useState(null);

  const api = useMemo(() => ({
    list: isAdmin ? albacerApi.listAdminModulos : albacerApi.listProfesorModulos,
    create: isAdmin ? albacerApi.createAdminModulo : albacerApi.createProfesorModulo,
    update: isAdmin ? albacerApi.updateAdminModulo : albacerApi.updateProfesorModulo,
    delete: isAdmin ? albacerApi.deleteAdminModulo : albacerApi.deleteProfesorModulo,
    listItems: isAdmin ? albacerApi.listAdminModuloItems : albacerApi.listProfesorModuloItems,
    createItem: isAdmin ? albacerApi.createAdminModuloItem : albacerApi.createProfesorModuloItem,
    updateItem: isAdmin ? albacerApi.updateAdminModuloItem : albacerApi.updateProfesorModuloItem,
    deleteItem: isAdmin ? albacerApi.deleteAdminModuloItem : albacerApi.deleteProfesorModuloItem,
    createModuloTest: isAdmin ? albacerApi.createAdminModuloTest : albacerApi.createProfesorModuloTest,
    generateModuloAuto: isAdmin ? albacerApi.generateAdminModuloAuto : albacerApi.generateProfesorModuloAuto,
  }), [isAdmin]);

  const loadOposiciones = useCallback(async () => {
    const payload = isAdmin
      ? await adminApi.listOposicionesConStats(token, { page_size: 200 })
      : await profesorApi.getWorkspaceOposiciones(token);
    const items = normalizeOposiciones(payload);
    setOposiciones(items);
    setSelectedOposicion((current) => current || (items.length === 1 ? String(items[0].id) : ''));
  }, [isAdmin, token]);

  const loadTemas = useCallback(async (oposicionId) => {
    if (!oposicionId) {
      setTemas([]);
      return;
    }
    const payload = isAdmin
      ? await adminApi.listTemas(token, oposicionId)
      : await profesorApi.getWorkspaceTemario(token, { oposicion_id: oposicionId });
    setTemas(normalizeTemas(payload));
  }, [isAdmin, token]);

  const loadModulos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.list(token, {
        q: q || undefined,
        estado: estado || undefined,
        oposicion_id: selectedOposicion || undefined,
        page: 1,
        page_size: 100,
      });
      setModulos(payload?.items ?? []);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los módulos Albacer.');
      setModulos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [api, estado, q, selectedOposicion, token]);

  useEffect(() => { loadOposiciones().catch(() => setOposiciones([])); }, [loadOposiciones]);
  useEffect(() => { loadTemas(selectedOposicion).catch(() => setTemas([])); }, [loadTemas, selectedOposicion]);
  useEffect(() => { loadModulos(); }, [loadModulos]);

  const loadItems = useCallback(async (modulo = contentModulo) => {
    if (!modulo?.id) return;
    setLoadingItems(true);
    setItemError('');
    try {
      const payload = await api.listItems(token, modulo.id);
      setItems(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setItemError(err.message || 'No se pudo cargar el contenido del módulo.');
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [api, contentModulo, token]);

  const loadCandidates = useCallback(async (modulo = contentModulo, tipo = itemTipo) => {
    if (!modulo?.oposicion_id) {
      setCandidates([]);
      return;
    }
    try {
      const payload = tipo === 'test'
        ? await (isAdmin ? adminApi.listTests : profesorApi.getMisTests)(token, { oposicion_id: modulo.oposicion_id, page: 1, page_size: 100 })
        : await (isAdmin ? adminApi.listSimulacros : profesorApi.getMisSimulacros)(token, { oposicion_id: modulo.oposicion_id, page: 1, page_size: 100 });
      setCandidates(payload?.items ?? []);
    } catch {
      setCandidates([]);
    }
  }, [contentModulo, isAdmin, itemTipo, token]);

  useEffect(() => { if (contentModulo) loadItems(contentModulo); }, [contentModulo, loadItems]);
  useEffect(() => { if (contentModulo) loadCandidates(contentModulo, itemTipo); }, [contentModulo, itemTipo, loadCandidates]);

  const metrics = useMemo(() => {
    const publicados = modulos.filter((modulo) => modulo.estado === 'publicado').length;
    const borradores = modulos.filter((modulo) => modulo.estado === 'borrador').length;
    const temasAsignados = new Set(modulos.flatMap((modulo) => modulo.tema_ids ?? [])).size;
    const simulacros = modulos.reduce((acc, modulo) => acc + Number(modulo.total_simulacros_finales ?? 0), 0);
    return { publicados, borradores, temasAsignados, simulacros };
  }, [modulos]);

  const openCreate = () => {
    setModalError('');
    setForm({
      ...emptyForm,
      oposicion_id: selectedOposicion || (oposiciones.length === 1 ? String(oposiciones[0].id) : ''),
      orden: modulos.length + 1,
    });
    setModalOpen(true);
  };

  const openEdit = (modulo) => {
    setModalError('');
    setForm({
      id: modulo.id,
      oposicion_id: String(modulo.oposicion_id),
      nombre: modulo.nombre ?? '',
      descripcion: modulo.descripcion ?? '',
      orden: modulo.orden ?? 0,
      estado: modulo.estado ?? 'borrador',
      tema_ids: modulo.tema_ids ?? [],
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (modalOpen) {
      loadTemas(form.oposicion_id).catch(() => setTemas([]));
    }
  }, [form.oposicion_id, loadTemas, modalOpen]);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const buildPayload = () => ({
    oposicion_id: Number(form.oposicion_id),
    nombre: form.nombre.trim(),
    descripcion: form.descripcion?.trim() || null,
    orden: Number(form.orden || 0),
    estado: form.estado,
    tema_ids: form.tema_ids.map(Number),
  });

  const saveModulo = async () => {
    setSaving(true);
    setModalError('');
    try {
      const payload = buildPayload();
      if (!payload.oposicion_id) throw new Error('Selecciona una oposición.');
      if (payload.nombre.length < 3) throw new Error('El nombre debe tener al menos 3 caracteres.');
      if (form.id) {
        await api.update(token, form.id, payload);
      } else {
        await api.create(token, payload);
      }
      setModalOpen(false);
      await loadModulos();
    } catch (err) {
      setModalError(err.message || 'No se pudo guardar el módulo.');
    } finally {
      setSaving(false);
    }
  };

  const deleteModulo = async (id) => {
    setError('');
    try {
      await api.delete(token, id);
      setConfirmDeleteId(null);
      await loadModulos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el módulo.');
    }
  };

  const openContent = (modulo) => {
    setContentModulo(modulo);
    setItemTipo('test');
    setSelectedCandidateId('');
    setItemError('');
  };

  const addItem = async () => {
    if (!contentModulo?.id || !selectedCandidateId) return;
    const selected = candidates.find((candidate) => Number(candidate.id) === Number(selectedCandidateId));
    setSavingItem(true);
    setItemError('');
    try {
      await api.createItem(token, contentModulo.id, {
        tipo: itemTipo,
        titulo: selected?.nombre ?? (itemTipo === 'test' ? 'Test del módulo' : 'Simulacro final'),
        plantilla_test_id: itemTipo === 'test' ? Number(selectedCandidateId) : undefined,
        simulacro_id: itemTipo === 'simulacro_final' ? Number(selectedCandidateId) : undefined,
        obligatorio: itemTipo === 'simulacro_final',
      });
      setSelectedCandidateId('');
      await loadItems(contentModulo);
      await loadModulos();
    } catch (err) {
      setItemError(err.message || 'No se pudo añadir el contenido.');
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId) => {
    if (!contentModulo?.id) return;
    setSavingItem(true);
    setItemError('');
    try {
      await api.deleteItem(token, contentModulo.id, itemId);
      await loadItems(contentModulo);
      await loadModulos();
    } catch (err) {
      setItemError(err.message || 'No se pudo eliminar el contenido.');
    } finally {
      setSavingItem(false);
    }
  };

  const editItemContent = (item) => {
    const base = isAdmin ? '/admin' : '/profesor';
    const suffix = `?from=albacer&modulo_id=${contentModulo.id}`;
    if (item.tipo === 'test' && item.plantilla_test_id) {
      setTestEditor({ testId: item.plantilla_test_id, item });
      return;
    }
    if (item.tipo === 'simulacro_final' && item.simulacro_id) {
      navigate(`${base}/simulacros/${item.simulacro_id}/editar${suffix}`);
    }
  };

  const createModuleTest = async () => {
    if (!contentModulo?.id) return;
    setSavingItem(true);
    setItemError('');
    try {
      const result = await api.createModuloTest(token, contentModulo.id, {
        nombre: `${contentModulo.nombre} - Test ${items.filter((item) => item.tipo === 'test').length + 1}`,
        descripcion: `Test del modulo ${contentModulo.nombre}`,
      });
      const testId = result?.test?.id;
      if (testId) {
        await loadItems(contentModulo);
        await loadModulos();
        setTestEditor({ testId, item: result?.item ?? null });
      } else {
        await loadItems(contentModulo);
        await loadModulos();
      }
    } catch (err) {
      setItemError(err.message || 'No se pudo crear el test del módulo.');
    } finally {
      setSavingItem(false);
    }
  };

  const generateAutoContent = async () => {
    if (!contentModulo?.id) return;
    setSavingItem(true);
    setItemError('');
    try {
      await api.generateModuloAuto(token, contentModulo.id, {
        numero_tests: Number(autoForm.numero_tests || 1),
        preguntas_por_test: Number(autoForm.preguntas_por_test || 1),
        preguntas_simulacro_final: Number(autoForm.preguntas_simulacro_final || 1),
        nivel_dificultad: autoForm.nivel_dificultad || null,
        permitir_repetidas: Boolean(autoForm.permitir_repetidas),
      });
      await loadItems(contentModulo);
      await loadModulos();
    } catch (err) {
      setItemError(err.message || 'No se pudo generar el contenido automatico.');
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <PageShell>
      <Header
        title="Módulos Albacer"
        subtitle={isAdmin ? 'Diseña niveles guiados por oposición para el método Albacer.' : 'Organiza los niveles guiados de tus oposiciones asignadas.'}
        action={<Button onClick={openCreate}>+ Nuevo módulo</Button>}
      />

      <div className="albacer-modulo-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <Metric label="Módulos visibles" value={metrics.publicados} accent="#10b981" />
        <Metric label="Borradores" value={metrics.borradores} accent="#f59e0b" />
        <Metric label="Temas cubiertos" value={metrics.temasAsignados} accent="#2563eb" />
        <Metric label="Simulacros finales" value={metrics.simulacros} accent={P} />
      </div>

      <Panel style={{ marginBottom: 16, padding: 14 }}>
        <div className="albacer-modulo-filters" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(160px, .45fr) minmax(180px, .45fr)', gap: 10 }}>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar módulo..."
            style={FIELD}
          />
          <select value={selectedOposicion} onChange={(event) => setSelectedOposicion(event.target.value)} style={FIELD}>
            <option value="">Todas las oposiciones</option>
            {oposiciones.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
          </select>
          <select value={estado} onChange={(event) => setEstado(event.target.value)} style={FIELD}>
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </select>
        </div>
      </Panel>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: '.84rem', fontWeight: 800, marginBottom: 14 }}>{error}</div>}

      <Panel title={`Módulos (${total})`} subtitle="Los tests y simulacros finales se añadirán dentro de cada módulo en el siguiente bloque.">
        {loading ? (
          <div style={{ color: '#64748b', padding: 28, textAlign: 'center' }}>Cargando módulos...</div>
        ) : modulos.length === 0 ? (
          <EmptyState title="Aún no hay módulos Albacer" text="Crea el primer módulo para empezar a construir el itinerario guiado." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={TH}>Orden</th>
                  <th style={TH}>Módulo</th>
                  <th style={TH}>Oposición</th>
                  <th style={TH}>Temas</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Contenido</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Alumnos</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modulos.map((modulo) => (
                  <tr key={modulo.id}>
                    <td style={{ ...TD, fontWeight: 900, color: '#0f172a' }}>{modulo.orden}</td>
                    <td style={TD}>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '.9rem' }}>{modulo.nombre}</strong>
                      {modulo.descripcion && <span style={{ display: 'block', color: '#94a3b8', marginTop: 4, maxWidth: 360 }}>{modulo.descripcion}</span>}
                    </td>
                    <td style={TD}>{modulo.oposicion_nombre ?? '-'}</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', maxWidth: 360 }}>
                        {(modulo.temas ?? []).length === 0 ? (
                          <span style={{ color: '#94a3b8' }}>Sin temas</span>
                        ) : modulo.temas.slice(0, 4).map((tema) => (
                          <span key={tema.id} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 999, padding: '3px 8px', fontSize: '.72rem', fontWeight: 800 }}>{tema.nombre}</span>
                        ))}
                        {(modulo.temas ?? []).length > 4 && <span style={{ color: '#64748b', fontWeight: 900, fontSize: '.72rem' }}>+{modulo.temas.length - 4}</span>}
                      </div>
                    </td>
                    <td style={TD}><Badge estado={modulo.estado} /></td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <strong style={{ color: '#0f172a' }}>{modulo.total_tests ?? 0}</strong> tests
                      <div style={{ color: '#64748b', fontSize: '.76rem' }}>{modulo.total_simulacros_finales ?? 0} simulacro final</div>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <strong style={{ color: '#0f172a' }}>{modulo.alumnos_iniciados ?? 0}</strong> iniciados
                      <div style={{ color: '#64748b', fontSize: '.76rem' }}>{modulo.alumnos_superados ?? 0} superados</div>
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        {confirmDeleteId === modulo.id ? (
                          <>
                            <button onClick={() => deleteModulo(modulo.id)} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: 'pointer' }}>Sí</button>
                            <button onClick={() => setConfirmDeleteId(null)} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#334155', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: 'pointer' }}>No</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openContent(modulo)} style={{ border: '1px solid #ddd6fe', background: '#f5f3ff', color: P, borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: 'pointer' }}>Contenido</button>
                            <button onClick={() => openEdit(modulo)} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#334155', borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: 'pointer' }}>Editar</button>
                            <button onClick={() => setConfirmDeleteId(modulo.id)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: 'pointer' }}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {contentModulo && (
        <Panel
          title={`Contenido de ${contentModulo.nombre}`}
          subtitle="Añade tests de práctica y un único simulacro final al módulo."
          style={{ marginTop: 16 }}
          action={(
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button onClick={createModuleTest} disabled={savingItem}>+ Crear test del módulo</Button>
              <Button variant="secondary" onClick={() => setContentModulo(null)}>Cerrar</Button>
            </div>
          )}
        >
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: '#0f172a', fontSize: '.88rem', fontWeight: 950 }}>Generacion automatica</div>
                <div style={{ color: '#64748b', fontSize: '.76rem', marginTop: 3 }}>Crea tests y simulacro final con preguntas de los temas del modulo.</div>
              </div>
              <Button onClick={generateAutoContent} disabled={savingItem}>
                {savingItem ? 'Generando...' : 'Generar contenido'}
              </Button>
            </div>
            <div className="albacer-modulo-auto-tools" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr)) minmax(130px, .7fr)', gap: 10, alignItems: 'end' }}>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#64748b', fontSize: '.7rem', fontWeight: 900 }}>Tests</span>
                <input type="number" min="1" max="20" value={autoForm.numero_tests} onChange={(event) => setAutoForm((current) => ({ ...current, numero_tests: event.target.value }))} style={FIELD} />
              </label>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#64748b', fontSize: '.7rem', fontWeight: 900 }}>Preguntas/test</span>
                <input type="number" min="1" max="200" value={autoForm.preguntas_por_test} onChange={(event) => setAutoForm((current) => ({ ...current, preguntas_por_test: event.target.value }))} style={FIELD} />
              </label>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#64748b', fontSize: '.7rem', fontWeight: 900 }}>Simulacro final</span>
                <input type="number" min="1" max="300" value={autoForm.preguntas_simulacro_final} onChange={(event) => setAutoForm((current) => ({ ...current, preguntas_simulacro_final: event.target.value }))} style={FIELD} />
              </label>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#64748b', fontSize: '.7rem', fontWeight: 900 }}>Dificultad</span>
                <select value={autoForm.nivel_dificultad} onChange={(event) => setAutoForm((current) => ({ ...current, nivel_dificultad: event.target.value }))} style={FIELD}>
                  <option value="">Mixta</option>
                  <option value="facil">Facil</option>
                  <option value="media">Media</option>
                  <option value="dificil">Dificil</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '.78rem', fontWeight: 900, minHeight: 40 }}>
                <input type="checkbox" checked={autoForm.permitir_repetidas} onChange={(event) => setAutoForm((current) => ({ ...current, permitir_repetidas: event.target.checked }))} style={{ accentColor: P }} />
                Permitir repetidas
              </label>
            </div>
          </div>

          <div className="albacer-modulo-content-tools" style={{ display: 'grid', gridTemplateColumns: '180px minmax(220px, 1fr) auto', gap: 10, marginBottom: 14 }}>
            <select value={itemTipo} onChange={(event) => { setItemTipo(event.target.value); setSelectedCandidateId(''); }} style={FIELD}>
              <option value="test">Test del módulo</option>
              <option value="simulacro_final">Simulacro final</option>
            </select>
            <select value={selectedCandidateId} onChange={(event) => setSelectedCandidateId(event.target.value)} style={FIELD}>
              <option value="">Selecciona contenido existente</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.nombre} · {candidate.estado ?? 'sin estado'} · {candidate.total_preguntas ?? 0} preguntas
                </option>
              ))}
            </select>
            <Button onClick={addItem} disabled={savingItem || !selectedCandidateId}>
              {savingItem ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </div>

          {itemError && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: '.84rem', fontWeight: 800, marginBottom: 14 }}>{itemError}</div>}

          {loadingItems ? (
            <div style={{ color: '#64748b', padding: 22, textAlign: 'center' }}>Cargando contenido...</div>
          ) : items.length === 0 ? (
            <EmptyState title="Sin contenido en el módulo" text="Añade tests de práctica y un simulacro final para completar este nivel." />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((item) => {
                const isFinal = item.tipo === 'simulacro_final';
                const preguntaTotal = isFinal ? item.simulacro_total_preguntas : item.test_total_preguntas;
                const estadoItem = isFinal ? item.simulacro_estado : item.test_estado;
                return (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 13, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: isFinal ? '#fee2e2' : '#ede9fe', color: isFinal ? '#991b1b' : '#5b21b6', borderRadius: 999, padding: '3px 9px', fontSize: '.72rem', fontWeight: 900 }}>
                          {isFinal ? 'Simulacro final' : 'Test'}
                        </span>
                        <strong style={{ color: '#0f172a' }}>{item.titulo}</strong>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: 5 }}>
                        Orden {item.orden} · {preguntaTotal ?? 0} preguntas · {estadoItem ?? 'sin estado'}{item.obligatorio ? ' · obligatorio' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => editItemContent(item)}
                        disabled={savingItem || (!item.plantilla_test_id && !item.simulacro_id)}
                        style={{ border: '1px solid #ddd6fe', background: '#f5f3ff', color: P, borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: savingItem ? 'not-allowed' : 'pointer' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={savingItem}
                        style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: savingItem ? 'not-allowed' : 'pointer' }}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      <ModuloModal
        open={modalOpen}
        form={form}
        temas={temas}
        oposiciones={oposiciones}
        saving={saving}
        error={modalError}
        isAdmin={isAdmin}
        onClose={() => setModalOpen(false)}
        onChange={updateForm}
        onSave={saveModulo}
      />

      {testEditor && contentModulo && (
        <ModuloTestModal
          open
          modulo={contentModulo}
          item={testEditor.item}
          testId={testEditor.testId}
          temasModulo={(contentModulo.temas ?? []).length
            ? contentModulo.temas
            : temas.filter((tema) => (contentModulo.tema_ids ?? []).map(Number).includes(Number(tema.id)))}
          token={token}
          isAdmin={isAdmin}
          api={api}
          onClose={() => setTestEditor(null)}
          onChanged={async () => {
            await loadItems(contentModulo);
            await loadModulos();
          }}
        />
      )}

      <style>{`
        @media (max-width: 980px) {
          .albacer-modulo-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .albacer-modulo-filters { grid-template-columns: 1fr !important; }
          .albacer-modulo-content-tools { grid-template-columns: 1fr !important; }
          .albacer-modulo-auto-tools { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .albacer-test-modal-tools { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 720px) {
          .albacer-modulo-metrics { grid-template-columns: 1fr !important; }
          .albacer-modulo-modal-grid { grid-template-columns: 1fr !important; }
          .albacer-modulo-auto-tools { grid-template-columns: 1fr !important; }
          .albacer-test-modal-tools { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageShell>
  );
}
