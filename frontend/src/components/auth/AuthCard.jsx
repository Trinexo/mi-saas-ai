const CARD_STYLE = {
  maxWidth: 400,
  margin: '4rem auto',
  padding: '2rem',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
};

export default function AuthCard({ children }) {
  return <div style={CARD_STYLE}>{children}</div>;
}
