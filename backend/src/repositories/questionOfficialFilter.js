export function appendOfficialQuestionFilter({ officialidad = 'all', anio = null, anioIds = [], examenId = null } = {}, params, placeholderStart = params.length + 1) {
  const clauses = [];
  if (officialidad === 'official') {
    clauses.push(`EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id)`);
  } else if (officialidad === 'non_official') {
    clauses.push(`NOT EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id)`);
  }
  if (anioIds?.length) {
    params.push(anioIds);
    clauses.push(`EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id AND pao.oposicion_anio_id = ANY($${placeholderStart}::bigint[]))`);
  } else if (anio != null) {
    params.push(anio);
    clauses.push(`EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao JOIN oposiciones_anios_oficiales oao ON oao.id = pao.oposicion_anio_id WHERE pao.pregunta_id = p.id AND oao.anio = $${placeholderStart})`);
  }
  if (examenId != null) {
    params.push(examenId);
    const yearOffset = (anioIds?.length || anio != null) ? 1 : 0;
    clauses.push(`EXISTS (SELECT 1 FROM examenes_oficiales_preguntas eop WHERE eop.pregunta_id = p.id AND eop.examen_id = $${placeholderStart + yearOffset})`);
  }
  return clauses.length ? ` AND ${clauses.join(' AND ')}` : '';
}
