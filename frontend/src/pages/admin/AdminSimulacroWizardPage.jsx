import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';

// ─── Tokens de estilo ─────────────────────────────────────────────────────────
const P    = '#7c3aed';
const CARD = {
  background: '#fff', borderRadius: 16,
  border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '24px',
};
const INPUT = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem',
  color: '#111827', outline: 'none',
};
const LABEL = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 };

const PASOS = [
  { id: 1, label: 'Información' },
  { id: 2, label: 'Estructura' },
  { id: 3, label: 'Preguntas' },
  { id: 4, label: 'Configuración' },
  { id: 5, label: 'Publicación' },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>{desc}</div>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: value ? P : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  );
}

// ─── Modal gestionar preguntas de un bloque ───────────────────────────────────
function ModalGestionPreguntas({ simulacroId, bloque, onClose, onUpdated, token, oposicionId, isProfesor }) {
  const [preguntas,  setPreguntas]  = useState([]);
  const [temas,      setTemas]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [q,          setQ]          = useState('');
  const [selected,   setSelected]   = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoCantidad, setAutoCantidad] = useState(bloque.numero_preguntas || 10);
  const [autoDificultad, setAutoDificultad] = useState('');
  const [autoMessage, setAutoMessage] = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const PAGE_SIZE = 15;

  const DIFICULTAD = {
    facil:   '#16a34a',
    media:   '#ca8a04',
    dificil: '#dc2626',
  };
  const DIFICULTAD_L = {
    facil:   'Fácil',
    media:   'Media',
    dificil: 'Difícil',
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = isProfesor
        ? await profesorApi.getMisPreguntas(token, {
          q: q || undefined, oposicion_id: oposicionId || undefined, page, page_size: PAGE_SIZE,
        })
        : await adminApi.listPreguntas(token, {
          q: q || undefined, oposicion_id: oposicionId || undefined, page, page_size: PAGE_SIZE,
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

  // Preseleccionar preguntas ya en el bloque
  useEffect(() => {
    setSelected((bloque.preguntas ?? []).map(p => p.id));
  }, [bloque]);

  const toggle = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleAutoSelect = async () => {
    if (!oposicionId || temas.length === 0) return;
    setAutoLoading(true);
    setAutoMessage('');
    try {
      const payload = {
        oposicion_id: Number(oposicionId),
        tema_ids: temas.map((tema) => Number(tema.tema_id)),
        cantidad: Number(autoCantidad || bloque.numero_preguntas || 10),
        dificultad: autoDificultad || null,
        simulacro_id: simulacroId ? Number(simulacroId) : undefined,
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const yaAsignadas = (bloque.preguntas ?? []).map(p => p.id);
      const anadir = selected.filter(id => !yaAsignadas.includes(id));
      const quitar = yaAsignadas.filter(id => !selected.includes(id));
      for (const id of quitar) {
        if (isProfesor) {
          await profesorApi.quitarPreguntaMiSimulacro(token, simulacroId, bloque.id, id);
        } else {
          await adminApi.quitarPreguntaBloque(token, simulacroId, bloque.id, id);
        }
      }
      if (anadir.length > 0) {
        // bigint IDs llegan como strings desde pg; convertir a number antes de enviar
        const anadirNums = anadir.map(Number);
        if (isProfesor) {
          await profesorApi.asignarPreguntasMiSimulacro(token, simulacroId, bloque.id, anadirNums);
        } else {
          await adminApi.asignarPreguntasBloque(token, simulacroId, bloque.id, anadirNums);
        }
      }
      onUpdated();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 760, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Gestionar preguntas</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Seccion: {bloque.nombre}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar pregunta…"
            style={{ ...INPUT, marginBottom: 0, flex: 1 }} />
          <span style={{ fontSize: '0.8rem', color: P, fontWeight: 600, whiteSpace: 'nowrap' }}>{selected.length} seleccionadas</span>
        </div>
        {(isProfesor || temas.length > 0) && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, alignItems: 'center' }}>
            <input type="number" min="1" value={autoCantidad} onChange={(e) => setAutoCantidad(e.target.value)}
              style={{ ...INPUT, marginBottom: 0 }} />
            <select value={autoDificultad} onChange={(e) => setAutoDificultad(e.target.value)} style={{ ...INPUT, marginBottom: 0 }}>
              <option value="">Dificultad mixta</option>
              <option value="facil">Fácil</option>
              <option value="media">Media</option>
              <option value="dificil">Difícil</option>
            </select>
            <button type="button" onClick={handleAutoSelect} disabled={autoLoading || !oposicionId || temas.length === 0}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: P, color: '#fff', cursor: autoLoading ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              {autoLoading ? 'Proponiendo...' : 'Proponer automaticamente'}
            </button>
            {autoMessage && <div style={{ gridColumn: '1 / -1', color: autoMessage.startsWith('Seleccionadas') ? '#166534' : '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>{autoMessage}</div>}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando…</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 14px', width: 36 }}></th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pregunta</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dificultad</th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map(p => {
                  const checked = selected.includes(p.id);
                  return (
                    <tr key={p.id} onClick={() => toggle(p.id)} style={{ cursor: 'pointer', background: checked ? 'rgba(124,58,237,.04)' : '' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <input type="checkbox" checked={checked} readOnly style={{ accentColor: P }} />
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.85rem', color: '#1e293b' }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.enunciado}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {p.nivel_dificultad && (
                          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: DIFICULTAD[p.nivel_dificultad], background: 'transparent' }}>
                            {DIFICULTAD_L[p.nivel_dificultad]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', fontSize: '0.8rem' }}>← Ant.</button>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page * PAGE_SIZE >= total ? 'default' : 'pointer', color: page * PAGE_SIZE >= total ? '#d1d5db' : '#374151', fontSize: '0.8rem' }}>Sig. →</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: P, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
              {saving ? 'Guardando…' : 'Guardar selección'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Paso 1: Información general ─────────────────────────────────────────────
function Paso1({ form, set, oposiciones }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={LABEL}>Nombre del simulacro *</label>
        <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
          placeholder="Ej. Simulacro Policía Local — Junio 2025"
          style={INPUT} />
      </div>
      <div>
        <label style={LABEL}>Oposición</label>
        <select value={form.oposicion_id} onChange={e => set('oposicion_id', e.target.value)}
          style={{ ...INPUT, color: form.oposicion_id ? '#111827' : '#9ca3af' }}>
          <option value="">— Sin oposición —</option>
          {oposiciones.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
      </div>
      <div>
        <label style={LABEL}>Descripción</label>
        <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          placeholder="Descripción breve del simulacro…" rows={4}
          style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
      </div>
    </div>
  );
}

// ─── Paso 2: Estructura y bloques ────────────────────────────────────────────
function Paso2({ simulacroId, bloques, onBloquesChange, token, isProfesor }) {
  const [nuevoBloque, setNuevoBloque] = useState({ nombre: '', numero_preguntas: '' });
  const [editando,    setEditando]    = useState(null); // { id, nombre, numero_preguntas }
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const totalPreguntas = bloques.reduce((s, b) => s + (b.numero_preguntas || 0), 0);

  const handleAdd = async () => {
    if (!nuevoBloque.nombre.trim()) { setError('El nombre de la seccion es obligatorio.'); return; }
    setSaving(true); setError('');
    try {
      const api = isProfesor ? profesorApi.createMiSimulacroBloque : adminApi.createSimulacroBloque;
      await api(token, simulacroId, {
        nombre: nuevoBloque.nombre,
        numero_preguntas: nuevoBloque.numero_preguntas ? Number(nuevoBloque.numero_preguntas) : 0,
        orden: bloques.length + 1,
      });
      setNuevoBloque({ nombre: '', numero_preguntas: '' });
      onBloquesChange();
    } catch (e) { setError(e?.message ?? 'Error al añadir la seccion.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (b) => {
    setSaving(true); setError('');
    try {
      const api = isProfesor ? profesorApi.updateMiSimulacroBloque : adminApi.updateSimulacroBloque;
      await api(token, simulacroId, b.id, {
        nombre: editando.nombre,
        numero_preguntas: editando.numero_preguntas ? Number(editando.numero_preguntas) : 0,
      });
      setEditando(null);
      onBloquesChange();
    } catch (e) { setError(e?.message ?? 'Error al actualizar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (bloqueId) => {
    if (!window.confirm('¿Eliminar esta seccion? Se borrarán sus preguntas asignadas.')) return;
    try {
      const api = isProfesor ? profesorApi.deleteMiSimulacroBloque : adminApi.deleteSimulacroBloque;
      await api(token, simulacroId, bloqueId);
      onBloquesChange();
    } catch (e) { alert(e?.message ?? 'Error al eliminar.'); }
  };

  return (
    <div>
      {error && <div style={{ padding: '8px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.82rem', marginBottom: 12 }}>{error}</div>}
      <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#6b7280' }}>
        Define las secciones del simulacro. Cada seccion agrupa un conjunto de preguntas.
      </p>
      {/* Tabla de bloques */}
      {bloques.length > 0 ? (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Seccion', 'Nº preguntas', '% del total', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloques.map(b => (
                <tr key={b.id} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    {editando?.id === b.id ? (
                      <input value={editando.nombre} onChange={e => setEditando(ev => ({ ...ev, nombre: e.target.value }))}
                        style={{ ...INPUT, marginBottom: 0, maxWidth: 260 }} />
                    ) : (
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{b.nombre}</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    {editando?.id === b.id ? (
                      <input type="number" min="0" value={editando.numero_preguntas} onChange={e => setEditando(ev => ({ ...ev, numero_preguntas: e.target.value }))}
                        style={{ ...INPUT, marginBottom: 0, width: 80 }} />
                    ) : (
                      <span style={{ fontWeight: 600, color: P }}>{b.numero_preguntas || 0}</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', color: '#6b7280', fontSize: '0.85rem' }}>
                    {totalPreguntas > 0 ? `${Math.round(((b.numero_preguntas || 0) / totalPreguntas) * 100)}%` : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {editando?.id === b.id ? (
                        <>
                          <button onClick={() => handleUpdate(b)} disabled={saving}
                            style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: P, color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                            {saving ? '…' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditando(null)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.78rem' }}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditando({ id: b.id, nombre: b.nombre, numero_preguntas: b.numero_preguntas || 0 })}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#374151' }}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleDelete(b.id)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626' }}>
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', paddingLeft: 4 }}>
            Total: <strong style={{ color: '#111827' }}>{totalPreguntas}</strong> preguntas planificadas
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '28px', color: '#9ca3af', borderRadius: 10, border: '2px dashed #e2e8f0', marginBottom: 16 }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📂</div>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Sin secciones. Añade la primera.</p>
        </div>
      )}
      {/* Formulario nuevo bloque */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Añadir seccion</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={LABEL}>Nombre</label>
            <input value={nuevoBloque.nombre} onChange={e => setNuevoBloque(b => ({ ...b, nombre: e.target.value }))}
              placeholder="Ej. Tema 1 - Constitucion"
              style={INPUT} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div style={{ width: 120 }}>
            <label style={LABEL}>Nº preguntas</label>
            <input type="number" min="0" value={nuevoBloque.numero_preguntas} onChange={e => setNuevoBloque(b => ({ ...b, numero_preguntas: e.target.value }))}
              placeholder="0"
              style={INPUT} />
          </div>
          <button onClick={handleAdd} disabled={saving || !nuevoBloque.nombre.trim()}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: nuevoBloque.nombre.trim() ? P : '#c4b5fd', color: '#fff', cursor: nuevoBloque.nombre.trim() ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.85rem', marginBottom: 0 }}>
            {saving ? '…' : '+ Añadir'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Paso 3: Selección de preguntas ──────────────────────────────────────────
function Paso3({ simulacroId, bloques, onBloquesChange, token, oposicionId, isProfesor }) {
  const [modalBloque, setModalBloque] = useState(null);

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#6b7280' }}>
        Asigna preguntas a cada seccion del simulacro. El progreso muestra las preguntas asignadas vs planificadas.
      </p>
      {bloques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', borderRadius: 10, border: '2px dashed #e2e8f0' }}>
          <p style={{ margin: 0 }}>No hay secciones. Ve al paso anterior para crearlas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bloques.map(b => {
            const asignadas = (b.preguntas ?? []).length;
            const planificadas = b.numero_preguntas || 0;
            const pct = planificadas > 0 ? Math.min(100, Math.round((asignadas / planificadas) * 100)) : 0;
            const completo = asignadas >= planificadas && planificadas > 0;
            return (
              <div key={b.id} style={{ ...CARD, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{b.nombre}</span>
                      {completo && (
                        <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>✓ Completo</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#f1f5f9', maxWidth: 300 }}>
                        <div style={{ height: '100%', borderRadius: 4, background: completo ? '#16a34a' : P, width: `${pct}%`, transition: 'width .3s' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: completo ? '#16a34a' : '#111827' }}>{asignadas}</strong>/{planificadas} preguntas
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setModalBloque(b)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${P}`, background: 'rgba(124,58,237,.06)', color: P, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    Gestionar preguntas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modalBloque && (
        <ModalGestionPreguntas
          simulacroId={simulacroId}
          bloque={modalBloque}
          token={token}
          oposicionId={oposicionId}
          isProfesor={isProfesor}
          onClose={() => setModalBloque(null)}
          onUpdated={() => { setModalBloque(null); onBloquesChange(); }}
        />
      )}
    </div>
  );
}

// ─── Paso 4: Configuración ───────────────────────────────────────────────────
function Paso4({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={LABEL}>Tiempo límite (minutos)</label>
          <input type="number" min="1" value={form.tiempo_limite_min} onChange={e => set('tiempo_limite_min', e.target.value)}
            placeholder="Sin límite"
            style={INPUT} />
          <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#9ca3af' }}>Deja vacío para sin límite de tiempo</p>
        </div>
        <div>
          <label style={LABEL}>Puntuación máxima</label>
          <input type="number" min="0" value={form.puntuacion_maxima} onChange={e => set('puntuacion_maxima', e.target.value)}
            placeholder="100"
            style={INPUT} />
        </div>
        <div>
          <label style={LABEL}>Penalización por error</label>
          <input type="number" step="0.01" value={form.penalizacion} onChange={e => set('penalizacion', e.target.value)}
            placeholder="0"
            style={INPUT} />
          <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#9ca3af' }}>Ej: 0.33 descuenta 1/3 por error</p>
        </div>
      </div>
      <Toggle value={form.mostrar_resultados_al_final} onChange={v => set('mostrar_resultados_al_final', v)}
        label="Mostrar resultados al finalizar" desc="El alumno ve la puntuación al terminar el simulacro" />
      <Toggle value={form.mezclar_preguntas} onChange={v => set('mezclar_preguntas', v)}
        label="Mezclar preguntas" desc="Las preguntas se presentan en orden aleatorio" />
    </div>
  );
}

// ─── Paso 5: Publicación ─────────────────────────────────────────────────────
function Paso5({ form, set }) {
  const estados = [
    { val: 'borrador',  label: 'Borrador',  desc: 'No visible para los alumnos',        bg: '#f1f5f9', color: '#475569' },
    { val: 'publicado', label: 'Publicado', desc: 'Visible y disponible para los alumnos', bg: '#dcfce7', color: '#16a34a' },
    { val: 'archivado', label: 'Archivado', desc: 'Oculto y no accesible',               bg: '#fee2e2', color: '#dc2626' },
  ];
  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#6b7280' }}>
        Elige el estado inicial del simulacro. Podrás cambiarlo en cualquier momento.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {estados.map(e => (
          <div key={e.val} onClick={() => set('estado', e.val)}
            style={{
              padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
              border: form.estado === e.val ? `2px solid ${P}` : '2px solid #e2e8f0',
              background: form.estado === e.val ? 'rgba(124,58,237,.04)' : '#fff',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'border .15s',
            }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{e.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{e.desc}</div>
            </div>
            {form.estado === e.val && (
              <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {form.estado === 'publicado' && (
        <div>
          <label style={LABEL}>Fecha de publicación (opcional)</label>
          <input type="datetime-local" value={form.fecha_publicacion} onChange={e => set('fecha_publicacion', e.target.value)}
            style={INPUT} />
          <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#9ca3af' }}>
            Si se especifica, el simulacro se publicará automáticamente en esa fecha.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Resumen lateral ─────────────────────────────────────────────────────────
function ResumenLateral({ form, bloques, oposiciones, pasoActual }) {
  const oposicion = oposiciones.find(o => String(o.id) === String(form.oposicion_id));
  const totalBloques   = bloques.length;
  const totalPlanif    = bloques.reduce((s, b) => s + (b.numero_preguntas || 0), 0);
  const totalAsignadas = bloques.reduce((s, b) => s + ((b.preguntas ?? []).length), 0);

  return (
    <div style={{ ...CARD, position: 'sticky', top: 16 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Resumen</h3>
      {[
        ['Nombre',     form.nombre || '—'],
        ['Oposición',  oposicion?.nombre || '—'],
        ['Secciones',    totalBloques],
        ['Preguntas planificadas', totalPlanif || '—'],
        ['Preguntas asignadas',   totalAsignadas || '—'],
        ['Tiempo',     form.tiempo_limite_min ? `${form.tiempo_limite_min} min` : 'Sin límite'],
        ['Puntuación máx.', form.puntuacion_maxima || '—'],
        ['Penalización',    form.penalizacion || '0'],
        ['Estado',     form.estado || '—'],
      ].map(([l, v]) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{l}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111827', textAlign: 'right', maxWidth: 160, wordBreak: 'break-word' }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal: Wizard ─────────────────────────────────────────────────
export default function AdminSimulacroWizardPage() {
  const { id }    = useParams();
  const isNew     = !id;
  const navigate  = useNavigate();
  const { token, user } = useAuth();
  const isProfesor = user?.role === 'profesor';
  const basePath = user?.role === 'profesor' ? '/profesor/simulacros' : '/admin/simulacros';

  const [paso,        setPaso]        = useState(1);
  const [simulacroId, setSimulacroId] = useState(isNew ? null : id);
  const [oposiciones, setOposiciones] = useState([]);
  const [bloques,     setBloques]     = useState([]);
  const [loading,     setLoading]     = useState(!isNew);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const EMPTY_FORM = {
    nombre: '', descripcion: '', oposicion_id: '',
    tiempo_limite_min: '', puntuacion_maxima: 100, penalizacion: 0,
    mostrar_resultados_al_final: true, mezclar_preguntas: true,
    estado: 'borrador', fecha_publicacion: '',
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Carga oposiciones
  useEffect(() => {
    const loadOposiciones = async () => {
      if (isProfesor) {
        return profesorApi.getMisOposiciones(token);
      }
      try {
        const r = await adminApi.listOposicionesConStats(token, { page_size: 100 });
        return r?.items ?? r ?? [];
      } catch {
        return catalogApi.getOposiciones(token);
      }
    };

    loadOposiciones()
      .then((r) => {
        const items = r?.items ?? r ?? [];
        setOposiciones(items);
        if (isNew && isProfesor) {
          setForm((current) => {
            const ids = items.map((op) => String(op.id));
            if (items.length === 1) {
              return { ...current, oposicion_id: String(items[0].id) };
            }
            if (current.oposicion_id && !ids.includes(String(current.oposicion_id))) {
              return { ...current, oposicion_id: '' };
            }
            return current;
          });
        }
      })
      .catch(() => setError('No se pudieron cargar las oposiciones.'));
  }, [token, isProfesor, isNew]);

  // Carga simulacro existente si edición
  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    const api = isProfesor ? profesorApi.getMiSimulacro : adminApi.getSimulacro;
    api(token, id)
      .then(s => {
        setForm({
          nombre:                   s.nombre ?? '',
          descripcion:              s.descripcion ?? '',
          oposicion_id:             s.oposicion_id ?? '',
          tiempo_limite_min:        s.tiempo_limite_segundos ? Math.round(s.tiempo_limite_segundos / 60) : '',
          puntuacion_maxima:        s.puntuacion_maxima ?? 100,
          penalizacion:             s.penalizacion ?? 0,
          mostrar_resultados_al_final: s.mostrar_resultados_al_final ?? true,
          mezclar_preguntas:        s.mezclar_preguntas ?? true,
          estado:                   s.estado ?? 'borrador',
          fecha_publicacion:        s.fecha_publicacion ? s.fecha_publicacion.substring(0, 16) : '',
        });
        setBloques(s.bloques ?? []);
      })
      .catch(() => setError('No se pudo cargar el simulacro.'))
      .finally(() => setLoading(false));
  }, [id, isNew, token, isProfesor]);

  // Recargar bloques del simulacro
  const recargarBloques = useCallback(async () => {
    if (!simulacroId) return;
    try {
      const api = isProfesor ? profesorApi.getMiSimulacro : adminApi.getSimulacro;
      const s = await api(token, simulacroId);
      setBloques(s?.bloques ?? []);
    } catch { /* silencioso */ }
  }, [simulacroId, token, isProfesor]);

  // ─── Acción "Siguiente" ─────────────────────────────────────────────────────
  const handleSiguiente = async () => {
    setError('');

    // Paso 1 → crear o actualizar campos básicos
    if (paso === 1) {
      if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
      setSaving(true);
      try {
        const payload = {
          nombre:       form.nombre.trim(),
          ...(form.descripcion?.trim() ? { descripcion: form.descripcion.trim() } : {}),
          oposicion_id: form.oposicion_id ? Number(form.oposicion_id) : null,
        };
        if (isNew && !simulacroId) {
          const api = isProfesor ? profesorApi.createMiSimulacro : adminApi.createSimulacro;
          const created = await api(token, payload);
          setSimulacroId(created.id);
          // Actualizar URL sin recargar
          window.history.replaceState(null, '', `${basePath}/${created.id}/editar`);
        } else {
          const api = isProfesor ? profesorApi.updateMiSimulacro : adminApi.updateSimulacro;
          await api(token, simulacroId, payload);
        }
        setPaso(2);
      } catch (e) { setError(e?.message ?? 'Error al guardar.'); }
      finally { setSaving(false); }
      return;
    }

    // Pasos 4 → guardar config
    if (paso === 4) {
      setSaving(true);
      try {
        const api = isProfesor ? profesorApi.updateMiSimulacro : adminApi.updateSimulacro;
        await api(token, simulacroId, {
          tiempo_limite_segundos: form.tiempo_limite_min ? Number(form.tiempo_limite_min) * 60 : null,
          puntuacion_maxima: Number(form.puntuacion_maxima),
          penalizacion: Number(form.penalizacion),
          mostrar_resultados_al_final: form.mostrar_resultados_al_final,
        });
        setPaso(5);
      } catch (e) { setError(e?.message ?? 'Error al guardar.'); }
      finally { setSaving(false); }
      return;
    }

    setPaso(p => Math.min(5, p + 1));
  };

  // ─── Acción "Finalizar" (paso 5) ────────────────────────────────────────────
  const handleFinalizar = async () => {
    setSaving(true); setError('');
    try {
      const api = isProfesor ? profesorApi.updateMiSimulacro : adminApi.updateSimulacro;
      await api(token, simulacroId, {
        estado:           form.estado,
        fecha_publicacion: form.fecha_publicacion ? new Date(form.fecha_publicacion).toISOString() : null,
      });
      navigate(basePath);
    } catch (e) { setError(e?.message ?? 'Error al finalizar.'); }
    finally { setSaving(false); }
  };

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
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#9ca3af', marginBottom: 6 }}>
          <button onClick={() => navigate(basePath)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, fontWeight: 600, padding: 0, fontSize: '0.8rem' }}>
            Simulacros
          </button>
          <span>/</span>
          <span>{isNew ? 'Crear simulacro' : (form.nombre || 'Editar simulacro')}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          {isNew ? 'Crear simulacro' : 'Editar simulacro'}
        </h1>
      </div>

      {/* ─── Indicador de pasos ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, overflow: 'hidden', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
        {PASOS.map((p, i) => {
          const activo    = paso === p.id;
          const completado = paso > p.id;
          return (
            <div key={p.id}
              onClick={() => { if (completado) setPaso(p.id); }}
              style={{
                flex: 1, padding: '14px 8px', textAlign: 'center', cursor: completado ? 'pointer' : 'default',
                background: activo ? P : completado ? '#ede9fe' : '#f8fafc',
                borderRight: i < PASOS.length - 1 ? '1px solid #e2e8f0' : 'none',
                transition: 'background .2s',
              }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', margin: '0 auto 4px',
                background: activo ? 'rgba(255,255,255,.25)' : completado ? P : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: activo ? '#fff' : completado ? '#fff' : '#9ca3af' }}>
                  {completado ? '✓' : p.id}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: activo ? 700 : 500, color: activo ? '#fff' : completado ? P : '#9ca3af' }}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontSize: '0.875rem', marginBottom: 20, border: '1px solid #fecaca' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>×</button>
        </div>
      )}

      {/* ─── Layout paso + resumen ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Contenido del paso */}
        <div style={CARD}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
            {PASOS[paso - 1].label}
          </h2>
          {paso === 1 && <Paso1 form={form} set={set} oposiciones={oposiciones} />}
          {paso === 2 && (
            simulacroId
              ? <Paso2 simulacroId={simulacroId} bloques={bloques} onBloquesChange={recargarBloques} token={token} isProfesor={isProfesor} />
              : <p style={{ color: '#9ca3af' }}>Completa el paso 1 primero.</p>
          )}
          {paso === 3 && (
            simulacroId
              ? <Paso3 simulacroId={simulacroId} bloques={bloques} onBloquesChange={recargarBloques} token={token} oposicionId={form.oposicion_id} isProfesor={isProfesor} />
              : <p style={{ color: '#9ca3af' }}>Completa el paso 1 primero.</p>
          )}
          {paso === 4 && <Paso4 form={form} set={set} />}
          {paso === 5 && <Paso5 form={form} set={set} />}

          {/* Botones navegación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <button
              disabled={paso === 1}
              onClick={() => setPaso(p => Math.max(1, p - 1))}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: paso > 1 ? 'pointer' : 'default', color: paso > 1 ? '#374151' : '#d1d5db', fontWeight: 600, fontSize: '0.85rem' }}>
              ← Anterior
            </button>
            {paso < 5 ? (
              <button onClick={handleSiguiente} disabled={saving}
                style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: saving ? '#c4b5fd' : P, color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                {saving ? 'Guardando…' : 'Siguiente →'}
              </button>
            ) : (
              <button onClick={handleFinalizar} disabled={saving}
                style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: saving ? '#c4b5fd' : '#16a34a', color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                {saving ? 'Guardando…' : '✓ Finalizar y guardar'}
              </button>
            )}
          </div>
        </div>

        {/* Resumen lateral */}
        <ResumenLateral form={form} bloques={bloques} oposiciones={oposiciones} pasoActual={paso} />
      </div>
    </div>
  );
}
