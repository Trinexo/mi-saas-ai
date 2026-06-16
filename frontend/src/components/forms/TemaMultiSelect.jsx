import { useEffect, useMemo, useRef, useState } from 'react';

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

const P = '#7c3aed';

const normalizeValues = (items = []) => [...new Set(items.map((item) => String(item)).filter(Boolean))];

export default function TemaMultiSelect({
  options = [],
  selectedValues = [],
  disabled = false,
  onToggle,
  placeholder = 'Selecciona uno o varios temas',
  emptyText = 'No hay temas disponibles',
  maxHeight = 260,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedSelected = useMemo(() => normalizeValues(selectedValues), [selectedValues]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  if (!options.length) {
    return (
      <div style={{ ...INPUT, minHeight: 46, display: 'flex', alignItems: 'center', color: '#9ca3af', opacity: .8 }}>
        {emptyText}
      </div>
    );
  }

  const selectedOptions = options.filter((option) => normalizedSelected.includes(String(option.value)));
  const summaryText = selectedOptions.length === 0
    ? placeholder
    : selectedOptions.length <= 2
      ? selectedOptions.map((option) => option.label).join(' | ')
      : `${selectedOptions.length} temas seleccionados`;

  return (
    <div ref={rootRef} style={{ position: 'relative', opacity: disabled ? .6 : 1 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        style={{
          ...INPUT,
          minHeight: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: selectedOptions.length ? '#111827' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selectedOptions.length ? 600 : 400 }}>
          {summaryText}
        </span>
        <span style={{ color: '#64748b', flexShrink: 0, fontSize: '.78rem', fontWeight: 700 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 20,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          boxShadow: '0 10px 30px rgba(15,23,42,.12)',
          padding: 10,
          maxHeight,
          overflowY: 'auto',
          display: 'grid',
          gap: 8,
        }}>
          {options.map((option) => {
            const checked = normalizedSelected.includes(String(option.value));
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: `1px solid ${checked ? '#c4b5fd' : '#e5e7eb'}`,
                  background: checked ? '#f5f3ff' : '#fff',
                  borderRadius: 8,
                  padding: '9px 10px',
                  fontSize: '.82rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                }}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(option.value)} style={{ accentColor: P }} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
