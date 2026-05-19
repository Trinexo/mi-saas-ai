import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';

// ─── Estilos base ─────────────────────────────────────────────────────────────
const P   = '#7c3aed';
const CARD = {
  background: '#fff', borderRadius: 16,
  border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
  padding: '24px',
};
const INPUT = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem',
  color: '#111827', outline: 'none',
};
const LABEL = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 };
const TH = {
  padding: '10px 14px', fontWeight: 600, color: '#64748b',
  borderBottom: '2px solid #e2e8f0', textAlign: 'left',
  fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc',
};
const TD = {
  padding: '11px 14px', borderBottom: '1px solid #f1f5f9',
  fontSize: '0.85rem', color: '#1e293b', verticalAlign: 'middle',
};

const DIFICULTAD = {
  facil:   { label: 'Fácil',    bg: '#dcfce7', color: '#16a34a' },
  media:   { label: 'Media',    bg: '#fef9c3', color: '#ca8a04' },
  dificil: { label: 'Difícil',  bg: '#fee2e2', color: '#dc2626' },
};

function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: value ? P : '#d1d5db', position: 'relative', flexShrink: 0,
          transition: 'background .2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </button>
    </div>
  );
}

// ─── Modal Añadir Preguntas ───────────────────────────────────────────────────
function ModalAnadirPreguntas({ testId, oposicionId, onClose, onAdded, token, isProfesor }) {
  const [preguntas, setPreguntas]   = useState([]);
  const [temas,     setTemas]       = useState([]);
  const [loading,   setLoading]     = useState(false);
  const [q,         setQ]           = useState('');
  const [selected,  setSelected]    = useState([]);
  const [adding,    setAdding]      = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoTemaId, setAutoTemaId] = useState('');
  const [autoCantidad, setAutoCantidad] = useState(10);
  const [autoDificultad, setAutoDificultad] = useState('');
  const [autoMessage, setAutoMessage] = useState('');
  const [page,      setPage]        = useState(1);
  const [total,     setTotal]       = useState(0);
  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = isProfesor
        ? await profesorApi.getMisPreguntas(token, {
          q: q || undefined,
          oposicion_id: oposicionId || undefined,
          page, page_size: PAGE_SIZE,
        })
        : await adminApi.listPreguntas(token, {
        q: q || undefined,
        oposicion_id: oposicionId || undefined,
        page, page_size: PAGE_SIZE,
      });
      setPreguntas(res?.items ?? []);
      setTotal(res?.pagination?.total ?? res?.total ?? 0);
    } finally { setLoading(false); }
  }, [token, q, oposicionId, page, isProfesor]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!oposicionId) return;
    if (isProfesor) {
      profesorApi.getWorkspaceTemario(token, { oposicion_id: oposicionId })
        .then((res) => setTemas(res.items ?? []))
        .catch(() => setTemas([]));
    } else {
      adminApi.listTemas(token, oposicionId)
        .then((res) => setTemas((res ?? []).map((t) => ({ tema_id: t.id, tema_nombre: t.nombre }))))
        .catch(() => setTemas([]));
    }
  }, [isProfesor, oposicionId, token]);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleAdd = async () => {
    if (!selected.length) return;
    setAdding(true);
    try {
      const api = isProfesor ? profesorApi.addPreguntasMiTest : adminApi.addPreguntasTest;
      await api(token, testId, selected);
      onAdded();
      onClose();
    } finally { setAdding(false); }
  };

  const handleAutoSelect = async () => {
    if (!oposicionId || temas.length === 0) return;
    setAutoLoading(true);
    setAutoMessage('');
    try {
      const temaIds = autoTemaId ? [Number(autoTemaId)] : temas.map((tema) => Number(tema.tema_id));
      const payload = {
        oposicion_id: Number(oposicionId),
        tema_ids: temaIds,
        cantidad: Number(autoCantidad || 10),
        dificultad: autoDificultad || null,
        plantilla_test_id: testId ? Number(testId) : undefined,
        exclude_ids: selected,
        permitir_completar_con_otros_temas: true,
      };
      const res = isProfesor
        ? await profesorApi.seleccionarPreguntas(token, payload)
        : await adminApi.seleccionarPreguntasAdmin(token, payload);
      const ids = (res.preguntas ?? []).map((pregunta) => pregunta.id);
      setSelected((current) => [...new Set([...current, ...ids])]);
      const avisos = res.avisos?.length ? ` ${res.avisos.map((aviso) => aviso.mensaje ?? aviso).join(' ')}` : '';
      setAutoMessage(`Seleccionadas ${ids.length} preguntas.${avisos}`);
    } catch (err) {
      setAutoMessage(err?.message ?? 'No se pudo generar la seleccion automatica.');
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 760, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.15)' }}>
        {/* Header modal */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Añadir preguntas al test</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        {/* Filtros */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <input
            value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar pregunta…"
            style={{ ...INPUT, marginBottom: 0, flex: 1 }}
          />
          {selected.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: P, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {selected.length} seleccionadas
            </span>
          )}
        </div>
        {(isProfesor || temas.length > 0) && (
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'minmax(170px, 1fr) 110px 140px auto', gap: 10, alignItems: 'center' }}>
            <select value={autoTemaId} onChange={(e) => setAutoTemaId(e.target.value)} style={{ ...INPUT, marginBottom: 0 }}>
              <option value="">Todos los temas</option>
              {temas.map((tema) => <option key={tema.tema_id} value={tema.tema_id}>{tema.tema_nombre}</option>)}
            </select>
            <input type="number" min="1" value={autoCantidad} onChange={(e) => setAutoCantidad(e.target.value)} style={{ ...INPUT, marginBottom: 0 }} />
            <select value={autoDificultad} onChange={(e) => setAutoDificultad(e.target.value)} style={{ ...INPUT, marginBottom: 0 }}>
              <option value="">Dificultad mixta</option>
              <option value="facil">Fácil</option>
              <option value="media">Media</option>
              <option value="dificil">Difícil</option>
            </select>
            <button type="button" onClick={handleAutoSelect} disabled={autoLoading || !oposicionId || temas.length === 0}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: P, color: '#fff', cursor: autoLoading ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              {autoLoading ? 'Proponiendo...' : 'Proponer'}
            </button>
            {autoMessage && <div style={{ gridColumn: '1 / -1', color: autoMessage.startsWith('Seleccionadas') ? '#166534' : '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>{autoMessage}</div>}
          </div>
        )}
        {/* Tabla */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando…</p>
          ) : preguntas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Sin resultados.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 36 }}></th>
                  <th style={TH}>Pregunta</th>
                  <th style={TH}>Dificultad</th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map(p => {
                  const dif = DIFICULTAD[p.nivel_dificultad];
                  const checked = selected.includes(p.id);
                  return (
                    <tr key={p.id} onClick={() => toggle(p.id)}
                      style={{ cursor: 'pointer', background: checked ? 'rgba(124,58,237,.04)' : '' }}>
                      <td style={TD}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(p.id)}
                          style={{ accentColor: P, cursor: 'pointer' }} onClick={e => e.stopPropagation()} />
                      </td>
                      <td style={{ ...TD, maxWidth: 500 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.enunciado}
                        </span>
                      </td>
                      <td style={TD}>
                        {dif ? (
                          <span style={{ background: dif.bg, color: dif.color, borderRadius: 10, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {dif.label}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* Paginación + acciones */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', fontSize: '0.8rem' }}>
              ← Ant.
            </button>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page * PAGE_SIZE >= total ? 'default' : 'pointer', color: page * PAGE_SIZE >= total ? '#d1d5db' : '#374151', fontSize: '0.8rem' }}>
              Sig. →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
              Cancelar
            </button>
            <button onClick={handleAdd} disabled={selected.length === 0 || adding}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: selected.length > 0 ? P : '#c4b5fd', color: '#fff', cursor: selected.length > 0 ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.85rem' }}>
              {adding ? 'Añadiendo…' : `Añadir ${selected.length || ''} pregunta${selected.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminEditTestPage() {
  const { id }    = useParams();          // undefined = modo "nuevo"
  const isNew     = !id;
  const navigate  = useNavigate();
  const location  = useLocation();
  const { token, user } = useAuth();
  const isProfesor = user?.role === 'profesor';
  const basePath = isProfesor ? '/profesor/tests' : '/admin/tests';
  const testApi = useMemo(() => (isProfesor
    ? {
      get: profesorApi.getMiTest,
      create: profesorApi.createMiTest,
      update: profesorApi.updateMiTest,
      addPreguntas: profesorApi.addPreguntasMiTest,
      removePregunta: profesorApi.removePreguntaMiTest,
    }
    : {
      get: adminApi.getTest,
      create: adminApi.createTest,
      update: adminApi.updateTest,
      addPreguntas: adminApi.addPreguntasTest,
      removePregunta: adminApi.removePreguntaTest,
    }), [isProfesor]);

  const [oposiciones, setOposiciones] = useState([]);
  const [temas,       setTemas]       = useState([]);
  const [loading,     setLoading]     = useState(!isNew);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [showModal,   setShowModal]   = useState(false);

  const EMPTY = {
    nombre: '', descripcion: '', oposicion_id: '', tema_id: '', estado: 'borrador',
    nivel_dificultad: '', duracion_minutos: '',
    mezclar_preguntas: true, mostrar_resultados: true, mostrar_explicaciones: true,
    tipo_puntuacion: 'estandar', pts_acierto: 1, pts_fallo: -0.25, pts_blanco: 0,
  };

  const [form,      setForm]      = useState(EMPTY);
  const [preguntas, setPreguntas] = useState([]);

  useEffect(() => {
    if (!isNew) return;
    const params = new URLSearchParams(location.search);
    const oposicionId = params.get('oposicion_id');
    if (oposicionId) {
      setForm((current) => ({ ...current, oposicion_id: oposicionId }));
    }
  }, [isNew, location.search]);

  // Carga datos iniciales
  useEffect(() => {
    const loadOposiciones = async () => {
      if (isProfesor) {
        return profesorApi.getMisOposiciones(token);
      }
      try {
        const ops = await adminApi.listOposicionesConStats(token, { page_size: 100 });
        return ops?.items ?? ops ?? [];
      } catch {
        return catalogApi.getOposiciones();
      }
    };

    loadOposiciones().then((ops) => {
      const items = ops?.items ?? ops ?? [];
      setOposiciones(items);
      if (isNew && isProfesor) {
        setForm((current) => {
          const ids = items.map((op) => String(op.id));
          if (items.length === 1) {
            return { ...current, oposicion_id: String(items[0].id), tema_id: '' };
          }
          if (current.oposicion_id && !ids.includes(String(current.oposicion_id))) {
            return { ...current, oposicion_id: '', tema_id: '' };
          }
          return current;
        });
      }
    }).catch(() => setError('No se pudieron cargar las oposiciones.'));
  }, [token, isProfesor, isNew]);

  // Carga temas cuando cambia oposición
  useEffect(() => {
    if (!form.oposicion_id) { setTemas([]); return; }
    // listOposicionesConStats ya devuelve la jerarquía; usamos catalog endpoint
    adminApi.listTemas(token, form.oposicion_id)
      .then(r => setTemas(r ?? []))
      .catch(() => setTemas([]));
  }, [form.oposicion_id, token]);

  // Carga test existente si edición
  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    testApi.get(token, id)
      .then(t => {
        setForm({
          nombre:               t.nombre ?? '',
          descripcion:          t.descripcion ?? '',
          oposicion_id:         t.oposicion_id ?? '',
          tema_id:              t.tema_id ?? '',
          estado:               t.estado ?? 'borrador',
          nivel_dificultad:     t.nivel_dificultad ?? '',
          duracion_minutos:     t.duracion_minutos ?? '',
          mezclar_preguntas:    t.mezclar_preguntas ?? true,
          mostrar_resultados:   t.mostrar_resultados ?? true,
          mostrar_explicaciones:t.mostrar_explicaciones ?? true,
          tipo_puntuacion:      t.tipo_puntuacion ?? 'estandar',
          pts_acierto:          t.pts_acierto ?? 1,
          pts_fallo:            t.pts_fallo ?? -0.25,
          pts_blanco:           t.pts_blanco ?? 0,
        });
        setPreguntas(t.preguntas ?? []);
      })
      .catch(() => setError('No se pudo cargar el test.'))
      .finally(() => setLoading(false));
  }, [id, isNew, token, testApi]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        oposicion_id:      form.oposicion_id  ? Number(form.oposicion_id)  : null,
        tema_id:           form.tema_id        ? Number(form.tema_id)        : null,
        nivel_dificultad:  form.nivel_dificultad || null,
        duracion_minutos:  form.duracion_minutos ? Number(form.duracion_minutos) : null,
        pts_acierto:  Number(form.pts_acierto),
        pts_fallo:    Number(form.pts_fallo),
        pts_blanco:   Number(form.pts_blanco),
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
      setPreguntas(prev => prev.filter(p => p.id !== preguntaId));
    } catch { setError('Error al eliminar la pregunta.'); }
  };

  const handlePreguntasAdded = () => {
    testApi.get(token, id).then(t => setPreguntas(t.preguntas ?? [])).catch(() => {});
  };

  const selectedOposicion = oposiciones.find(o => String(o.id) === String(form.oposicion_id));
  const selectedTema = temas.find(t => String(t.id) === String(form.tema_id));
  const selectedDificultad = DIFICULTAD[form.nivel_dificultad];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: P, animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0 0 40px' }}>

      {/* ─── Cabecera ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          {/* breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4 }}>
            <button onClick={() => navigate(basePath)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, fontWeight: 600, padding: 0, fontSize: '0.8rem' }}>
              Tests
            </button>
            <span>/</span>
            <span>{isNew ? 'Nuevo test' : (form.nombre || 'Editar test')}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {isNew ? 'Crear test' : 'Editar test'}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {isNew ? 'Configura la información y las reglas del test' : 'Modifica la información y configuración del test'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate(basePath)}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#c4b5fd' : P, color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            {saving ? 'Guardando…' : (isNew ? 'Crear test' : 'Guardar cambios')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontSize: '0.875rem', marginBottom: 20, border: '1px solid #fecaca' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>×</button>
        </div>
      )}

      {/* ─── Layout principal ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 1.35fr) minmax(320px, 1fr) minmax(240px, .65fr)',
        gap: 20,
        alignItems: 'stretch',
        marginBottom: 20,
      }}>
        <div style={CARD}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Información general</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Nombre del test *</label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Ej. Test de Derecho Constitucional - Tema 3"
                style={INPUT}
              />
            </div>
            <div>
              <label style={LABEL}>Oposición</label>
              <select
                value={form.oposicion_id}
                onChange={e => { set('oposicion_id', e.target.value); set('tema_id', ''); }}
                style={{ ...INPUT, color: form.oposicion_id ? '#111827' : '#9ca3af' }}
              >
                <option value="">Sin oposición</option>
                {oposiciones.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Tema</label>
              <select
                value={form.tema_id}
                onChange={e => set('tema_id', e.target.value)}
                disabled={!form.oposicion_id}
                style={{ ...INPUT, color: form.tema_id ? '#111827' : '#9ca3af', opacity: !form.oposicion_id ? .5 : 1 }}
              >
                <option value="">Sin tema</option>
                {temas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Descripción opcional del test..."
                rows={4}
                style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
            </div>
            <div>
              <label style={LABEL}>Dificultad</label>
              <select
                value={form.nivel_dificultad}
                onChange={e => set('nivel_dificultad', e.target.value)}
                style={{ ...INPUT, color: form.nivel_dificultad ? '#111827' : '#9ca3af' }}
              >
                <option value="">Sin especificar</option>
                {Object.entries(DIFICULTAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Duración estimada</label>
              <input
                type="number"
                min="1"
                value={form.duracion_minutos}
                onChange={e => set('duracion_minutos', e.target.value)}
                placeholder="20 minutos"
                style={INPUT}
              />
            </div>
          </div>
        </div>

        <div style={CARD}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Configuración del test</h2>
          <Toggle
            value={form.estado === 'publicado'}
            onChange={value => set('estado', value ? 'publicado' : 'borrador')}
            label="Test publicado"
            desc="El test estará disponible para los opositores"
          />
          <Toggle
            value={form.mostrar_resultados}
            onChange={value => set('mostrar_resultados', value)}
            label="Mostrar resultados al finalizar"
            desc="Los opositores verán sus aciertos y errores"
          />
          <Toggle
            value={form.mezclar_preguntas}
            onChange={value => set('mezclar_preguntas', value)}
            label="Mezclar preguntas"
            desc="El orden de las preguntas será aleatorio"
          />
          <Toggle
            value={form.mostrar_explicaciones}
            onChange={value => set('mostrar_explicaciones', value)}
            label="Mostrar explicación"
            desc="Se mostrará la explicación de cada pregunta"
          />

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ ...LABEL, marginBottom: 10 }}>Puntuación</div>
            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10,
              border: `1px solid ${form.tipo_puntuacion === 'estandar' ? '#ddd6fe' : '#e2e8f0'}`,
              background: form.tipo_puntuacion === 'estandar' ? '#f5f3ff' : '#fff',
              cursor: 'pointer', marginBottom: 8,
            }}>
              <input type="radio" checked={form.tipo_puntuacion === 'estandar'} onChange={() => set('tipo_puntuacion', 'estandar')} style={{ accentColor: P, marginTop: 2 }} />
              <span>
                <strong style={{ display: 'block', color: P, fontSize: '0.82rem' }}>Sistema estándar</strong>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>+1 correcto / -0,25 incorrecto / 0 en blanco</span>
              </span>
            </label>
            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10,
              border: `1px solid ${form.tipo_puntuacion === 'personalizada' ? '#ddd6fe' : '#e2e8f0'}`,
              background: form.tipo_puntuacion === 'personalizada' ? '#f5f3ff' : '#fff',
              cursor: 'pointer',
            }}>
              <input type="radio" checked={form.tipo_puntuacion === 'personalizada'} onChange={() => set('tipo_puntuacion', 'personalizada')} style={{ accentColor: P, marginTop: 2 }} />
              <span>
                <strong style={{ display: 'block', color: '#111827', fontSize: '0.82rem' }}>Personalizada</strong>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Configurar puntuación manual</span>
              </span>
            </label>

            {form.tipo_puntuacion === 'personalizada' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
                <div>
                  <label style={LABEL}>Acierto</label>
                  <input type="number" step="0.01" value={form.pts_acierto} onChange={e => set('pts_acierto', e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Fallo</label>
                  <input type="number" step="0.01" value={form.pts_fallo} onChange={e => set('pts_fallo', e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Blanco</label>
                  <input type="number" step="0.01" value={form.pts_blanco} onChange={e => set('pts_blanco', e.target.value)} style={INPUT} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: '20px' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Resumen del test</h2>
          {[
            ['Preguntas', preguntas.length],
            ['Duración', form.duracion_minutos ? `${form.duracion_minutos} min` : '-'],
            ['Dificultad', selectedDificultad?.label ?? '-'],
            ['Tema', selectedTema?.nombre ?? '-'],
            ['Oposición', selectedOposicion?.nombre ?? '-'],
            ['Estado', form.estado === 'publicado' ? 'Publicado' : 'Borrador'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Preguntas del test ({preguntas.length})</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={isNew}
            title={isNew ? 'Guarda el test primero para añadir preguntas' : 'Añadir preguntas'}
            style={{
              padding: '9px 16px', borderRadius: 8, border: 'none',
              background: isNew ? '#c4b5fd' : P, color: '#fff',
              cursor: isNew ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.85rem',
            }}
          >
            + Añadir preguntas
          </button>
        </div>

        {preguntas.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
            {isNew ? 'Guarda el test para poder añadir preguntas.' : 'Todavía no hay preguntas añadidas a este test.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 56 }}>Nº</th>
                  <th style={TH}>Enunciado</th>
                  <th style={TH}>Tema</th>
                  <th style={TH}>Dificultad</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map((p, index) => {
                  const dif = DIFICULTAD[p.nivel_dificultad];
                  return (
                    <tr key={p.id}>
                      <td style={TD}>{index + 1}</td>
                      <td style={{ ...TD, maxWidth: 520 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.enunciado}
                        </span>
                      </td>
                      <td style={TD}>{p.tema_nombre ?? p.bloque_nombre ?? '-'}</td>
                      <td style={TD}>
                        {dif ? (
                          <span style={{ background: dif.bg, color: dif.color, borderRadius: 10, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {dif.label}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={TD}>
                        <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 10, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {p.estado ?? 'Activa'}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemovePregunta(p.id)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal añadir preguntas */}
      {showModal && (
        <ModalAnadirPreguntas
          testId={id}
          oposicionId={form.oposicion_id || null}
          token={token}
          isProfesor={isProfesor}
          onClose={() => setShowModal(false)}
          onAdded={handlePreguntasAdded}
        />
      )}
    </div>
  );
}

