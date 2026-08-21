import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';
import { subscriptionApi } from '../services/subscriptionApi';

const PLAN_ORDER = ['free', 'pro'];

function normalizePlan(plan) {
  return plan === 'elite' ? 'pro' : (plan ?? 'free');
}

/**
 * Devuelve el plan activo del usuario autenticado y helpers de acceso.
 * En frontend solo existen los planes 'free' y 'pro'.
 * El valor legacy 'elite' se normaliza a 'pro' mientras el backend
 * mantenga compatibilidad con datos históricos.
 */
export function useUserPlan() {
  const { token } = useAuth();
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    subscriptionApi
      .getMyPlan(token)
      .then((res) => setPlan(normalizePlan(res?.planActual)))
      .catch(() => setPlan('free'))
      .finally(() => setLoading(false));
  }, [token]);

  const hasAccess = (minPlan) => {
    const normalizedMinPlan = normalizePlan(minPlan);
    const userIdx = PLAN_ORDER.indexOf(plan);
    const reqIdx = PLAN_ORDER.indexOf(normalizedMinPlan);
    return userIdx >= reqIdx;
  };

  return {
    plan,
    loading,
    hasAccess,
    esPro: plan === 'pro',
  };
}
