import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { profesorApi } from '../../services/profesorApi';
import TemaMultiSelect from '../../components/forms/TemaMultiSelect.jsx';
import { useAuth } from '../../state/auth.jsx';

const P = '#7c3aed';
const CARD = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
  padding: 24,
};
const INPUT = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: '.875rem',
  color: '#111827',
  outline: 'none',
};
const LABEL = {
  display: 'block',
  fontSize: '.78rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};
const TH = {
  padding: '10px 14px',
  fontWeight: 600,
  color: '#64748b',
  borderBottom: '2px solid #e2e8f0',
  textAlign: 'left',
  fontSize: '.73rem',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  background: '#f8fafc',
};
const TD = {
  padding: '11px 14px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '.85rem',
  color: '#1e293b',
  verticalAlign: 'middle',
};

const DIFICULTAD = {
  facil: { label: 'Facil', bg: '#dcfce7', color: '#16a34a' },
  media: { label: 'Media', bg: '#fef9c3', color: '#ca8a04' },
  dificil: { label: 'Dificil', bg: '#fee2e2', color: '#dc2626' },
};

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  oposicion_id: '',
  tema_ids: [],
  estado: 'borrador',
  nivel_dificultad: '',
  duracion_minutos: '',
  mezclar_preguntas: true,
  mostrar_resultados: true,
  mostrar_explicaciones: true,
  tipo_puntuacion: 'estandar',
  pts_acierto: 1,
  pts_fallo: -0.25,
  pts_blanco: 0,
};

function normalizeTemaIds(items) {
  return [...new Set(
    (Array.isArray(items) ? items : [])
      .map((value) => String(value))
      .filter(Boolean),
  )];
}

function formatTemaSummary(temas = []) {
  if (!temas.length) return '-';
  if (temas.length <= 2) return temas.map((tema) => tema.nombre).join(' | ');
  return `${temas.length} temas: ${temas.slice(0, 2).map((tema) => tema.nombre).join(' | ')}`;
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontSize: '.875rem', fontWeight: 600, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 1 }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: value ? P : '#d1d5db', position: 'relative' }}
      >
        <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
      </button>
    </div>
  );
}

function ModalAnadirPreguntas({ testId, oposicionId, allowedTemaIds = [], existingQuestionIds = [], onClose, onAdded, token, isProfesor }) {
  const [preguntas, setPreguntas] = useState([]);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [temaId, setTemaId] = useState('');
  const [dificultadFiltro, setDificultadFiltro] = useState('');
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoTemaId, setAutoTemaId] = useState('');
  const [autoCantidad, setAutoCantidad] = useState(10);
  const [autoDificultad, setAutoDificultad] = useState('');
  const [autoMessage, setAutoMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;

  const normalizedAllowedTemaIds = useMemo(() => normalizeTemaIds(allowedTemaIds), [allowedTemaIds]);
  const existingQuestionIdSet = useMemo(() => new Set(existingQuestionIds.map((id) => Number(id))), [existingQuestionIds]);
  const visibleTemas = useMemo(
    () => (normalizedAllowedTemaIds.length
      ? temas.filter((tema) => normalizedAllowedTemaIds.includes(String(tema.tema_id)))
      : temas),
    [normalizedAllowedTemaIds, temas],
  );
  const effectiveTemaIds = temaId ? [temaId] : normalizedAllowedTemaIds;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        q: q || undefined,
        oposicion_id: oposicionId || undefined,
        tema_id: temaId || undefined,
        tema_ids: !temaId && effectiveTemaIds.length > 1 ? effectiveTemaIds.join(',') : undefined,
        nivel_dificultad: dificultadFiltro || undefined,
        page,
        page_size: PAGE_SIZE,
      };
      const res = isProfesor
        ? await profesorApi.getMisPreguntas(token, query)
        : await adminApi.listPreguntas(token, query);
      setPreguntas(res?.items ?? []);
      setTotal(res?.pagination?.total ?? res?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [token, q, oposicionId, temaId, effectiveTemaIds, dificultadFiltro, page, isProfesor]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!oposicionId) return;
    if (isProfesor) {
      profesorApi.getWorkspaceTemario(token, { oposicion_id: oposicionId })
        .then((res) => setTemas(res.items ?? []))
        .catch(() => setTemas([]));
      return;
    }
    adminApi.listTemas(token, oposicionId)
      .then((res) => setTemas((res ?? []).map((tema) => ({ tema_id: tema.id, tema_nombre: tema.nombre }))))
      .catch(() => setTemas([]));
  }, [isProfesor, oposicionId, token]);

  useEffect(() => {
    if (normalizedAllowedTemaIds.length === 1) {
      setTemaId(normalizedAllowedTemaIds[0]);
      setAutoTemaId(normalizedAllowedTemaIds[0]);
      return;
    }
    if (temaId && normalizedAllowedTemaIds.length > 1 && !normalizedAllowedTemaIds.includes(String(temaId))) {
      setTemaId('');
    }
    if (autoTemaId && normalizedAllowedTemaIds.length > 1 && !normalizedAllowedTemaIds.includes(String(autoTemaId))) {
      setAutoTemaId('');
    }
  }, [normalizedAllowedTemaIds, temaId, autoTemaId]);

  const toggle = (id) => {
    if (existingQuestionIdSet.has(Number(id))) return;
    setSelected((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    setAdding(true);
    try {
      const api = isProfesor ? profesorApi.addPreguntasMiTest : adminApi.addPreguntasTest;
      await api(token, testId, selected);
      onAdded();
      onClose();
    } finally {
      setAdding(false);
    }
  };

  const handleAutoSelect = async () => {
    if (!oposicionId || visibleTemas.length === 0) return;
    setAutoLoading(true);
    setAutoMessage('');
    try {
      const temaIds = autoTemaId
        ? [Number(autoTemaId)]
        : (normalizedAllowedTemaIds.length
          ? normalizedAllowedTemaIds.map(Number)
          : visibleTemas.map((tema) => Number(tema.tema_id)));
      const payload = {
        oposicion_id: Number(oposicionId),
        tema_ids: temaIds,
        cantidad: Number(autoCantidad || 10),
        dificultad: autoDificultad || null,
        plantilla_test_id: testId ? Number(testId) : undefined,
        exclude_ids: [...new Set([...selected, ...existingQuestionIds])],
        permitir_completar_con_otros_temas: true,
      };
      const res = isProfesor
        ? await profesorApi.seleccionarPreguntas(token, payload)
        : await adminApi.seleccionarPreguntasAdmin(token, payload);
      const ids = (res.preguntas ?? []).map((pregunta) => pregunta.id);
      setSelected((current) => [...new Set([...current, ...ids])]);
      const avisos = res.avisos?.length ? ` ${res.avisos.map((aviso) => aviso.mensaje ?? aviso).join(' ')}` : '';
      setAutoMessage(`Seleccionadas ${ids.length} preguntas.${avisos}`);
    } catch (error) {
      setAutoMessage(error?.message ?? 'No se pudo generar la seleccion automatica.');
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 760, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Anadir preguntas al test</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}>x</button>
        </div>

        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(170px, .9fr) 150px auto', gap: 10, alignItems: 'center' }}>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar pregunta..." style={{ ...INPUT, marginBottom: 0 }} />
          <select value={temaId} onChange={(e) => { setTemaId(e.target.value); setPage(1); }} style={{ ...INPUT, marginBottom: 0 }}>
            <option value="">Todos los temas</option>
            {visibleTemas.map((tema) => <option key={tema.tema_id} value={tema.tema_id}>{tema.tema_nombre}</option>)}
          </select>
          <select value={dificultadFiltro} onChange={(e) => { setDificultadFiltro(e.target.value); setPage(1); }} style={{ ...INPUT, marginBottom: 0 }}>
            <option value="">Todas las dificultades</option>
            <option value="facil">Facil</option>
            <option value="media">Media</option>
            <option value="dificil">Dificil</option>
          </select>
          {selected.length > 0 && <span style={{ display: 'flex', alignItems: 'center', fontSize: '.8rem', color: P, fontWeight: 600, whiteSpace: 'nowrap' }}>{selected.length} seleccionadas</span>}
        </div>

        {(isProfesor || visibleTemas.length > 0) && (
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'minmax(170px, 1fr) 110px 140px auto', gap: 10, alignItems: 'center' }}>
            <select value={autoTemaId} onChange={(e) => setAutoTemaId(e.target.value)} style={{ ...INPUT, marginBottom: 0 }}>
              <option value="">Todos los temas</option>
              {visibleTemas.map((tema) => <option key={tema.tema_id} value={tema.tema_id}>{tema.tema_nombre}</option>)}
            </select>
            <input type="number" min="1" value={autoCantidad} onChange={(e) => setAutoCantidad(e.target.value)} style={{ ...INPUT, marginBottom: 0 }} />
            <select value={autoDificultad} onChange={(e) => setAutoDificultad(e.target.value)} style={{ ...INPUT, marginBottom: 0 }}>
              <option value="">Dificultad mixta</option>
              <option value="facil">Facil</option>
              <option value="media">Media</option>
              <option value="dificil">Dificil</option>
            </select>
            <button type="button" onClick={handleAutoSelect} disabled={autoLoading || !oposicionId || visibleTemas.length === 0} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: P, color: '#fff', cursor: autoLoading ? 'default' : 'pointer', fontWeight: 700, fontSize: '.82rem', whiteSpace: 'nowrap' }}>
              {autoLoading ? 'Proponiendo...' : 'Proponer'}
            </button>
            {autoMessage && <div style={{ gridColumn: '1 / -1', color: autoMessage.startsWith('Seleccionadas') ? '#166534' : '#dc2626', fontSize: '.78rem', fontWeight: 700 }}>{autoMessage}</div>}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando...</p>
          ) : preguntas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Sin resultados.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 36 }} />
                  <th style={TH}>Pregunta</th>
                  <th style={TH}>Tema</th>
                  <th style={TH}>Dificultad</th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map((pregunta) => {
                  const dif = DIFICULTAD[pregunta.nivel_dificultad];
                  const checked = selected.includes(pregunta.id);
                  const alreadyLinked = existingQuestionIdSet.has(Number(pregunta.id));
                  return (
                    <tr key={pregunta.id} onClick={() => toggle(pregunta.id)} style={{ cursor: alreadyLinked ? 'default' : 'pointer', background: checked ? 'rgba(124,58,237,.04)' : (alreadyLinked ? '#f8fafc' : '') }}>
                      <td style={TD}>
                        <input type="checkbox" checked={checked || alreadyLinked} disabled={alreadyLinked} onChange={() => toggle(pregunta.id)} onClick={(e) => e.stopPropagation()} style={{ accentColor: P, cursor: alreadyLinked ? 'not-allowed' : 'pointer' }} />
                      </td>
                      <td style={{ ...TD, maxWidth: 420 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pregunta.enunciado}</span>
                        {alreadyLinked && <div style={{ marginTop: 6, fontSize: '.72rem', fontWeight: 700, color: '#64748b' }}>Ya anadida al test</div>}
                      </td>
                      <td style={TD}>{pregunta.tema_nombre ?? '-'}</td>
                      <td style={TD}>
                        {dif ? <span style={{ background: dif.bg, color: dif.color, borderRadius: 10, padding: '2px 8px', fontSize: '.75rem', fontWeight: 600 }}>{dif.label}</span> : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', fontSize: '.8rem' }}>Ant.</button>
            <span style={{ fontSize: '.8rem', color: '#6b7280' }}>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage((current) => current + 1)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page * PAGE_SIZE >= total ? 'default' : 'pointer', color: page * PAGE_SIZE >= total ? '#d1d5db' : '#374151', fontSize: '.8rem' }}>Sig.</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', color: '#374151' }}>Cancelar</button>
            <button onClick={handleAdd} disabled={selected.length === 0 || adding} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: selected.length > 0 ? P : '#c4b5fd', color: '#fff', cursor: selected.length > 0 ? 'pointer' : 'default', fontWeight: 700, fontSize: '.85rem' }}>
              {adding ? 'Anadiendo...' : `Anadir ${selected.length || ''} pregunta${selected.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEditTestPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isProfesor = user?.role === 'profesor';
  const basePath = isProfesor ? '/profesor/tests' : '/admin/tests';
  const testApi = useMemo(() => (isProfesor
    ? {
      get: profesorApi.getMiTest,
      create: profesorApi.createMiTest,
      update: profesorApi.updateMiTest,
      removePregunta: profesorApi.removePreguntaMiTest,
      setDemo: profesorApi.setDemoMiTest,
    }
    : {
      get: adminApi.getTest,
      create: adminApi.createTest,
      update: adminApi.updateTest,
      removePregunta: adminApi.removePreguntaTest,
      setDemo: adminApi.setDemoTest,
    }), [isProfesor]);

  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [esDemoTest, setEsDemoTest] = useState(false);
  const [savingDemo, setSavingDemo] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preguntas, setPreguntas] = useState([]);

  useEffect(() => {
    if (!isNew) return;
    const params = new URLSearchParams(location.search);
    const oposicionId = params.get('oposicion_id');
    if (oposicionId) {
      setForm((current) => ({ ...current, oposicion_id: oposicionId }));
    }
  }, [isNew, location.search]);

  useEffect(() => {
    const loadOposiciones = async () => {
      if (isProfesor) return profesorApi.getMisOposiciones(token);
      try {
        const ops = await adminApi.listOposicionesConStats(token, { page_size: 100 });
        return ops?.items ?? ops ?? [];
      } catch {
        return catalogApi.getOposiciones(token);
      }
    };

    loadOposiciones()
      .then((ops) => {
        const items = ops?.items ?? ops ?? [];
        setOposiciones(items);
        if (isNew && isProfesor) {
          setForm((current) => {
            const ids = items.map((op) => String(op.id));
            if (items.length === 1) {
              return { ...current, oposicion_id: String(items[0].id), tema_ids: [] };
            }
            if (current.oposicion_id && !ids.includes(String(current.oposicion_id))) {
              return { ...current, oposicion_id: '', tema_ids: [] };
            }
            return current;
          });
        }
      })
      .catch(() => setError('No se pudieron cargar las oposiciones.'));
  }, [token, isProfesor, isNew]);

  useEffect(() => {
    if (!form.oposicion_id) {
      setTemas([]);
      return;
    }
    adminApi.listTemas(token, form.oposicion_id)
      .then((res) => setTemas(res ?? []))
      .catch(() => setTemas([]));
  }, [form.oposicion_id, token]);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    testApi.get(token, id)
      .then((test) => {
        const loadedTemaIds = normalizeTemaIds((test.temas ?? []).map((tema) => tema.id));
        setForm({
          nombre: test.nombre ?? '',
          descripcion: test.descripcion ?? '',
          oposicion_id: test.oposicion_id ? String(test.oposicion_id) : '',
          tema_ids: loadedTemaIds.length ? loadedTemaIds : normalizeTemaIds(test.tema_id ? [test.tema_id] : []),
          estado: test.estado ?? 'borrador',
          nivel_dificultad: test.nivel_dificultad ?? '',
          duracion_minutos: test.duracion_minutos ?? '',
          mezclar_preguntas: test.mezclar_preguntas ?? true,
          mostrar_resultados: test.mostrar_resultados ?? true,
          mostrar_explicaciones: test.mostrar_explicaciones ?? true,
          tipo_puntuacion: test.tipo_puntuacion ?? 'estandar',
          pts_acierto: test.pts_acierto ?? 1,
          pts_fallo: test.pts_fallo ?? -0.25,
          pts_blanco: test.pts_blanco ?? 0,
        });
        setEsDemoTest(test.es_demo ?? false);
        setPreguntas(test.preguntas ?? []);
      })
      .catch(() => setError('No se pudo cargar el test.'))
      .finally(() => setLoading(false));
  }, [id, isNew, token, testApi]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleTema = (temaId) => {
    setForm((current) => {
      const next = current.tema_ids.includes(temaId)
        ? current.tema_ids.filter((idValue) => idValue !== temaId)
        : [...current.tema_ids, temaId];
      return { ...current, tema_ids: next };
    });
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        oposicion_id: form.oposicion_id ? Number(form.oposicion_id) : null,
        tema_ids: form.tema_ids.map(Number),
        nivel_dificultad: form.nivel_dificultad || null,
        duracion_minutos: form.duracion_minutos ? Number(form.duracion_minutos) : null,
        pts_acierto: Number(form.pts_acierto),
        pts_fallo: Number(form.pts_fallo),
        pts_blanco: Number(form.pts_blanco),
      };
      if (isNew) {
        const created = await testApi.create(token, payload);
        navigate(`${basePath}/${created.id}/editar`, { replace: true });
      } else {
        await testApi.update(token, id, payload);
        navigate(basePath);
      }
    } catch (e) {
      setError(e?.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePregunta = async (preguntaId) => {
    try {
      await testApi.removePregunta(token, id, preguntaId);
      setPreguntas((current) => current.filter((pregunta) => pregunta.id !== preguntaId));
    } catch {
      setError('Error al eliminar la pregunta.');
    }
  };

  const handleToggleDemo = async (value) => {
    setSavingDemo(true);
    try {
      await testApi.setDemo(token, id, value);
      setEsDemoTest(value);
    } catch (e) {
      setError(e?.message ?? 'Error al cambiar el test demo.');
    } finally {
      setSavingDemo(false);
    }
  };

  const handlePreguntasAdded = () => {
    testApi.get(token, id).then((test) => setPreguntas(test.preguntas ?? [])).catch(() => {});
  };

  const selectedOposicion = oposiciones.find((item) => String(item.id) === String(form.oposicion_id));
  const selectedTemas = temas.filter((tema) => form.tema_ids.includes(String(tema.id)));
  const selectedDificultad = DIFICULTAD[form.nivel_dificultad];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: P, animation: 'spin .8s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0 0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.8rem', color: '#9ca3af', marginBottom: 4 }}>
            <button onClick={() => navigate(basePath)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, fontWeight: 600, padding: 0, fontSize: '.8rem' }}>Tests</button>
            <span>/</span>
            <span>{isNew ? 'Nuevo test' : (form.nombre || 'Editar test')}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{isNew ? 'Crear test' : 'Editar test'}</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.9rem' }}>{isNew ? 'Configura la informacion y las reglas del test' : 'Modifica la informacion y configuracion del test'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate(basePath)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', color: '#374151' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#c4b5fd' : P, color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '.85rem' }}>
            {saving ? 'Guardando...' : (isNew ? 'Crear test' : 'Guardar cambios')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontSize: '.875rem', marginBottom: 20, border: '1px solid #fecaca' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>x</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.35fr) minmax(320px, 1fr) minmax(240px, .65fr)', gap: 20, alignItems: 'stretch', marginBottom: 20 }}>
        <div style={CARD}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Informacion general</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Nombre del test *</label>
              <input value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} placeholder="Ej. Test de Derecho Constitucional - Tema 3" style={INPUT} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Oposicion</label>
              <select value={form.oposicion_id} onChange={(e) => setForm((current) => ({ ...current, oposicion_id: e.target.value, tema_ids: [] }))} style={{ ...INPUT, color: form.oposicion_id ? '#111827' : '#9ca3af' }}>
                <option value="">Sin oposicion</option>
                {oposiciones.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Temas del test</label>
              <TemaMultiSelect
                options={temas.map((tema) => ({ value: String(tema.id), label: tema.nombre }))}
                selectedValues={form.tema_ids}
                disabled={!form.oposicion_id}
                onToggle={toggleTema}
                placeholder="Selecciona uno o varios temas"
                emptyText="No hay temas para esta oposicion"
              />
              <div style={{ marginTop: 6, fontSize: '.74rem', color: '#64748b', lineHeight: 1.45 }}>
                Selecciona uno o varios temas. Las preguntas disponibles para este test se filtraran con esta seleccion.
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Descripcion</label>
              <textarea value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} placeholder="Descripcion opcional del test..." rows={4} style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>
            <div>
              <label style={LABEL}>Dificultad</label>
              <select value={form.nivel_dificultad} onChange={(e) => setField('nivel_dificultad', e.target.value)} style={{ ...INPUT, color: form.nivel_dificultad ? '#111827' : '#9ca3af' }}>
                <option value="">Sin especificar</option>
                {Object.entries(DIFICULTAD).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Duracion estimada</label>
              <input type="number" min="1" value={form.duracion_minutos} onChange={(e) => setField('duracion_minutos', e.target.value)} placeholder="20 minutos" style={INPUT} />
            </div>
          </div>
        </div>

        <div style={CARD}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Configuracion del test</h2>
          <Toggle value={form.estado === 'publicado'} onChange={(value) => setField('estado', value ? 'publicado' : 'borrador')} label="Test publicado" desc="El test estara disponible para los opositores" />
          <Toggle value={form.mostrar_resultados} onChange={(value) => setField('mostrar_resultados', value)} label="Mostrar resultados al finalizar" desc="Los opositores veran sus aciertos y errores" />
          <Toggle value={form.mezclar_preguntas} onChange={(value) => setField('mezclar_preguntas', value)} label="Mezclar preguntas" desc="El orden de las preguntas sera aleatorio" />
          <Toggle value={form.mostrar_explicaciones} onChange={(value) => setField('mostrar_explicaciones', value)} label="Mostrar explicacion" desc="Se mostrara la explicacion de cada pregunta" />

          {!isNew && form.oposicion_id && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', opacity: savingDemo ? .6 : 1 }}>
                <div>
                  <div style={{ fontSize: '.875rem', fontWeight: 700, color: esDemoTest ? '#7c3aed' : '#111827' }}>
                    Test DEMO
                    {esDemoTest && <span style={{ marginLeft: 8, fontSize: '.72rem', background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>ACTIVO</span>}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 1 }}>Los alumnos free usaran este test en la demo de la oposicion</div>
                  {form.estado !== 'publicado' && <div style={{ fontSize: '.72rem', color: '#dc2626', marginTop: 2 }}>El test debe estar publicado para activar el demo</div>}
                </div>
                <button
                  type="button"
                  disabled={savingDemo || form.estado !== 'publicado'}
                  onClick={() => handleToggleDemo(!esDemoTest)}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: (savingDemo || form.estado !== 'publicado') ? 'not-allowed' : 'pointer', background: esDemoTest ? P : '#d1d5db', position: 'relative', opacity: form.estado !== 'publicado' ? .4 : 1 }}
                >
                  <span style={{ position: 'absolute', top: 2, left: esDemoTest ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ ...LABEL, marginBottom: 10 }}>Puntuacion</div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10, border: `1px solid ${form.tipo_puntuacion === 'estandar' ? '#ddd6fe' : '#e2e8f0'}`, background: form.tipo_puntuacion === 'estandar' ? '#f5f3ff' : '#fff', cursor: 'pointer', marginBottom: 8 }}>
              <input type="radio" checked={form.tipo_puntuacion === 'estandar'} onChange={() => setField('tipo_puntuacion', 'estandar')} style={{ accentColor: P, marginTop: 2 }} />
              <span>
                <strong style={{ display: 'block', color: P, fontSize: '.82rem' }}>Sistema estandar</strong>
                <span style={{ color: '#64748b', fontSize: '.75rem' }}>+1 correcto / -0,25 incorrecto / 0 en blanco</span>
              </span>
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10, border: `1px solid ${form.tipo_puntuacion === 'personalizada' ? '#ddd6fe' : '#e2e8f0'}`, background: form.tipo_puntuacion === 'personalizada' ? '#f5f3ff' : '#fff', cursor: 'pointer' }}>
              <input type="radio" checked={form.tipo_puntuacion === 'personalizada'} onChange={() => setField('tipo_puntuacion', 'personalizada')} style={{ accentColor: P, marginTop: 2 }} />
              <span>
                <strong style={{ display: 'block', color: '#111827', fontSize: '.82rem' }}>Personalizada</strong>
                <span style={{ color: '#64748b', fontSize: '.75rem' }}>Configurar puntuacion manual</span>
              </span>
            </label>

            {form.tipo_puntuacion === 'personalizada' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
                <div>
                  <label style={LABEL}>Acierto</label>
                  <input type="number" step="0.01" value={form.pts_acierto} onChange={(e) => setField('pts_acierto', e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Fallo</label>
                  <input type="number" step="0.01" value={form.pts_fallo} onChange={(e) => setField('pts_fallo', e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Blanco</label>
                  <input type="number" step="0.01" value={form.pts_blanco} onChange={(e) => setField('pts_blanco', e.target.value)} style={INPUT} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: 20 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Resumen del test</h2>
          {[
            ['Preguntas', preguntas.length],
            ['Duracion', form.duracion_minutos ? `${form.duracion_minutos} min` : '-'],
            ['Dificultad', selectedDificultad?.label ?? '-'],
            ['Temas', formatTemaSummary(selectedTemas)],
            ['Oposicion', selectedOposicion?.nombre ?? '-'],
            ['Estado', form.estado === 'publicado' ? 'Publicado' : 'Borrador'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '.72rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Preguntas del test ({preguntas.length})</h2>
          <button
            onClick={() => setShowModal(true)}
            disabled={isNew}
            title={isNew ? 'Guarda el test primero para anadir preguntas' : 'Anadir preguntas'}
            style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: isNew ? '#c4b5fd' : P, color: '#fff', cursor: isNew ? 'default' : 'pointer', fontWeight: 700, fontSize: '.85rem' }}
          >
            + Anadir preguntas
          </button>
        </div>

        {preguntas.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
            {isNew ? 'Guarda el test para poder anadir preguntas.' : 'Todavia no hay preguntas anadidas a este test.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 56 }}>N</th>
                  <th style={TH}>Enunciado</th>
                  <th style={TH}>Tema</th>
                  <th style={TH}>Dificultad</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map((pregunta, index) => {
                  const dif = DIFICULTAD[pregunta.nivel_dificultad];
                  return (
                    <tr key={pregunta.id}>
                      <td style={TD}>{index + 1}</td>
                      <td style={{ ...TD, maxWidth: 520 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pregunta.enunciado}</span>
                      </td>
                      <td style={TD}>{pregunta.tema_nombre ?? pregunta.bloque_nombre ?? '-'}</td>
                      <td style={TD}>
                        {dif ? <span style={{ background: dif.bg, color: dif.color, borderRadius: 10, padding: '2px 8px', fontSize: '.75rem', fontWeight: 700 }}>{dif.label}</span> : '-'}
                      </td>
                      <td style={TD}>
                        <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 10, padding: '2px 8px', fontSize: '.75rem', fontWeight: 700 }}>{pregunta.estado ?? 'Activa'}</span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <button onClick={() => handleRemovePregunta(pregunta.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '.78rem' }}>Quitar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalAnadirPreguntas
          testId={id}
          oposicionId={form.oposicion_id || null}
          allowedTemaIds={form.tema_ids}
          existingQuestionIds={preguntas.map((pregunta) => pregunta.id)}
          token={token}
          isProfesor={isProfesor}
          onClose={() => setShowModal(false)}
          onAdded={handlePreguntasAdded}
        />
      )}
    </div>
  );
}
