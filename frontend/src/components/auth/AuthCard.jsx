export default function AuthCard({ children }) {
  return (
    <div className="auth-screen">
      <div className="auth-logo-area">
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: 'var(--orange)' }}>▷</span> AlbacerTest
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>Plataforma de preparación para oposiciones</p>
      </div>
      <div className="auth-card-box">{children}</div>
    </div>
  );
}
