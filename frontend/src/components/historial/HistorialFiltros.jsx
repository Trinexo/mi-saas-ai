import { useState } from 'react';

const SEL = { padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff' };

export default function HistorialFiltros({
  oposiciones,
  modoFiltro, setModoFiltro,
  oposicionId, setOposicionId,
  textoFiltro, setTextoFiltro,
  notaFiltro, setNotaFiltro,
  periodoFiltro, setPeriodoFiltro,
  ordenFiltro, setOrdenFiltro,
  erroresFiltro, setErroresFiltro,
  duracionFiltro, setDuracionFiltro,
  blancosFiltro, setBlancosFiltro,
  ritmoFiltro, setRitmoFiltro,
  consistenciaFiltro, setConsistenciaFiltro,
  filtradosCount,
  totalCount,
  onResetPage,
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {/* Filtros principales */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <select style={SEL} value={periodoFiltro} onChange={(e) => { setPeriodoFiltro(e.target.value); onResetPage(); }}>
          <option value="7d">&Uacute;ltimos 7 d&iacute;as</option>
          <option value="30d">&Uacute;ltimos 30 d&iacute;as</option>
          <option value="todo">Todo el historial</option>
        </select>
        <select style={SEL} value={modoFiltro} onChange={(e) => { setModoFiltro(e.target.value); onResetPage(); }}>
          <option value="todos">Todos los modos</option>
          <option value="adaptativo">Adaptativo</option>
          <option value="normal">Normal</option>
          <option value="repaso">Repaso</option>
          <option value="refuerzo">Refuerzo</option>
          <option value="simulacro">Simulacro</option>
          <option value="marcadas">Marcadas</option>
        </select>
        <select style={SEL} value={oposicionId} onChange={(e) => { setOposicionId(e.target.value); onResetPage(); }}>
          <option value="">Todas las oposiciones</option>
          {oposiciones.map((op) => (
            <option key={op.id} value={String(op.id)}>{op.nombre}</option>
          ))}
        </select>
        <select style={SEL} value={notaFiltro} onChange={(e) => { setNotaFiltro(e.target.value); onResetPage(); }}>
          <option value="todas">Todas las notas</option>
          <option value="aprobados">Aprobados (&ge;5)</option>
          <option value="suspensos">Suspensos (&lt;5)</option>
        </select>
        <select style={SEL} value={ordenFiltro} onChange={(e) => setOrdenFiltro(e.target.value)}>
          <option value="fecha_desc">M&aacute;s reciente primero</option>
          <option value="nota_desc">Mejor nota primero</option>
        </select>
        <input
          type="text"
          value={textoFiltro}
          onChange={(e) => { setTextoFiltro(e.target.value); onResetPage(); }}
          placeholder="Buscar por oposici&oacute;n, materia o tema&hellip;"
          style={{ ...SEL, minWidth: 220 }}
        />
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: expanded ? '#f1f5f9' : '#fff', fontSize: 13, color: '#64748b', cursor: 'pointer' }}
        >
          {expanded ? 'Menos filtros \u25b2' : 'M\u00e1s filtros \u25bc'}
        </button>
      </div>

      {/* Filtros avanzados colapsables */}
      {expanded && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <select style={SEL} value={erroresFiltro} onChange={(e) => { setErroresFiltro(e.target.value); onResetPage(); }}>
            <option value="todos">Errores: todos</option>
            <option value="con">Con errores</option>
            <option value="sin">Sin errores</option>
          </select>
          <select style={SEL} value={blancosFiltro} onChange={(e) => { setBlancosFiltro(e.target.value); onResetPage(); }}>
            <option value="todos">Blancos: todos</option>
            <option value="con">Con blancos</option>
            <option value="sin">Sin blancos</option>
          </select>
          <select style={SEL} value={duracionFiltro} onChange={(e) => { setDuracionFiltro(e.target.value); onResetPage(); }}>
            <option value="todos">Duraci\u00f3n: todos</option>
            <option value="cortos">Cortos (&lt;10 min)</option>
            <option value="medios">Medios (10\u201330 min)</option>
            <option value="largos">Largos (&gt;30 min)</option>
          </select>
          <select style={SEL} value={ritmoFiltro} onChange={(e) => { setRitmoFiltro(e.target.value); onResetPage(); }}>
            <option value="todos">Ritmo: todos</option>
            <option value="rapidos">R\u00e1pidos (&lt;45s/preg)</option>
            <option value="medios">Medios (45\u201390s/preg)</option>
            <option value="pausados">Pausados (&gt;90s/preg)</option>
          </select>
          <select style={SEL} value={consistenciaFiltro} onChange={(e) => { setConsistenciaFiltro(e.target.value); onResetPage(); }}>
            <option value="todos">Constancia: todos</option>
            <option value="alta">Alta (\u22653 tests/d\u00eda)</option>
            <option value="media">Media (2 tests/d\u00eda)</option>
            <option value="baja">Baja (1 test/d\u00eda)</option>
          </select>
        </div>
      )}

      {/* Contador */}
      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>
        Mostrando <strong style={{ color: '#374151' }}>{filtradosCount}</strong> de {totalCount} tests
      </p>
    </div>
  );
}
