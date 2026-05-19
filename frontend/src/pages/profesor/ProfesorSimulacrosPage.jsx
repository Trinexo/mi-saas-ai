import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { profesorApi } from '../../services/profesorApi';

const SECTION = {
  background: '#fff',
  borderRadius: 16,
  padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  border: '1px solid #e5e7eb',
  marginBottom: 20,
};

const TH = {
  padding: '0.5rem 0.75rem',
  fontWeight: 600,
  color: '#6b7280',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'left',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const TD = {
  padding: '0.6rem 0.75rem',
  color: '#111827',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '0.875rem',
};

const ESTADO_STYLES = {
  borrador: { background: '#f3f4f6', color: '#374151' },
  publicado: { background: '#dcfce7', color: '#166534' },
  archivado: { background: '#f3f4f6', color: '#9ca3af' },
};

const MODAL_OVERLAY = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const emptyForm = {
  nombre: '',
  descripcion: '',
  estado: 'borrador',
  oposicion_id: '',
  tiempo_limite_segundos: '',
  puntuacion_maxima: 100,
  penalizacion: 0,
  mostrar_resultados_al_final: true,
};

export default function ProfesorSimulacrosPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [oposiciones, setOposiciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await profesorApi.getMisSimulacros(token, {
        q: q || undefined,
        estado: estado || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch {
      setError('No se pudieron cargar los simulacros.');
    } finally {
      setLoading(false);
    }
  }, [token, q, estado, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    profesorApi.getMisOposiciones(token)
      .then((data) => setOposiciones(data ?? []))
      .catch(() => setOposiciones([]));
  }, [token]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      oposicion_id: oposiciones.length === 1 ? String(oposiciones[0].id) : '',
    });
    setFormError('');
    setModal('create');
  };

  const openEdit = (simulacro) => {
    setEditTarget(simulacro);
    setForm({
      nombre: simulacro.nombre,
      descripcion: simulacro.descripcion ?? '',
      estado: simulacro.estado,
      oposicion_id: simulacro.oposicion_id ?? '',
      tiempo_limite_segundos: simulacro.tiempo_limite_segundos ?? '',
      puntuacion_maxima: simulacro.puntuacion_maxima ?? 100,
      penalizacion: simulacro.penalizacion ?? 0,
      mostrar_resultados_al_final: simulacro.mostrar_resultados_al_final ?? true,
    });
    setFormError('');
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditTarget(null);
  };

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
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') await profesorApi.createMiSimulacro(token, buildPayload());
      else await profesorApi.updateMiSimulacro(token, editTarget.id, buildPayload());
      closeModal();
      load();
    } catch (event) {
      setFormError(event?.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await profesorApi.deleteMiSimulacro(token, deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (event) {
      alert(event?.message ?? 'Error al eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: '0.9rem',
    marginBottom: 14,
  };
  const labelStyle = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Mis simulacros</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
            Simulacros que has creado - {total} en total
          </p>
        </div>
        <Link to="/profesor/simulacros/nuevo" style={{ background: '#6d28d9', color: '#fff', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
          + Nuevo simulacro
        </Link>
      </div>

      <div style={{ ...SECTION, padding: '14px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <input
          value={q}
          onChange={(event) => { setQ(event.target.value); setPage(1); }}
          placeholder="Buscar..."
          style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
        />
        <select value={estado} onChange={(event) => { setEstado(event.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#374151' }}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="publicado">Publicado</option>
          <option value="archivado">Archivado</option>
        </select>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      <div style={SECTION}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>+</div>
            <div>Aún no has creado ningún simulacro.</div>
            <Link to="/profesor/simulacros/nuevo" style={{ display: 'inline-block', marginTop: 16, background: '#6d28d9', color: '#fff', borderRadius: 9, padding: '9px 20px', fontWeight: 700, textDecoration: 'none' }}>
              Crear el primero
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Secciones</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Preguntas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Tiempo (min)</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Creado</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((simulacro) => (
                  <tr
                    key={simulacro.id}
                    onMouseEnter={(event) => { event.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = ''; }}
                  >
                    <td style={TD}>
                      <div style={{ fontWeight: 600 }}>{simulacro.nombre}</div>
                      {simulacro.oposicion_nombre && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{simulacro.oposicion_nombre}</div>}
                    </td>
                    <td style={TD}>
                      <span style={{ ...(ESTADO_STYLES[simulacro.estado] ?? {}), borderRadius: 12, padding: '2px 10px', fontSize: '0.77rem', fontWeight: 700 }}>
                        {simulacro.estado}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>{simulacro.total_bloques ?? 0}</td>
                    <td style={{ ...TD, textAlign: 'right', fontWeight: 600 }}>{simulacro.total_preguntas ?? 0}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#6b7280' }}>{simulacro.tiempo_limite_segundos ? Math.round(simulacro.tiempo_limite_segundos / 60) : '-'}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {simulacro.fecha_creacion ? new Date(simulacro.fecha_creacion).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <Link to={`/profesor/simulacros/${simulacro.id}/editar`} style={{ display: 'inline-block', background: '#f3f4f6', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', marginRight: 6, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                        Editar
                      </Link>
                      <button onClick={() => setDeleteTarget(simulacro)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
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
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>
              Anterior
            </button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}>
              Siguiente
            </button>
          </div>
        )}
      </div>

      {modal && (
        <div style={MODAL_OVERLAY} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
              {modal === 'create' ? 'Nuevo simulacro' : 'Editar simulacro'}
            </h3>

            <label style={labelStyle}>Nombre *</label>
            <input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} style={inputStyle} />

            <label style={labelStyle}>Descripcion</label>
            <textarea value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Estado</label>
                <select value={form.estado} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))} style={inputStyle}>
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Oposición *</label>
                <select value={form.oposicion_id} onChange={(event) => setForm((current) => ({ ...current, oposicion_id: event.target.value }))} style={inputStyle}>
                  <option value="">Selecciona oposición</option>
                  {oposiciones.map((oposicion) => (
                    <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tiempo limite (seg)</label>
                <input type="number" value={form.tiempo_limite_segundos} onChange={(event) => setForm((current) => ({ ...current, tiempo_limite_segundos: event.target.value }))} style={inputStyle} placeholder="(opcional)" />
              </div>
              <div>
                <label style={labelStyle}>Puntuacion maxima</label>
                <input type="number" value={form.puntuacion_maxima} onChange={(event) => setForm((current) => ({ ...current, puntuacion_maxima: event.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Penalizacion (0-1)</label>
                <input type="number" step="0.01" min="0" max="1" value={form.penalizacion} onChange={(event) => setForm((current) => ({ ...current, penalizacion: event.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input type="checkbox" id="mrf_p" checked={form.mostrar_resultados_al_final} onChange={(event) => setForm((current) => ({ ...current, mostrar_resultados_al_final: event.target.checked }))} />
                <label htmlFor="mrf_p" style={{ fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>Mostrar resultados al final</label>
              </div>
            </div>

            {formError && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0 0 12px' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={closeModal} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#6d28d9', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={MODAL_OVERLAY} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 800, color: '#111827' }}>Eliminar simulacro?</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.9rem' }}>
              Se eliminara <strong>{deleteTarget.nombre}</strong> con todas sus secciones y preguntas asignadas.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
