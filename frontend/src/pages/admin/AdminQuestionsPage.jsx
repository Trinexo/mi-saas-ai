import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
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
  const { token } = useAuth();
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
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

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

  const load = async () => {
    try {
      await Promise.all([loadPreguntas(), loadReportes()]);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.pageSize, reportesEstado]);

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
      setError(e.message);
    }
  };

  /* ---- EDIT ---- */
  const onEdit = async (id) => {
    setError('');
    setMsg('');
    try {
      const pregunta = await adminApi.getPregunta(token, id);
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
      setError(e.message);
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
      setError(e.message);
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
      setError(e.message);
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
      setError(e.message);
    }
  };

  /* ---- REPORTES ---- */
  const onChangeReporteEstado = async (reporteId, estado) => {
    setError('');
    try {
      await adminApi.updateReporteEstado(token, reporteId, estado);
      await loadReportes();
    } catch (e) {
      setError(e.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.pagination.total || 0) / (data.pagination.pageSize || filters.pageSize)));

  return (
    <section className="card">
      <h2>Admin preguntas</h2>

      {/* Filtros */}
      <div className="form-grid">
        <input
          placeholder="Filtro oposición ID"
          value={filters.oposicionId}
          onChange={(e) => setFilters((prev) => ({ ...prev, oposicionId: e.target.value, page: 1 }))}
        />
        <input
          placeholder="Filtro materia ID"
          value={filters.materiaId}
          onChange={(e) => setFilters((prev) => ({ ...prev, materiaId: e.target.value, page: 1 }))}
        />
        <input
          placeholder="Filtro tema ID"
          value={filters.temaId}
          onChange={(e) => setFilters((prev) => ({ ...prev, temaId: e.target.value, page: 1 }))}
        />
        <input
          type="number"
          min="1"
          max="5"
          placeholder="Dificultad (1-5)"
          value={filters.nivelDificultad}
          onChange={(e) => setFilters((prev) => ({ ...prev, nivelDificultad: e.target.value, page: 1 }))}
        />
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, oposicionId: '', materiaId: '', temaId: '', nivelDificultad: '', page: 1 }))}
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
        <input
          placeholder="Tema ID *"
          value={form.temaId}
          required
          onChange={(e) => setForm({ ...form, temaId: e.target.value })}
        />
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

      {msg && <p className="success" style={{ color: 'green', marginTop: '0.75rem' }}>{msg}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}