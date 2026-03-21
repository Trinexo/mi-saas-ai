import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { useAuth } from '../../state/auth.jsx';

const EMPTY_FORM = {
  temaId: '',
  enunciado: '',
  explicacion: '',
  referenciaNormativa: '',
  nivelDificultad: 2,
  opciones: [
    { texto: '', correcta: true },
    { texto: '', correcta: false },
    { texto: '', correcta: false },
    { texto: '', correcta: false },
  ],
};

export default function AdminQuestionsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState({ items: [], pagination: {} });
  const [reportes, setReportes] = useState({ items: [], pagination: {} });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    oposicionId: '',
    materiaId: '',
    temaId: '',
    nivelDificultad: '',
    page: 1,
    pageSize: 10,
  });
  const [reportesEstado, setReportesEstado] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [auditoria, setAuditoria] = useState({ items: [], pagination: {} });
  const [auditoriaFilters, setAuditoriaFilters] = useState({
    preguntaId: '',
    usuarioId: '',
    accion: '',
    page: 1,
    pageSize: 20,
  });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Cascading selectors para filtros
  const [catOposiciones, setCatOposiciones] = useState([]);
  const [catMaterias, setCatMaterias] = useState([]);
  const [catTemas, setCatTemas] = useState([]);

  // Cascading selectors para el formulario crear/editar
  const [formOposicionId, setFormOposicionId] = useState('');
  const [formMateriaId, setFormMateriaId] = useState('');
  const [formMaterias, setFormMaterias] = useState([]);
  const [formTemas, setFormTemas] = useState([]);

  useEffect(() => {
    catalogApi.getOposiciones().then(setCatOposiciones).catch(() => {});
  }, []);

  const handleFiltroOposicion = (oposicionId) => {
    setFilters((prev) => ({ ...prev, oposicionId, materiaId: '', temaId: '', page: 1 }));
    setCatMaterias([]);
    setCatTemas([]);
    if (oposicionId) {
      catalogApi.getMaterias(oposicionId).then(setCatMaterias).catch(() => {});
    }
  };

  const handleFiltroMateria = (materiaId) => {
    setFilters((prev) => ({ ...prev, materiaId, temaId: '', page: 1 }));
    setCatTemas([]);
    if (materiaId) {
      catalogApi.getTemas(materiaId).then(setCatTemas).catch(() => {});
    }
  };

  const handleFormOposicion = (oposicionId) => {
    setFormOposicionId(oposicionId);
    setFormMateriaId('');
    setFormMaterias([]);
    setFormTemas([]);
    setForm((prev) => ({ ...prev, temaId: '' }));
    if (oposicionId) {
      catalogApi.getMaterias(oposicionId).then(setFormMaterias).catch(() => {});
    }
  };

  const handleFormMateria = (materiaId) => {
    setFormMateriaId(materiaId);
    setFormTemas([]);
    setForm((prev) => ({ ...prev, temaId: '' }));
    if (materiaId) {
      catalogApi.getTemas(materiaId).then(setFormTemas).catch(() => {});
    }
  };

  const parseCsvPreview = (csv) => {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      setCsvPreview([]);
      return;
    }

    const headers = lines[0].split(',').map((value) => value.trim());
    const previewRows = lines.slice(1, 6).map((line) => {
      const values = line.split(',').map((value) => value.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      return row;
    });

    setCsvPreview(previewRows);
  };

  const buildPreguntasQuery = () => ({
    oposicion_id: filters.oposicionId,
    materia_id: filters.materiaId,
    tema_id: filters.temaId,
    nivel_dificultad: filters.nivelDificultad,
    page: filters.page,
    page_size: filters.pageSize,
  });

  const loadPreguntas = async () => {
    const query = buildPreguntasQuery();
    const response = await adminApi.listPreguntas(token, query);
    setData(response);
  };

  const loadReportes = async () => {
    const response = await adminApi.listReportes(token, {
      estado: reportesEstado,
      page: 1,
      page_size: 10,
    });
    setReportes(response);
  };

  const loadAuditoria = async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await adminApi.listAuditoria(token, {
        pregunta_id: auditoriaFilters.preguntaId || undefined,
        usuario_id: auditoriaFilters.usuarioId || undefined,
        accion: auditoriaFilters.accion || undefined,
        page: auditoriaFilters.page,
        page_size: auditoriaFilters.pageSize,
      });
      setAuditoria(response);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const load = async () => {
    try {
      await Promise.all([loadPreguntas(), loadReportes()]);
    } catch (e) {
      setError(getErrorMessage(e));
    }
    loadAuditoria();
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.pageSize, reportesEstado]);

  useEffect(() => {
    loadAuditoria();
  }, [auditoriaFilters.page, auditoriaFilters.accion]);

  /* ---- CREATE ---- */
  const onCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    try {
      await adminApi.createPregunta(token, {
        ...form,
        temaId: Number(form.temaId),
        nivelDificultad: Number(form.nivelDificultad),
      });
      setForm(EMPTY_FORM);
      setMsg('Pregunta creada correctamente');
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- EDIT ---- */
  const onEdit = async (id) => {
    setError('');
    setMsg('');
    try {
      const pregunta = await adminApi.getPregunta(token, id);
      // Cargar cascada de selects para el formulario
      const oposicionId = pregunta.oposicion_id ? String(pregunta.oposicion_id) : '';
      const materiaId = pregunta.materia_id ? String(pregunta.materia_id) : '';
      setFormOposicionId(oposicionId);
      setFormMateriaId(materiaId);
      if (oposicionId) {
        const mats = await catalogApi.getMaterias(oposicionId).catch(() => []);
        setFormMaterias(mats);
      }
      if (materiaId) {
        const tms = await catalogApi.getTemas(materiaId).catch(() => []);
        setFormTemas(tms);
      }
      setForm({
        temaId: String(pregunta.tema_id),
        enunciado: pregunta.enunciado,
        explicacion: pregunta.explicacion || '',
        referenciaNormativa: pregunta.referencia_normativa || '',
        nivelDificultad: pregunta.nivel_dificultad,
        opciones: pregunta.opciones.map((opt) => ({ texto: opt.texto, correcta: opt.correcta })),
      });
      setEditingId(id);
      window.scrollTo({ top: document.getElementById('pregunta-form')?.offsetTop ?? 0, behavior: 'smooth' });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOposicionId('');
    setFormMateriaId('');
    setFormMaterias([]);
    setFormTemas([]);
    setError('');
    setMsg('');
  };

  const onUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    try {
      await adminApi.updatePregunta(token, editingId, {
        ...form,
        temaId: Number(form.temaId),
        nivelDificultad: Number(form.nivelDificultad),
      });
      setMsg('Pregunta actualizada correctamente');
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- DELETE ---- */
  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return;
    setError('');
    setMsg('');
    try {
      await adminApi.deletePregunta(token, id);
      setMsg('Pregunta eliminada');
      if (editingId === id) onCancelEdit();
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- CSV ---- */
  const onImportCsv = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    setImportResult(null);
    try {
      const result = await adminApi.importPreguntasCsv(token, { csv: csvText, delimiter: ',' });
      setImportResult(result);
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- REPORTES ---- */
  const onChangeReporteEstado = async (reporteId, estado) => {
    setError('');
    try {
      await adminApi.updateReporteEstado(token, reporteId, estado);
      await loadReportes();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.pagination.total || 0) / (data.pagination.pageSize || filters.pageSize)));

  return (
    <section className="card">
      <h2>Admin preguntas</h2>

      {/* Filtros */}
      <div className="form-grid">
        <select
          value={filters.oposicionId}
          onChange={(e) => handleFiltroOposicion(e.target.value)}
        >
          <option value="">— Oposición —</option>
          {catOposiciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
        <select
          value={filters.materiaId}
          onChange={(e) => handleFiltroMateria(e.target.value)}
          disabled={!filters.oposicionId}
        >
          <option value="">— Materia —</option>
          {catMaterias.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
        <select
          value={filters.temaId}
          onChange={(e) => setFilters((prev) => ({ ...prev, temaId: e.target.value, page: 1 }))}
          disabled={!filters.materiaId}
        >
          <option value="">— Tema —</option>
          {catTemas.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <select
          value={filters.nivelDificultad}
          onChange={(e) => setFilters((prev) => ({ ...prev, nivelDificultad: e.target.value, page: 1 }))}
        >
          <option value="">— Dificultad —</option>
          <option value="1">1 — Muy fácil</option>
          <option value="2">2 — Fácil</option>
          <option value="3">3 — Media</option>
          <option value="4">4 — Difícil</option>
          <option value="5">5 — Muy difícil</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setFilters((prev) => ({ ...prev, oposicionId: '', materiaId: '', temaId: '', nivelDificultad: '', page: 1 }));
            setCatMaterias([]);
            setCatTemas([]);
          }}
        >
          Limpiar filtros
        </button>
        <button type="button" onClick={loadPreguntas}>
          Buscar
        </button>
      </div>

      {/* Tabla */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Enunciado</th>
              <th>Tema</th>
              <th>Dificultad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5}>Sin resultados</td>
              </tr>
            )}
            {data.items.map((item) => (
              <tr key={item.id} style={editingId === item.id ? { background: 'var(--color-primary-light, #e8f4ff)' } : undefined}>
                <td>{item.id}</td>
                <td>{item.enunciado}</td>
                <td>{item.tema_nombre}</td>
                <td>{item.nivel_dificultad}</td>
                <td className="row" style={{ gap: '0.25rem' }}>
                  <button type="button" onClick={() => onEdit(item.id)}>
                    Editar
                  </button>
                  <button type="button" className="btn-danger" onClick={() => onDelete(item.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={filters.page <= 1}
        >
          Anterior
        </button>
        <span>
          Página {filters.page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          disabled={filters.page >= totalPages}
        >
          Siguiente
        </button>
      </div>

      {/* Formulario crear / editar */}
      <h3 id="pregunta-form" style={{ marginTop: '1.5rem' }}>
        {editingId ? `Editando pregunta #${editingId}` : 'Nueva pregunta'}
      </h3>
      <form onSubmit={editingId ? onUpdate : onCreate} className="form-grid">
        <label>
          Oposición *
          <select
            value={formOposicionId}
            required
            onChange={(e) => handleFormOposicion(e.target.value)}
          >
            <option value="">— Selecciona oposición —</option>
            {catOposiciones.map((o) => (
              <option key={o.id} value={String(o.id)}>{o.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Materia *
          <select
            value={formMateriaId}
            required
            disabled={!formOposicionId}
            onChange={(e) => handleFormMateria(e.target.value)}
          >
            <option value="">— Selecciona materia —</option>
            {formMaterias.map((m) => (
              <option key={m.id} value={String(m.id)}>{m.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Tema *
          <select
            value={form.temaId}
            required
            disabled={!formMateriaId}
            onChange={(e) => setForm({ ...form, temaId: e.target.value })}
          >
            <option value="">— Selecciona tema —</option>
            {formTemas.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.nombre}</option>
            ))}
          </select>
        </label>
        <input
          placeholder="Enunciado *"
          value={form.enunciado}
          required
          onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
        />
        <input
          placeholder="Explicación"
          value={form.explicacion}
          onChange={(e) => setForm({ ...form, explicacion: e.target.value })}
        />
        <input
          placeholder="Referencia normativa"
          value={form.referenciaNormativa}
          onChange={(e) => setForm({ ...form, referenciaNormativa: e.target.value })}
        />
        <label>
          Dificultad
          <select
            value={form.nivelDificultad}
            onChange={(e) => setForm({ ...form, nivelDificultad: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        {form.opciones.map((item, index) => (
          <div key={index} className="row" style={{ gap: '0.5rem' }}>
            <input
              placeholder={`Opción ${index + 1} *`}
              value={item.texto}
              required
              onChange={(e) => {
                const opciones = [...form.opciones];
                opciones[index] = { ...opciones[index], texto: e.target.value };
                setForm({ ...form, opciones });
              }}
            />
            <label style={{ whiteSpace: 'nowrap' }}>
              <input
                type="radio"
                name="correcta"
                checked={item.correcta}
                onChange={() => {
                  const opciones = form.opciones.map((opt, idx) => ({ ...opt, correcta: idx === index }));
                  setForm({ ...form, opciones });
                }}
              />
              {' '}Correcta
            </label>
          </div>
        ))}

        <div className="row" style={{ gap: '0.5rem' }}>
          <button type="submit">{editingId ? 'Guardar cambios' : 'Crear pregunta'}</button>
          {editingId && (
            <button type="button" onClick={onCancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Importador CSV */}
      <h3 style={{ marginTop: '1.5rem' }}>Importador CSV</h3>
      <form onSubmit={onImportCsv} className="form-grid">
        <textarea
          rows={8}
          placeholder="tema_id,enunciado,explicacion,referencia_normativa,nivel_dificultad,opcion_1,opcion_2,opcion_3,opcion_4,opcion_correcta"
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            parseCsvPreview(e.target.value);
          }}
        />
        <button type="submit">Importar CSV</button>
      </form>

      {csvPreview.length > 0 && (
        <>
          <h4>Previsualización (máx. 5 filas)</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(csvPreview[0]).map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.keys(csvPreview[0]).map((header) => (
                      <td key={`${rowIndex}-${header}`}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {importResult && (
        <p>
          Importación: total {importResult.totalRows} | insertadas {importResult.imported} | fallidas {importResult.failed}
          {importResult.errors?.length > 0 && (
            <ul>
              {importResult.errors.map((err) => (
                <li key={err.row}>Fila {err.row}: {err.message}</li>
              ))}
            </ul>
          )}
        </p>
      )}

      {/* Moderación de reportes */}
      <h3 style={{ marginTop: '1.5rem' }}>Moderación de reportes</h3>
      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <select value={reportesEstado} onChange={(e) => setReportesEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="abierto">Abierto</option>
          <option value="en_revision">En revisión</option>
          <option value="resuelto">Resuelto</option>
          <option value="descartado">Descartado</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pregunta</th>
              <th>Usuario</th>
              <th>Motivo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {reportes.items.length === 0 && (
              <tr>
                <td colSpan={5}>Sin reportes</td>
              </tr>
            )}
            {reportes.items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.pregunta_enunciado}</td>
                <td>{item.usuario_email}</td>
                <td>{item.motivo}</td>
                <td>
                  <select value={item.estado} onChange={(e) => onChangeReporteEstado(item.id, e.target.value)}>
                    <option value="abierto">Abierto</option>
                    <option value="en_revision">En revisión</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Auditoría de cambios en preguntas */}
      {user?.role === 'admin' && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Auditoría de cambios en preguntas</h3>
          <div className="row" style={{ gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <input
              placeholder="Pregunta ID"
              value={auditoriaFilters.preguntaId}
              onChange={(e) => setAuditoriaFilters((prev) => ({ ...prev, preguntaId: e.target.value, page: 1 }))}
              style={{ width: '120px' }}
            />
            <input
              placeholder="Usuario ID"
              value={auditoriaFilters.usuarioId}
              onChange={(e) => setAuditoriaFilters((prev) => ({ ...prev, usuarioId: e.target.value, page: 1 }))}
              style={{ width: '120px' }}
            />
            <select
              value={auditoriaFilters.accion}
              onChange={(e) => setAuditoriaFilters((prev) => ({ ...prev, accion: e.target.value, page: 1 }))}
            >
              <option value="">Todas las acciones</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
            </select>
            <button type="button" onClick={loadAuditoria}>Buscar</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Acción</th>
                  <th>Pregunta ID</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.items.length === 0 && (
                  <tr>
                    <td colSpan={6}>Sin registros de auditoría</td>
                  </tr>
                )}
                {auditoria.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.accion}</td>
                    <td>{item.pregunta_id}</td>
                    <td>{item.usuario_email}</td>
                    <td>{item.usuario_role}</td>
                    <td>{new Date(item.fecha).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(auditoria.pagination.total ?? 0) > 0 && (
            <div className="row" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setAuditoriaFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={auditoriaFilters.page <= 1}
              >
                Anterior
              </button>
              <span>
                Página {auditoriaFilters.page} de{' '}
                {Math.max(1, Math.ceil((auditoria.pagination.total || 0) / auditoriaFilters.pageSize))}
              </span>
              <button
                type="button"
                onClick={() =>
                  setAuditoriaFilters((prev) => ({
                    ...prev,
                    page: Math.min(
                      Math.max(1, Math.ceil((auditoria.pagination.total || 0) / auditoriaFilters.pageSize)),
                      prev.page + 1,
                    ),
                  }))
                }
                disabled={
                  auditoriaFilters.page >=
                  Math.max(1, Math.ceil((auditoria.pagination.total || 0) / auditoriaFilters.pageSize))
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {msg && <p className="success" style={{ color: 'green', marginTop: '0.75rem' }}>{msg}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}