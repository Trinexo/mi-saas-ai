import { Link } from 'react-router-dom';

export const P = '#6d28d9';
export const G = '#10b981';
export const B = '#2563eb';
export const R = '#ef4444';
export const A = '#f59e0b';
export const CARD = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 28px rgba(15,23,42,.04)',
};

export function PageShell({ children }) {
  return <div style={{ width: '100%', maxWidth: 1480, margin: '0 auto' }}>{children}</div>;
}

export function Header({ title, subtitle, action, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: 0 }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.88rem' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {children}
        {action}
      </div>
    </div>
  );
}

export function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ height: 38, minWidth: 240, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: '0 12px', color: '#0f172a', fontSize: '.82rem' }}>
      {children}
    </select>
  );
}

export function Button({ to, children, variant = 'primary', onClick, disabled = false }) {
  const style = {
    height: 38,
    borderRadius: 8,
    border: variant === 'primary' ? 'none' : '1px solid #e5e7eb',
    background: variant === 'primary' ? P : '#fff',
    color: variant === 'primary' ? '#fff' : '#334155',
    padding: '0 14px',
    fontWeight: 800,
    fontSize: '.82rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    boxShadow: variant === 'primary' ? '0 10px 20px rgba(109,40,217,.18)' : 'none',
  };
  if (to) return <Link to={to} style={style}>{children}</Link>;
  return <button type="button" disabled={disabled} onClick={onClick} style={style}>{children}</button>;
}

export function KpiCard({ label, value, delta, color = P, to }) {
  const content = (
    <div style={{ ...CARD, padding: 16, minHeight: 94 }}>
      <div style={{ color: '#64748b', fontSize: '.75rem', fontWeight: 800, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{value}</div>
      {delta && <div style={{ color, fontSize: '.72rem', fontWeight: 800, marginTop: 10 }}>{delta}</div>}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

export function Panel({ title, subtitle, children, action, style }) {
  return (
    <section style={{ ...CARD, padding: 18, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            {title && <h2 style={{ margin: 0, color: '#0f172a', fontSize: '.95rem', fontWeight: 900 }}>{title}</h2>}
            {subtitle && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.78rem' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Progress({ value, color = P }) {
  return (
    <div style={{ height: 7, background: '#eef2f7', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: color, borderRadius: 99 }} />
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
      <div style={{ fontWeight: 900, color: '#475569', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '.84rem' }}>{text}</div>
    </div>
  );
}
