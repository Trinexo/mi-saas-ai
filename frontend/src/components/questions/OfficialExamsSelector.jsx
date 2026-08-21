import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { examenesOficialesApi } from '../../services/examenesOficialesApi';

const inputStyle = { padding: '0.4rem 0.55rem', border: '1px solid #e5e7eb', borderRadius: 6 };

export default function OfficialExamsSelector({ token, oposicionId, selectedYearIds, selectedExamIds = [], onChange }) {
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ anioId: '', nombre: '', convocatoria: '', fecha: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [years, setYears] = useState([]);
  const selected = useMemo(() => new Set(selectedExamIds.map(String)), [selectedExamIds]);

  useEffect(() => {
    if (!oposicionId || !selectedYearIds.length) {
      setExams([]);
      setYears([]);
      return;
    }
    let active = true;
    Promise.all([
      examenesOficialesApi.getAnios(token, oposicionId),
      examenesOficialesApi.listForOposicion(token, oposicionId, { anio_ids: selectedYearIds.join(',') }),
    ]).then(([yearRows, examRows]) => {
      if (!active) return;
      setYears((yearRows ?? []).filter((year) => selectedYearIds.includes(String(year.id))));
      const available = examRows ?? [];
      setExams(available);
      const availableIds = new Set(available.map((exam) => String(exam.id)));
      const compatible = selectedExamIds.map(String).filter((id) => availableIds.has(id));
      if (compatible.length !== selectedExamIds.length) onChange(compatible);
    }).catch((e) => { if (active) setError(getErrorMessage(e)); });
    return () => { active = false; };
  }, [token, oposicionId, selectedYearIds.join(',')]);

  if (!oposicionId || !selectedYearIds.length) return null;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(String(id))) next.delete(String(id)); else next.add(String(id));
    onChange([...next]);
  };

  const createExam = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.anioId || !form.nombre.trim()) { setError('Selecciona un año y escribe el nombre del examen'); return; }
    const year = years.find((item) => String(item.id) === String(form.anioId));
    if (!year) { setError('El año del examen debe estar seleccionado en la pregunta'); return; }
    setSaving(true);
    try {
      const exam = await examenesOficialesApi.create(token, {
        oposicionId, anio: year.anio, nombre: form.nombre.trim(),
        convocatoria: form.convocatoria.trim() || null, fecha: form.fecha || null,
      });
      setExams((current) => current.some((item) => String(item.id) === String(exam.id)) ? current : [exam, ...current]);
      onChange([...new Set([...selectedExamIds.map(String), String(exam.id)])]);
      setForm({ anioId: '', nombre: '', convocatoria: '', fecha: '' });
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  };

  return <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
    <strong style={{ fontSize: '.85rem' }}>Exámenes oficiales (opcional)</strong>
    {error && <div style={{ color: '#b91c1c', fontSize: '.8rem', marginTop: 6 }}>{error}</div>}
    <div style={{ display: 'grid', gap: 6, margin: '8px 0' }}>
      {exams.map((exam) => <label key={exam.id} style={{ fontSize: '.82rem' }}>
        <input type="checkbox" checked={selected.has(String(exam.id))} onChange={() => toggle(exam.id)} />{' '}
        {exam.nombre} ({exam.anio}{exam.convocatoria ? ` · ${exam.convocatoria}` : ''})
      </label>)}
      {!exams.length && <span style={{ fontSize: '.8rem', color: '#6b7280' }}>No hay exámenes para los años seleccionados.</span>}
    </div>
    <form onSubmit={createExam} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, .4fr) minmax(160px, 1fr) minmax(120px, .7fr) auto', gap: 6 }}>
      <select value={form.anioId} onChange={(e) => setForm({ ...form, anioId: e.target.value })} style={inputStyle}>
        <option value="">Año</option>{years.map((year) => <option key={year.id} value={year.id}>{year.anio}</option>)}
      </select>
      <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del examen" style={inputStyle} />
      <input value={form.convocatoria} onChange={(e) => setForm({ ...form, convocatoria: e.target.value })} placeholder="Convocatoria (opcional)" style={inputStyle} />
      <button type="submit" disabled={saving}>{saving ? 'Creando...' : '+ Añadir examen'}</button>
    </form>
  </section>;
}
