import { Link } from 'react-router-dom';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };

export default function HistorialTabla({ itemsOrdenados, onReintentar }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Modo</th>
            <th>Oposición</th>
            <th>Materia/Tema</th>
            <th>Resultado</th>
            <th>Nota</th>
            <th>Revisión</th>
            <th>Reintentar</th>
          </tr>
        </thead>
        <tbody>
          {itemsOrdenados.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.fecha).toLocaleDateString('es-ES')}</td>
              <td>{MODO_LABEL[t.tipoTest] ?? t.tipoTest}</td>
              <td>
                {t.oposicionId
                  ? <Link to={`/oposicion/${t.oposicionId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{t.oposicionNombre}</Link>
                  : (t.oposicionNombre || '—')}
              </td>
              <td>
                {t.materiaNombre || '—'}
                {t.temaId
                  ? <> / <Link to={`/tema/${t.temaId}`} style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}>{t.temaNombre}</Link></>
                  : (t.temaNombre ? ` / ${t.temaNombre}` : '')}
              </td>
              <td>{t.aciertos}A · {t.errores}E · {t.blancos}B</td>
              <td><strong>{t.nota}</strong></td>
              <td><Link to={`/revision/${t.id}`}>Ver</Link></td>
              <td><button onClick={() => onReintentar(t.id)}>Reintentar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
