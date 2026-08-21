import { useEffect, useRef, useState } from 'react';

export default function MultiSelectDropdown({
  label,
  options = [],
  selectedIds = [],
  onChange,
  renderLabel = (option) => option.label,
  disabled = false,
  placeholder = 'Seleccionar',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = new Set(selectedIds.map(String));
  const selectedOptions = options.filter((option) => selected.has(String(option.id)));
  const summary = selectedOptions.length === 0
    ? placeholder
    : selectedOptions.length === options.length && options.length > 0
      ? 'Todos'
      : selectedOptions.length === 1
        ? renderLabel(selectedOptions[0])
        : `${selectedOptions.length} seleccionados`;

  useEffect(() => {
    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggle = (id) => {
    const value = String(id);
    onChange(selected.has(value)
      ? selectedIds.filter((item) => String(item) !== value)
      : [...selectedIds, id]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>}
      <button type="button" disabled={disabled} onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox" aria-expanded={open}
        style={{ width: '100%', minHeight: 38, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: disabled ? '#f8fafc' : '#fff', color: selectedOptions.length ? '#111827' : '#9ca3af', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {summary}
      </button>
      {open && !disabled && (
        <div role="listbox" aria-label={label} style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, top: 'calc(100% + 4px)', maxHeight: 230, overflowY: 'auto', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', boxShadow: '0 8px 20px rgba(15,23,42,.12)' }}>
          {options.length === 0 && <div style={{ padding: 8, color: '#9ca3af', fontSize: '.8rem' }}>No hay opciones disponibles.</div>}
          {options.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: '2px 4px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
              <button type="button" onClick={() => onChange(options.map((option) => option.id))} style={{ border: 0, background: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '.75rem' }}>Seleccionar todos</button>
              <button type="button" onClick={() => onChange([])} style={{ border: 0, background: 'none', color: '#64748b', cursor: 'pointer', fontSize: '.75rem' }}>Deseleccionar todos</button>
            </div>
          )}
          {options.map((option) => (
            <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', fontSize: '.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.has(String(option.id))} onChange={() => toggle(option.id)} />
              <span>{renderLabel(option)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
