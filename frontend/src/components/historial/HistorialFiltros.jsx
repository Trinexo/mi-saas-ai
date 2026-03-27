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
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.75rem 0 1rem', flexWrap: 'wrap' }}>
      <select value={modoFiltro} onChange={(e) => setModoFiltro(e.target.value)}>
        <option value="todos">Todos los modos</option>
        <option value="adaptativo">Adaptativo</option>
        <option value="normal">Normal</option>
        <option value="repaso">Repaso</option>
        <option value="refuerzo">Refuerzo</option>
        <option value="simulacro">Simulacro</option>
        <option value="marcadas">Marcadas</option>
      </select>

      <select value={oposicionId} onChange={(e) => { setOposicionId(e.target.value); onResetPage(); }}>
        <option value="">Todas las oposiciones</option>
        {oposiciones.map((op) => (
          <option key={op.id} value={String(op.id)}>{op.nombre}</option>
        ))}
      </select>

      <input
        type="text"
        value={textoFiltro}
        onChange={(e) => setTextoFiltro(e.target.value)}
        placeholder="Buscar por oposición, materia o tema"
        style={{ minWidth: 260 }}
      />

      <select value={notaFiltro} onChange={(e) => setNotaFiltro(e.target.value)}>
        <option value="todas">Todas las notas</option>
        <option value="aprobados">Aprobados (≥5)</option>
        <option value="suspensos">Suspensos (&lt;5)</option>
      </select>

      <select value={periodoFiltro} onChange={(e) => { setPeriodoFiltro(e.target.value); onResetPage(); }}>
        <option value="7d">Últimos 7 días</option>
        <option value="30d">Últimos 30 días</option>
        <option value="todo">Todo</option>
      </select>

      <select value={ordenFiltro} onChange={(e) => setOrdenFiltro(e.target.value)}>
        <option value="fecha_desc">Fecha (reciente primero)</option>
        <option value="nota_desc">Nota (alta primero)</option>
      </select>

      <select value={erroresFiltro} onChange={(e) => setErroresFiltro(e.target.value)}>
        <option value="todos">Errores: todos</option>
        <option value="con">Con errores</option>
        <option value="sin">Sin errores</option>
      </select>

      <select value={duracionFiltro} onChange={(e) => setDuracionFiltro(e.target.value)}>
        <option value="todos">Duración: todos</option>
        <option value="cortos">Cortos (&lt;10 min)</option>
        <option value="medios">Medios (10–30 min)</option>
        <option value="largos">Largos (&gt;30 min)</option>
      </select>

      <select value={blancosFiltro} onChange={(e) => setBlancosFiltro(e.target.value)}>
        <option value="todos">Blancos: todos</option>
        <option value="con">Con blancos</option>
        <option value="sin">Sin blancos</option>
      </select>

      <select value={ritmoFiltro} onChange={(e) => setRitmoFiltro(e.target.value)}>
        <option value="todos">Ritmo: todos</option>
        <option value="rapidos">Rápidos (&lt;45s/pregunta)</option>
        <option value="medios">Medios (45–90s/pregunta)</option>
        <option value="pausados">Pausados (&gt;90s/pregunta)</option>
      </select>

      <select value={consistenciaFiltro} onChange={(e) => setConsistenciaFiltro(e.target.value)}>
        <option value="todos">Constancia diaria: todos</option>
        <option value="alta">Alta (≥3 tests en el día)</option>
        <option value="media">Media (2 tests en el día)</option>
        <option value="baja">Baja (1 test en el día)</option>
      </select>

      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
        Mostrando {filtradosCount} de {totalCount}
      </span>
    </div>
  );
}
