import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';

const SECTION = {
  background: '#fff', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: 20,
};
const TH = {
  padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280',
  borderBottom: '2px solid #e5e7eb', textAlign: 'left',
  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const TD = {
  padding: '0.6rem 0.75rem', color: '#111827',
  borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
};

const ESTADO_STYLES = {
  borrador:  { background: '#f3f4f6', color: '#374151' },
  publicado: { background: '#dcfce7', color: '#166534' },
  archivado: { background: '#f3f4f6', color: '#9ca3af' },
};

const MODAL_OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const emptyForm = {
  nombre: '', descripcion: '', estado: 'borrador',
  oposicion_id: '', tiempo_limite_segundos: '',
  puntuacion_maxima: 100, penalizacion: 0, mostrar_resultados_al_final: true,
};

export default function AdminSimulacrosPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'detail'
  const [editTarget, setEditTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.listSimulacros(token, {
        q: q || undefined, estado: estado || undefined, page, page_size: PAGE_SIZE,
      });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch { setError('No se pudieron cargar los simulacros.'); }
    finally { setLoading(false); }
  }, [token, q, estado, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create'); };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      nombre: s.nombre, descripcion: s.descripcion ?? '',
      estado: s.estado, oposicion_id: s.oposicion_id ?? '',
      tiempo_limite_segundos: s.tiempo_limite_segundos ?? '',
      puntuacion_maxima: s.puntuacion_maxima ?? 100,
      penalizacion: s.penalizacion ?? 0,
      mostrar_resultados_al_final: s.mostrar_resultados_al_final ?? true,
    });
    setFormError(''); setModal('edit');
  };
  const openDetail = async (s) => {
    setModal('detail'); setDetailLoading(true);
    try {
      const res = await adminApi.getSimulacro(token, s.id);
      setDetailItem(res);
    } catch { setDetailItem(null); }
    finally { setDetailLoading(false); }
  };
  const closeModal = () => { setModal(null); setEditTarget(null); setDetailItem(null); };

  const buildPayload = () => ({
    nombre: form.nombre,
    descripcion: form.descripcion || null,
    estado: form.estado,
    oposicion_id: form.oposicion_id ? Number(form.oposicion_id) : null,
    tiempo_limite_segundos: form.tiempo_limite_segundos ? Number(form.tiempo_limite_segundos) : null,
    puntuacion_maxima: Number(form.puntuacion_maxima),
    penalizacion: Number(form.penalizacion),
    mostrar_resultados_al_final: form.mostrar_resultados_al_final,
  });

  const handleSave = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    setSaving(true); setFormError('');
    try {
      if (modal === 'create') await adminApi.createSimulacro(token, buildPayload());
      else await adminApi.updateSimulacro(token, editTarget.id, buildPayload());
      closeModal(); load();
    } catch (e) { setFormError(e?.message ?? 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await adminApi.deleteSimulacro(token, deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { alert(e?.message ?? 'Error al eliminar.'); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
    borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', marginBottom: 14,
  };
  const labelStyle = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Simulacros</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>{total} simulacro{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          + Nuevo simulacro
        </button>
      </div>

      {/* Filtros */}
      <div style={{ ...SECTION, padding: '14px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscarâ€¦"
          style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }} />
        <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#374151' }}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="publicado">Publicado</option>
          <option value="archivado">Archivado</option>
        </select>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>}

      {/* Tabla */}
      <div style={SECTION}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargandoâ€¦</p>
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Sin resultados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>OposiciÃ³n</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Bloques</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Preguntas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Tiempo (min)</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={TD}>
                      <button onClick={() => openDetail(s)}
                        style={{ background: 'none', border: 'none', padding: 0, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}>
                        {s.nombre}
                      </button>
                      {s.descripcion && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{s.descripcion}</div>}
                    </td>
                    <td style={{ ...TD, color: '#6b7280' }}>{s.oposicion_nombre || 'â€”'}</td>
                    <td style={TD}>
                      <span style={{ ...(ESTADO_STYLES[s.estado] ?? {}), borderRadius: 12, padding: '2px 10px', fontSize: '0.77rem', fontWeight: 700 }}>
                        {s.estado}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>{s.total_bloques ?? 0}</td>
                    <td style={{ ...TD, textAlign: 'right', fontWeight: 600 }}>{s.total_preguntas ?? 0}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#6b7280' }}>
                      {s.tiempo_limite_segundos ? Math.round(s.tiempo_limite_segundos / 60) : 'â€”'}
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <button onClick={() => openEdit(s)}
                        style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', marginRight: 6, fontWeight: 600, color: '#374151' }}>
                        Editar
                      </button>
                      <button onClick={() => setDeleteTarget(s)}
                        style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>â€¹</button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}>â€º</button>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={MODAL_OVERLAY} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
              {modal === 'create' ? 'Nuevo simulacro' : 'Editar simulacro'}
            </h3>

            <label style={labelStyle}>Nombre *</label>
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />

            <label style={labelStyle}>DescripciÃ³n</label>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={2}
              style={{ ...inputStyle, resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Estado</label>
                <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
                  style={{ ...inputStyle }}>
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>ID OposiciÃ³n</label>
                <input type="number" value={form.oposicion_id} onChange={e => setForm(p => ({ ...p, oposicion_id: e.target.value }))}
                  style={inputStyle} placeholder="(opcional)" />
              </div>
              <div>
                <label style={labelStyle}>Tiempo lÃ­mite (seg)</label>
                <input type="number" value={form.tiempo_limite_segundos} onChange={e => setForm(p => ({ ...p, tiempo_limite_segundos: e.target.value }))}
                  style={inputStyle} placeholder="(opcional)" />
              </div>
              <div>
                <label style={labelStyle}>PuntuaciÃ³n mÃ¡xima</label>
                <input type="number" value={form.puntuacion_maxima} onChange={e => setForm(p => ({ ...p, puntuacion_maxima: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PenalizaciÃ³n (0-1)</label>
                <input type="number" step="0.01" min="0" max="1" value={form.penalizacion} onChange={e => setForm(p => ({ ...p, penalizacion: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input type="checkbox" id="mrf" checked={form.mostrar_resultados_al_final} onChange={e => setForm(p => ({ ...p, mostrar_resultados_al_final: e.target.checked }))} />
                <label htmlFor="mrf" style={{ fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>Mostrar resultados al final</label>
              </div>
            </div>

            {formError && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0 0 12px' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={closeModal} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardandoâ€¦' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modal === 'detail' && (
        <div style={MODAL_OVERLAY} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            {detailLoading && <p style={{ textAlign: 'center', color: '#9ca3af' }}>Cargandoâ€¦</p>}
            {!detailLoading && !detailItem && <p style={{ color: '#dc2626' }}>No se pudo cargar el detalle.</p>}
            {!detailLoading && detailItem && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>{detailItem.nombre}</h3>
                    {detailItem.oposicion_nombre && <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>{detailItem.oposicion_nombre}</p>}
                  </div>
                  <span style={{ ...ESTADO_STYLES[detailItem.estado], borderRadius: 12, padding: '3px 12px', fontSize: '0.77rem', fontWeight: 700 }}>
                    {detailItem.estado}
                  </span>
                </div>
                {detailItem.descripcion && <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 16 }}>{detailItem.descripcion}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Tiempo', value: detailItem.tiempo_limite_segundos ? `${Math.round(detailItem.tiempo_limite_segundos / 60)} min` : 'â€”' },
                    { label: 'PuntuaciÃ³n mÃ¡x.', value: detailItem.puntuacion_maxima ?? 'â€”' },
                    { label: 'PenalizaciÃ³n', value: detailItem.penalizacion ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{value}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {(detailItem.bloques ?? []).length > 0 && (
                  <>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>Bloques</h4>
                    {detailItem.bloques.map(b => (
                      <div key={b.id} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{b.nombre}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{b.numero_preguntas ?? 0} pregunta{b.numero_preguntas !== 1 ? 's' : ''}</div>
                      </div>
                    ))}
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={closeModal} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div style={MODAL_OVERLAY} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 800, color: '#111827' }}>Â¿Eliminar simulacro?</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.9rem' }}>
              Se eliminarÃ¡ <strong>{deleteTarget.nombre}</strong> junto con todos sus bloques y preguntas asignadas.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminandoâ€¦' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
