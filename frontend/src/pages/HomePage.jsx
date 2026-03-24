import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { authApi } from '../services/authApi';
import { catalogApi } from '../services/catalogApi';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { token, user, refreshUser } = useAuth();
  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repasoPendiente, setRepasoPendiente] = useState(null);
  const [racha, setRacha] = useState(null);
  const [objetivoDiario, setObjetivoDiario] = useState(null);
  const [gamificacion, setGamificacion] = useState(null);
  const [recomendado, setRecomendado] = useState(null);
  const [focoHoy, setFocoHoy] = useState(null);
  const [resumenSemana, setResumenSemana] = useState(null);
  const [actividad14, setActividad14] = useState(null);
  const [temasDebiles, setTemasDebiles] = useState([]);
  const [insightMensual, setInsightMensual] = useState(null);
  const [rendimientoModos, setRendimientoModos] = useState([]);
  const [progresoSemanal, setProgresoSemanal] = useState(null);
  const [eficienciaTiempo, setEficienciaTiempo] = useState(null);
  const [consistenciaDiaria, setConsistenciaDiaria] = useState(null);
  const [ritmoPregunta, setRitmoPregunta] = useState(null);
  const [balancePrecision, setBalancePrecision] = useState(null);
  const [selectorOposicionId, setSelectorOposicionId] = useState('');
  const [savingOposicion, setSavingOposicion] = useState(false);
  const [selection, setSelection] = useState({ oposicionId: '', materiaId: '', temaId: '', numeroPreguntas: 10, modo: 'adaptativo', dificultad: 'mixto' });
  const [oposicionCompleta, setOposicionCompleta] = useState(false);
  const [simulacro, setSimulacro] = useState({ oposicionId: '', numeroPreguntas: 60, duracion: '' });
  const { error, isLoading, clearError, runAction, setErrorMessage } = useAsyncAction();

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getOposiciones()
      .then(async (ops) => {
        if (cancelled) return;
        setOposiciones(ops);
        // Autoseleccionar oposición preferida del perfil (ya disponible en contexto)
        const prefId = user?.oposicionPreferidaId;
        if (prefId && !cancelled) {
          const prefIdStr = String(prefId);
          setSelection((prev) => ({ ...prev, oposicionId: prefIdStr }));
          const materias = await catalogApi.getMaterias(prefIdStr);
          if (!cancelled) setMaterias(materias);
        }
      })
      .catch((e) => setErrorMessage(e, 'No se pudo cargar el catálogo'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    testApi.getRepasoPendientes(token, 20)
      .then((data) => setRepasoPendiente(data))
      .catch(() => setRepasoPendiente({ totalPendientes: 0, temaIdSugerido: null, items: [] }));
  }, [token]);

  useEffect(() => {
    testApi.getRacha(token)
      .then((data) => setRacha(data))
      .catch(() => setRacha({ rachaActual: 0, mejorRacha: 0, estudioHoy: false, actividad7Dias: [] }));
  }, [token]);

  useEffect(() => {
    testApi.getObjetivoDiario(token)
      .then((data) => setObjetivoDiario(data))
      .catch(() => setObjetivoDiario({ objetivoPreguntasDia: 10, preguntasRespondidasHoy: 0, porcentajeCumplido: 0, cumplido: false }));
  }, [token]);

  useEffect(() => {
    testApi.getGamificacion(token)
      .then((data) => setGamificacion(data))
      .catch(() => setGamificacion({ xpTotal: 0, nivelActual: 1, xpSiguienteNivel: 100, progresoNivel: 0 }));
  }, [token]);

  useEffect(() => {
    testApi.getRecommended(token)
      .then((data) => setRecomendado(data))
      .catch(() => setRecomendado({ modo: 'adaptativo', temaId: null, numeroPreguntas: 10, motivo: 'Empieza con un test rápido de 10 preguntas' }));
  }, [token]);

  useEffect(() => {
    testApi.getFocoHoy(token)
      .then((data) => setFocoHoy(data))
      .catch(() => setFocoHoy({ modo: 'adaptativo', temaId: null, numeroPreguntas: 10, motivo: 'Empieza con un test rápido de 10 preguntas' }));
  }, [token]);

  useEffect(() => {
    testApi.getResumenSemana(token)
      .then((data) => setResumenSemana(data))
      .catch(() => setResumenSemana({ testsUltimos7Dias: 0, notaMediaUltimos7Dias: 0, tiempoMedioSegundosUltimos7Dias: 0, aciertosTotalesUltimos7Dias: 0 }));
  }, [token]);

  useEffect(() => {
    testApi.getActividad14Dias(token)
      .then((data) => setActividad14(data))
      .catch(() => setActividad14({ diasActivos14: 0, estudioHoy: false, actividad14Dias: [] }));
  }, [token]);

  useEffect(() => {
    testApi.getTemasDebiles(token)
      .then((data) => setTemasDebiles(Array.isArray(data) ? data : []))
      .catch(() => setTemasDebiles([]));
  }, [token]);

  useEffect(() => {
    testApi.getInsightMensual(token)
      .then((data) => setInsightMensual(data))
      .catch(() => setInsightMensual({ testsUltimos30Dias: 0, aciertosUltimos30Dias: 0, notaMediaUltimos30Dias: 0, deltaNota7Dias: 0, tendencia: 'estable' }));
  }, [token]);

  useEffect(() => {
    testApi.getRendimientoModos(token)
      .then((data) => setRendimientoModos(Array.isArray(data) ? data : []))
      .catch(() => setRendimientoModos([]));
  }, [token]);

  useEffect(() => {
    testApi.getProgresoSemanal(token)
      .then((data) => setProgresoSemanal(data))
      .catch(() => setProgresoSemanal({ dias: [], testsSemana: 0, notaMediaSemana: 0 }));
  }, [token]);

  useEffect(() => {
    testApi.getEficienciaTiempo(token)
      .then((data) => setEficienciaTiempo(data))
      .catch(() => setEficienciaTiempo({ tiempoMedioPorTestSegundos: 0, aciertosPorMinuto: 0, testsAnalizados: 0, tendenciaTiempo: 'estable' }));
  }, [token]);

  useEffect(() => {
    testApi.getConsistenciaDiaria(token)
      .then((data) => setConsistenciaDiaria(data))
      .catch(() => setConsistenciaDiaria({ diasActivos30: 0, diasInactivos30: 30, porcentajeConstancia: 0, tendenciaConstancia: 'estable' }));
  }, [token]);

  useEffect(() => {
    testApi.getRitmoPregunta(token)
      .then((data) => setRitmoPregunta(data))
      .catch(() => setRitmoPregunta({ segundosMediosPorPregunta: 0, preguntasAnalizadas: 0, testsAnalizados: 0, tendenciaRitmo: 'estable' }));
  }, [token]);

  useEffect(() => {
    testApi.getBalancePrecision(token)
      .then((data) => setBalancePrecision(data))
      .catch(() => setBalancePrecision({ aciertosTotales: 0, erroresTotales: 0, blancosTotales: 0, porcentajeAcierto: 0, porcentajeError: 0, porcentajeBlanco: 0 }));
  }, [token]);

  const onGuardarOposicionPreferida = async () => {
    if (!selectorOposicionId) return;
    setSavingOposicion(true);
    try {
      const res = await authApi.patchOposicionPreferida(token, Number(selectorOposicionId));
      if (res?.data) refreshUser(res.data);
    } finally {
      setSavingOposicion(false);
    }
  };

  const onOposicion = async (id) => {
    setSelection({ ...selection, oposicionId: id, materiaId: '', temaId: '' });
    setMaterias([]);
    setTemas([]);
    clearError();
    if (!id) return;
    try {
      const data = await catalogApi.getMaterias(id);
      setMaterias(data);
    } catch (e) {
      setErrorMessage(e, 'No se pudieron cargar las materias');
    }
  };

  const onMateria = async (id) => {
    setSelection({ ...selection, materiaId: id, temaId: '' });
    setTemas([]);
    clearError();
    if (!id) return;
    try {
      const data = await catalogApi.getTemas(id);
      setTemas(data);
    } catch (e) {
      setErrorMessage(e, 'No se pudieron cargar los temas');
    }
  };

  const onGenerate = async () => {
    clearError();

    const numeroPreguntas = Number(selection.numeroPreguntas);
    if (!Number.isInteger(numeroPreguntas) || numeroPreguntas < 1 || numeroPreguntas > 100) {
      setErrorMessage('Indica un número de preguntas entre 1 y 100');
      return;
    }

    const payload = { numeroPreguntas, modo: selection.modo, dificultad: selection.dificultad };
    if (selection.modo !== 'marcadas') {
      if (oposicionCompleta && selection.oposicionId && !selection.temaId) {
        payload.oposicionId = Number(selection.oposicionId);
      } else {
        payload.temaId = Number(selection.temaId);
      }
    }

    const test = await runAction(() => testApi.generate(token, payload));

    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onGenerateSimulacro = async () => {
    clearError();

    const numeroPreguntasSimulacro = Number(simulacro.numeroPreguntas);
    if (!Number.isInteger(numeroPreguntasSimulacro) || numeroPreguntasSimulacro < 1 || numeroPreguntasSimulacro > 200) {
      setErrorMessage('Indica un número de preguntas entre 1 y 200');
      return;
    }

    const payload = {
      oposicionId: Number(simulacro.oposicionId),
      numeroPreguntas: numeroPreguntasSimulacro,
      modo: 'simulacro',
    };

    if (simulacro.duracion) {
      const mins = Number(simulacro.duracion);
      if (!Number.isInteger(mins) || mins < 1 || mins > 300) {
        setErrorMessage('La duración debe estar entre 1 y 300 minutos');
        return;
      }
      payload.duracionSegundos = mins * 60;
    }

    const test = await runAction(() => testApi.generate(token, payload));

    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onGenerateRefuerzo = async () => {
    clearError();

    const numeroPreguntas = Number(selection.numeroPreguntas);
    if (!Number.isInteger(numeroPreguntas) || numeroPreguntas < 1 || numeroPreguntas > 100) {
      setErrorMessage('Indica un número de preguntas entre 1 y 100');
      return;
    }

    const payload = { numeroPreguntas };
    if (selection.temaId) {
      payload.temaId = Number(selection.temaId);
    }

    const test = await runAction(() => testApi.generateRefuerzo(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onStartRepasoPendiente = async () => {
    clearError();

    const temaId = repasoPendiente?.temaIdSugerido;
    const totalPendientes = Number(repasoPendiente?.totalPendientes || 0);

    if (!temaId || totalPendientes < 1) {
      setErrorMessage('No tienes repaso pendiente hoy');
      return;
    }

    const payload = {
      modo: 'repaso',
      temaId,
      numeroPreguntas: Math.min(20, Math.max(5, totalPendientes)),
      dificultad: 'mixto',
    };

    const test = await runAction(() => testApi.generate(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onStartRecommended = async () => {
    clearError();

    const suggestion = await runAction(() => testApi.getRecommended(token));
    if (!suggestion) return;

    setRecomendado(suggestion);

    let test;
    if (suggestion.modo === 'refuerzo') {
      const payloadRefuerzo = { numeroPreguntas: Number(suggestion.numeroPreguntas || 10) };
      if (suggestion.temaId) payloadRefuerzo.temaId = Number(suggestion.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, payloadRefuerzo));
    } else {
      const payload = {
        modo: suggestion.modo || 'adaptativo',
        numeroPreguntas: Number(suggestion.numeroPreguntas || 10),
        dificultad: suggestion.dificultad || 'mixto',
      };
      if (suggestion.temaId) payload.temaId = Number(suggestion.temaId);
      if (suggestion.oposicionId) payload.oposicionId = Number(suggestion.oposicionId);

      test = await runAction(() => testApi.generate(token, payload));
    }

    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onStartFocoHoy = async () => {
    clearError();

    const foco = await runAction(() => testApi.getFocoHoy(token));
    if (!foco) return;

    setFocoHoy(foco);

    let test;
    if (foco.modo === 'refuerzo') {
      const payloadRefuerzo = { numeroPreguntas: Number(foco.numeroPreguntas || 10) };
      if (foco.temaId) payloadRefuerzo.temaId = Number(foco.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, payloadRefuerzo));
    } else {
      const payload = {
        modo: foco.modo || 'adaptativo',
        numeroPreguntas: Number(foco.numeroPreguntas || 10),
        dificultad: 'mixto',
      };
      if (foco.temaId) payload.temaId = Number(foco.temaId);
      test = await runAction(() => testApi.generate(token, payload));
    }

    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onRefuerzoTemaDebil = async () => {
    clearError();
    const topTemaDebil = temasDebiles[0];
    if (!topTemaDebil?.temaId) {
      setErrorMessage('Todavía no hay datos suficientes para recomendar refuerzo por tema');
      return;
    }

    const test = await runAction(() => testApi.generateRefuerzo(token, { temaId: Number(topTemaDebil.temaId), numeroPreguntas: 10 }));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  if (loading) return <p>Cargando catálogo...</p>;
  if (error) return <p className="error">{error}</p>;

  const diasActivos7 = racha?.actividad7Dias?.filter((d) => d.activo).length || 0;
  const faltanObjetivo = Math.max(0, Number(objetivoDiario?.objetivoPreguntasDia || 10) - Number(objetivoDiario?.preguntasRespondidasHoy || 0));
  const xpNivelBase = Math.max(0, (Number(gamificacion?.nivelActual || 1) - 1) * 100);
  const xpEnNivel = Math.max(0, Number(gamificacion?.xpTotal || 0) - xpNivelBase);
  const tiempoMedioMinSemana = Math.round(Number(resumenSemana?.tiempoMedioSegundosUltimos7Dias || 0) / 60);

  return (
    <>
      {!user?.oposicionPreferidaId && (
        <section className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h2>Configura tu oposición</h2>
          <p className="hint">Selecciona la oposición a la que te preparas para personalizar tu experiencia.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
            <select
              value={selectorOposicionId}
              onChange={(e) => setSelectorOposicionId(e.target.value)}
              disabled={savingOposicion || oposiciones.length === 0}
            >
              <option value="">-- Selecciona oposición --</option>
              {oposiciones.map((op) => (
                <option key={op.id} value={String(op.id)}>{op.nombre}</option>
              ))}
            </select>
            <button
              onClick={onGuardarOposicionPreferida}
              disabled={savingOposicion || !selectorOposicionId}
            >
              {savingOposicion ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Test recomendado</h2>
        <button disabled={isLoading} onClick={onStartRecommended}>
          {isLoading ? 'Generando...' : 'Hacer test ahora'}
        </button>
        <p className="hint" style={{ marginTop: '0.5rem' }}>
          {recomendado?.motivo || 'Empieza con un test rápido de 10 preguntas'}
        </p>
      </section>

      <section className="card">
        <h2>Foco de hoy</h2>
        <p className="hint" style={{ marginTop: '0.25rem' }}>{focoHoy?.motivo || 'Activa tu sesión con 10 preguntas'}</p>
        <button disabled={isLoading} onClick={onStartFocoHoy}>
          {isLoading ? 'Generando...' : 'Empezar foco'}
        </button>
      </section>

      <section className="card">
        <h2>Resumen semanal</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          {Number(resumenSemana?.testsUltimos7Dias || 0) === 0
            ? 'Aún no tienes actividad esta semana'
            : `Llevas ${resumenSemana?.testsUltimos7Dias || 0} tests esta semana, ¡buen ritmo!`}
        </p>
        <ul>
          <li>Tests (7 días): <strong>{resumenSemana?.testsUltimos7Dias || 0}</strong></li>
          <li>Nota media: <strong>{Number(resumenSemana?.notaMediaUltimos7Dias || 0).toFixed(2)}</strong></li>
          <li>Tiempo medio: <strong>{tiempoMedioMinSemana} min</strong></li>
          <li>Aciertos totales: <strong>{resumenSemana?.aciertosTotalesUltimos7Dias || 0}</strong></li>
        </ul>
      </section>

      <section className="card">
        <h2>Continuidad 14 días</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          Días activos: <strong>{actividad14?.diasActivos14 ?? 0}/14</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, marginBottom: '0.5rem' }}>
          {(actividad14?.actividad14Dias || []).map((dia) => (
            <div
              key={dia.fecha}
              title={`${dia.fecha}: ${dia.tests} test(s)`}
              style={{ height: 14, borderRadius: 4, background: dia.activo ? '#16a34a' : '#e5e7eb' }}
            />
          ))}
        </div>
        <p className="hint">
          {actividad14?.estudioHoy
            ? 'Hoy ya has sumado actividad ✅'
            : 'Haz un test rápido para mantener la racha'}
        </p>
      </section>

      <section className="card">
        <h2>Tema a reforzar</h2>
        {temasDebiles[0] ? (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              <strong>{temasDebiles[0].temaNombre}</strong> · {temasDebiles[0].materiaNombre} · {temasDebiles[0].oposicionNombre}
            </p>
            <p className="hint" style={{ marginTop: 0 }}>
              Acierto actual: {temasDebiles[0].porcentajeAcierto}% ({temasDebiles[0].aciertos}A · {temasDebiles[0].errores}E)
            </p>
            <button disabled={isLoading} onClick={onRefuerzoTemaDebil}>
              {isLoading ? 'Generando...' : 'Hacer refuerzo del tema'}
            </button>
          </>
        ) : (
          <p className="hint" style={{ marginTop: 0 }}>
            Aún no hay datos suficientes para identificar un tema débil.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Insight mensual</h2>
        <ul>
          <li>Tests (30 días): <strong>{insightMensual?.testsUltimos30Dias ?? 0}</strong></li>
          <li>Aciertos (30 días): <strong>{insightMensual?.aciertosUltimos30Dias ?? 0}</strong></li>
          <li>Nota media (30 días): <strong>{Number(insightMensual?.notaMediaUltimos30Dias ?? 0).toFixed(2)}</strong></li>
          <li>Delta nota 7d: <strong>{Number(insightMensual?.deltaNota7Dias ?? 0).toFixed(2)}</strong></li>
        </ul>
        <p className="hint" style={{ marginTop: 0 }}>
          {insightMensual?.tendencia === 'subiendo' && 'Tu nota va en tendencia positiva.'}
          {insightMensual?.tendencia === 'bajando' && 'Conviene reforzar temas débiles esta semana.'}
          {insightMensual?.tendencia === 'estable' && 'Mantén la constancia para subir tu media.'}
        </p>
      </section>

      <section className="card">
        <h2>Rendimiento por modo</h2>
        {rendimientoModos.length === 0 ? (
          <p className="hint" style={{ marginTop: 0 }}>Aún no hay datos suficientes por modo en los últimos 30 días.</p>
        ) : (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Mejor modo actual: <strong>{rendimientoModos[0].modo}</strong> (nota media {Number(rendimientoModos[0].notaMedia).toFixed(2)})
            </p>
            <div className="table-wrap" style={{ marginTop: '0.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Modo</th>
                    <th>Tests</th>
                    <th>Nota media</th>
                    <th>Aciertos</th>
                    <th>Errores</th>
                  </tr>
                </thead>
                <tbody>
                  {rendimientoModos.map((item) => (
                    <tr key={item.modo}>
                      <td>{item.modo}</td>
                      <td>{item.tests}</td>
                      <td>{Number(item.notaMedia).toFixed(2)}</td>
                      <td>{item.aciertosTotales}</td>
                      <td>{item.erroresTotales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Progreso semanal</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          Tests semana: <strong>{progresoSemanal?.testsSemana ?? 0}</strong> · Nota media: <strong>{Number(progresoSemanal?.notaMediaSemana ?? 0).toFixed(2)}</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: '0.5rem' }}>
          {(progresoSemanal?.dias || []).map((d) => {
            const intensity = Math.min(1, (Number(d.tests || 0) / 4));
            const alpha = 0.15 + (intensity * 0.75);
            return (
              <div
                key={d.fecha}
                title={`${d.fecha}: ${d.tests} test(s)`}
                style={{ height: 16, borderRadius: 4, background: `rgba(22, 163, 74, ${alpha})` }}
              />
            );
          })}
        </div>
        <p className="hint">
          {(progresoSemanal?.testsSemana ?? 0) === 0
            ? 'Empieza hoy con un test rápido.'
            : 'Has mantenido actividad esta semana.'}
        </p>
      </section>

      <section className="card">
        <h2>Eficiencia</h2>
        <ul>
          <li>Tests analizados: <strong>{eficienciaTiempo?.testsAnalizados ?? 0}</strong></li>
          <li>Tiempo medio/test: <strong>{Math.round(Number(eficienciaTiempo?.tiempoMedioPorTestSegundos ?? 0) / 60)} min</strong></li>
          <li>Aciertos por minuto: <strong>{Number(eficienciaTiempo?.aciertosPorMinuto ?? 0).toFixed(2)}</strong></li>
        </ul>
        <p className="hint" style={{ marginTop: 0 }}>
          {eficienciaTiempo?.tendenciaTiempo === 'mejorando' && 'Tu ritmo de resolución está mejorando.'}
          {eficienciaTiempo?.tendenciaTiempo === 'empeorando' && 'Tu tiempo medio ha subido; conviene practicar bloques cortos.'}
          {eficienciaTiempo?.tendenciaTiempo === 'estable' && 'Mantienes un ritmo estable de resolución.'}
        </p>
      </section>

      <section className="card">
        <h2>Consistencia diaria</h2>
        <ul>
          <li>Días activos (30): <strong>{consistenciaDiaria?.diasActivos30 ?? 0}</strong></li>
          <li>Días inactivos (30): <strong>{consistenciaDiaria?.diasInactivos30 ?? 30}</strong></li>
          <li>Constancia: <strong>{Number(consistenciaDiaria?.porcentajeConstancia ?? 0).toFixed(2)}%</strong></li>
        </ul>
        <p className="hint" style={{ marginTop: 0 }}>
          {consistenciaDiaria?.tendenciaConstancia === 'mejorando' && 'Tu constancia diaria está subiendo, sigue así.'}
          {consistenciaDiaria?.tendenciaConstancia === 'empeorando' && 'Recupera hábito con bloques cortos diarios.'}
          {consistenciaDiaria?.tendenciaConstancia === 'estable' && 'Mantienes un ritmo constante de estudio.'}
        </p>
      </section>

      <section className="card">
        <h2>Ritmo de resolución</h2>
        <ul>
          <li>Segundos por pregunta: <strong>{Number(ritmoPregunta?.segundosMediosPorPregunta ?? 0).toFixed(2)} s</strong></li>
          <li>Preguntas analizadas: <strong>{ritmoPregunta?.preguntasAnalizadas ?? 0}</strong></li>
          <li>Tests analizados: <strong>{ritmoPregunta?.testsAnalizados ?? 0}</strong></li>
        </ul>
        <p className="hint" style={{ marginTop: 0 }}>
          {ritmoPregunta?.tendenciaRitmo === 'mejorando' && 'Tu ritmo está mejorando, mantén la constancia.'}
          {ritmoPregunta?.tendenciaRitmo === 'empeorando' && 'Haz bloques más cortos para recuperar velocidad.'}
          {ritmoPregunta?.tendenciaRitmo === 'estable' && 'Ritmo estable, puedes subir intensidad progresivamente.'}
        </p>
      </section>

      <section className="card">
        <h2>Balance de precisión</h2>
        <ul>
          <li>Acierto: <strong>{Number(balancePrecision?.porcentajeAcierto ?? 0).toFixed(2)}%</strong> ({balancePrecision?.aciertosTotales ?? 0})</li>
          <li>Error: <strong>{Number(balancePrecision?.porcentajeError ?? 0).toFixed(2)}%</strong> ({balancePrecision?.erroresTotales ?? 0})</li>
          <li>Blanco: <strong>{Number(balancePrecision?.porcentajeBlanco ?? 0).toFixed(2)}%</strong> ({balancePrecision?.blancosTotales ?? 0})</li>
        </ul>
        <p className="hint" style={{ marginTop: 0 }}>
          {Number(balancePrecision?.porcentajeBlanco ?? 0) > 20 && 'Reduce blancos con tests más cortos.'}
          {Number(balancePrecision?.porcentajeBlanco ?? 0) <= 20 && Number(balancePrecision?.porcentajeError ?? 0) > 35 && 'Conviene reforzar conceptos clave.'}
          {Number(balancePrecision?.porcentajeBlanco ?? 0) <= 20 && Number(balancePrecision?.porcentajeError ?? 0) <= 35 && 'Buen equilibrio de respuesta.'}
        </p>
      </section>

      <section className="card">
        <h2>Tu nivel</h2>
        <p>
          Nivel <strong>{gamificacion?.nivelActual ?? 1}</strong> · <strong>{gamificacion?.xpTotal ?? 0} XP</strong>
        </p>
        <progress
          max={100}
          value={xpEnNivel}
          style={{ width: '100%' }}
        />
        <p className="hint" style={{ marginTop: '0.5rem' }}>
          Siguiente nivel: {gamificacion?.xpSiguienteNivel ?? 100} XP
        </p>
      </section>

      <section className="card">
        <h2>Objetivo de hoy</h2>
        {(() => {
          const respondidas = Number(objetivoDiario?.preguntasRespondidasHoy ?? 0);
          const objetivo = Number(objetivoDiario?.objetivoPreguntasDia ?? 10);
          const pct = Math.min(100, objetivo > 0 ? Math.round((respondidas / objetivo) * 100) : 0);
          const color = pct >= 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
          return (
            <>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 0.4rem' }}>
                <span><strong style={{ fontSize: '1.25rem' }}>{respondidas}</strong> / {objetivo} preguntas</span>
                <span style={{ fontWeight: 700, color }}>{pct}%</span>
              </p>
              <div style={{ background: '#e5e7eb', borderRadius: 999, height: 12, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
              </div>
              <p className="hint" style={{ marginTop: '0.5rem' }}>
                {objetivoDiario?.cumplido
                  ? '¡Objetivo del día completado! ✅'
                  : faltanObjetivo > 0
                    ? `Te faltan ${faltanObjetivo} preguntas para completar tu objetivo`
                    : 'Empieza un test para sumar progreso'}
              </p>
            </>
          );
        })()}
      </section>

      <section className="card">
        <h2>Tu racha</h2>
        <p>
          <strong>{racha?.rachaActual ?? 0} días</strong> seguidos
        </p>
        <p className="hint">
          Mejor racha: {racha?.mejorRacha ?? 0} días · Últimos 7 días activos: {diasActivos7}/7
        </p>
        <p className="hint">{racha?.estudioHoy ? 'Racha activa' : 'No rompas tu racha de estudio'}</p>
      </section>

      <section className="card">
        <h2>Repaso pendiente hoy</h2>
        <p className="hint">
          {repasoPendiente?.totalPendientes
            ? `Tienes ${repasoPendiente.totalPendientes} preguntas pendientes de repetición espaciada.`
            : 'No tienes preguntas pendientes hoy.'}
        </p>

        <button
          disabled={!repasoPendiente?.totalPendientes || isLoading}
          onClick={onStartRepasoPendiente}
        >
          {isLoading ? 'Generando...' : 'Empezar repaso'}
        </button>
      </section>

      <section className="card">
      <h2>Generar test</h2>
      <div className="form-grid">
        <select value={selection.oposicionId} onChange={(e) => onOposicion(e.target.value)} disabled={selection.modo === 'marcadas'}>
          <option value="">{selection.modo === 'marcadas' ? '(no aplica en modo marcadas)' : 'Selecciona oposición'}</option>
          {oposiciones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <select value={selection.materiaId} onChange={(e) => onMateria(e.target.value)} disabled={!selection.oposicionId || selection.modo === 'marcadas'}>
          <option value="">Selecciona materia</option>
          {materias.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <select value={selection.temaId} onChange={(e) => setSelection({ ...selection, temaId: e.target.value })} disabled={!selection.materiaId || selection.modo === 'marcadas'}>
          <option value="">Selecciona tema</option>
          {temas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          max="100"
          value={selection.numeroPreguntas}
          onChange={(e) => setSelection({ ...selection, numeroPreguntas: e.target.value })}
        />

        <select value={selection.modo} onChange={(e) => setSelection({ ...selection, modo: e.target.value })}>
          <option value="adaptativo">Adaptativo (prioriza fallos)</option>
          <option value="normal">Normal (preguntas nuevas)</option>
          <option value="repaso">Repaso (revisión espaciada)</option>
          <option value="marcadas">Desde preguntas marcadas</option>
        </select>

        <select
          value={selection.dificultad}
          onChange={(e) => setSelection({ ...selection, dificultad: e.target.value })}
          disabled={selection.modo === 'repaso' || selection.modo === 'marcadas'}
        >
          <option value="mixto">Mixto (40% media · 30% fácil · 30% difícil)</option>
          <option value="facil">Solo fácil</option>
          <option value="media">Solo media</option>
          <option value="dificil">Solo difícil</option>
        </select>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', userSelect: 'none', marginTop: 8 }}>
        <input
          type="checkbox"
          checked={oposicionCompleta}
          disabled={!selection.oposicionId || selection.modo === 'marcadas'}
          onChange={(e) => {
            setOposicionCompleta(e.target.checked);
            if (e.target.checked) setSelection((prev) => ({ ...prev, materiaId: '', temaId: '' }));
          }}
        />
        Oposición completa (sin filtrar por tema)
      </label>

      <button
        disabled={(selection.modo !== 'marcadas' && !selection.temaId && !(oposicionCompleta && selection.oposicionId)) || isLoading}
        onClick={onGenerate}
      >
        {isLoading ? 'Generando...' : 'Generar test'}
      </button>

      <button disabled={isLoading} onClick={onGenerateRefuerzo} style={{ marginLeft: '0.5rem' }}>
        {isLoading ? 'Generando...' : 'Hacer test de refuerzo'}
      </button>
    </section>

    <section className="card">
      <h2>Simulacro de examen</h2>
      <p className="hint">Preguntas proporcionales de toda la oposición. Opcionalmente con tiempo límite.</p>
      <div className="form-grid">
        <select
          value={simulacro.oposicionId}
          onChange={(e) => setSimulacro({ ...simulacro, oposicionId: e.target.value })}
        >
          <option value="">Selecciona oposición</option>
          {oposiciones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <label>
          Nº preguntas (máx. 200)
          <input
            type="number"
            min="1"
            max="200"
            value={simulacro.numeroPreguntas}
            onChange={(e) => setSimulacro({ ...simulacro, numeroPreguntas: e.target.value })}
          />
        </label>

        <label>
          Duración (min, opcional)
          <input
            type="number"
            min="1"
            max="300"
            placeholder="Sin límite"
            value={simulacro.duracion}
            onChange={(e) => setSimulacro({ ...simulacro, duracion: e.target.value })}
          />
        </label>
      </div>

      <button disabled={!simulacro.oposicionId || isLoading} onClick={onGenerateSimulacro}>
        {isLoading ? 'Generando...' : 'Iniciar simulacro'}
      </button>
    </section>
    </>
  );
}