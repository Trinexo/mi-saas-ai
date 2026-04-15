// Definición centralizada de planes, límites y permisos
// Referencia única para backend (middleware, services) y posible exposición al frontend

export const PLAN_ORDER = ['free', 'pro', 'elite'];

export const PLAN_LIMITS = {
  free: {
    maxPreguntasPorTest: 10,
    maxHistorial: 5,
    modesAllowed: ['adaptativo', 'normal', 'marcadas'],
    repasoEspaciado: false,
    refuerzo: false,
    simulacros: false,
    analiticasAvanzadas: false,
  },
  pro: {
    maxPreguntasPorTest: 200,
    maxHistorial: Infinity,
    modesAllowed: ['adaptativo', 'normal', 'marcadas', 'repaso', 'simulacro'],
    repasoEspaciado: true,
    refuerzo: true,
    simulacros: true,
    analiticasAvanzadas: false,
  },
  elite: {
    maxPreguntasPorTest: 200,
    maxHistorial: Infinity,
    modesAllowed: ['adaptativo', 'normal', 'marcadas', 'repaso', 'simulacro'],
    repasoEspaciado: true,
    refuerzo: true,
    simulacros: true,
    analiticasAvanzadas: true,
  },
};

/**
 * Devuelve true si el plan del usuario cumple el mínimo requerido.
 * @param {string} userPlan  - plan actual del usuario ('free' | 'pro' | 'elite')
 * @param {string} required  - plan mínimo requerido
 */
export const planHasAccess = (userPlan, required) => {
  const userIdx = PLAN_ORDER.indexOf(userPlan ?? 'free');
  const reqIdx = PLAN_ORDER.indexOf(required);
  return userIdx >= reqIdx;
};
