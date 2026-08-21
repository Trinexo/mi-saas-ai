import { useEffect, useState } from 'react';
import { examenesOficialesApi } from '../../services/examenesOficialesApi';
import { getErrorMessage } from '../../services/api';

export default function OfficialYearsSelector({ token, oposicionId, official = false, selectedIds = [], onChange, onOfficialChange }) {
  const [years, setYears] = useState([]);
  const [newYear, setNewYear] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!oposicionId) {
      setYears([]);
      return [];
    }
    const data = await examenesOficialesApi.getAnios(token, oposicionId);
    const rows = Array.isArray(data) ? data : (data?.data ?? []);
    setYears(rows);
    return rows;
  };

  useEffect(() => {
    setError('');
    load().catch((e) => {
      setYears([]);
      setError(getErrorMessage(e, 'No se pudieron cargar los años oficiales'));
    });
  // load only depends on the current token and opposition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, oposicionId]);

  const toggle = (id) => {
    const value = String(id);
    onChange(selectedIds.map(String).includes(value)
      ? selectedIds.filter((current) => String(current) !== value)
      : [...selectedIds, value]);
  };

  const addYear = async () => {
    const rawValue = String(newYear).trim();
    const value = Number(rawValue);
    if (!oposicionId) {
      setError('Selecciona una oposición antes de añadir un año');
      return;
    }
    if (!/^\d{4}$/.test(rawValue) || !Number.isInteger(value) || value < 1900 || value > 2200) {
      setError('El año debe ser un número entre 1900 y 2200');
      return;
    }
    try {
      setError('');
      setSaving(true);
      const created = await examenesOficialesApi.createAnio(token, oposicionId, value);
      const year = created?.id ? created : created?.data;
      if (!year?.id || String(year.oposicion_id) !== String(oposicionId)) {
        throw new Error('La API no devolvió el año oficial creado');
      }
      const rows = await load();
      const selectedYear = rows.find((row) => String(row.id) === String(year.id)) ?? year;
      const nextIds = selectedIds.map(String);
      if (!nextIds.includes(String(selectedYear.id))) nextIds.push(String(selectedYear.id));
      onChange(nextIds);
      setNewYear('');
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo añadir el año'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600, fontSize: '.85rem' }}>
        <input type="checkbox" checked={official} onChange={(e) => { onOfficialChange?.(e.target.checked); if (!e.target.checked) onChange([]); }} />
        Es pregunta oficial
      </label>
      {official && (
        <>
          <p style={{ margin: '8px 0 4px', fontSize: '.8rem', color: '#4b5563' }}>Años en los que apareció</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {years.map((year) => (
              <label key={year.id} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '.8rem' }}>
                <input type="checkbox" checked={selectedIds.map(String).includes(String(year.id))} onChange={() => toggle(year.id)} />
                {year.anio}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input type="number" min="1900" max="2200" placeholder="Nuevo año" value={newYear} onChange={(e) => setNewYear(e.target.value)} style={{ padding: 6, width: 110 }} />
            <button type="button" onClick={addYear} disabled={saving} style={{ padding: '4px 8px' }}>
              {saving ? 'Añadiendo…' : '+ Añadir año'}
            </button>
          </div>
          {error && <small role="alert" style={{ color: '#b91c1c' }}>{error}</small>}
        </>
      )}
    </div>
  );
}
