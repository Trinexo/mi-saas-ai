const CARD_STYLE = {
  maxWidth: 400,
  width: '100%',
  padding: '2.5rem 2rem',
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,.10)',
  border: '1px solid #e5e7eb',
  borderTop: '3px solid #1d4ed8',
};

export default function AuthCard({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: '#1d4ed8' }}>▷</span> AlbacerTest
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>Plataforma de preparación para oposiciones</p>
      </div>
      <div style={CARD_STYLE}>{children}</div>
    </div>
  );
}
