import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';
import { subscriptionApi } from '../services/subscriptionApi';

const PLAN_ORDER = ['free', 'pro', 'elite'];

/**
 * Devuelve el plan activo del usuario autenticado y helpers de acceso.
 * - plan:           'free' | 'pro' | 'elite'
 * - loading:        true mientras se resuelve la petición
 * - hasAccess(min): true si el plan actual >= minPlan
 */
export function useUserPlan() {
  const { token } = useAuth();
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    subscriptionApi
      .getMyPlan(token)
      .then((res) => setPlan(res?.planActual ?? 'free'))
      .catch(() => setPlan('free'))
      .finally(() => setLoading(false));
  }, [token]);

  const hasAccess = (minPlan) => {
    const userIdx = PLAN_ORDER.indexOf(plan);
    const reqIdx = PLAN_ORDER.indexOf(minPlan);
    return userIdx >= reqIdx;
  };

  return { plan, loading, hasAccess, esPro: plan === 'pro', esElite: plan === 'elite' };
}
