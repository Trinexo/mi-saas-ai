export default function MateriaMaestriaBar({ maestriaGlobal, colorGlobal }) {
  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Maestría global</span>
        <span style={{ fontWeight: 800, fontSize: 20, color: colorGlobal }}>{maestriaGlobal}%</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${maestriaGlobal}%`, height: '100%', background: colorGlobal, borderRadius: 999, transition: 'width .4s' }} />
      </div>
    </section>
  );
}
