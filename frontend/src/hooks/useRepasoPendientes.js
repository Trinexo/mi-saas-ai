import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';
import { useUserPlan } from './useUserPlan';
import { repasoApi } from '../services/repasoApi';

/**
 * Devuelve las preguntas pendientes de repaso para el usuario.
 * Solo carga datos si el usuario tiene plan pro o elite.
 * - total: número de preguntas pendientes
 * - temaIdSugerido: tema con más pendientes
 * - items: array de preguntas pendientes
 * - loading: true mientras carga
 */
export function useRepasoPendientes() {
  const { token } = useAuth();
  const { esPro, esElite } = useUserPlan();
  const [total, setTotal] = useState(0);
  const [temaIdSugerido, setTemaIdSugerido] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const puedeUsar = esPro || esElite;

  useEffect(() => {
    if (!token || !puedeUsar) {
      setLoading(false);
      return;
    }
    repasoApi
      .getPendientes(token, 50)
      .then((res) => {
        const data = res?.data ?? {};
        setTotal(data.totalPendientes ?? 0);
        setTemaIdSugerido(data.temaIdSugerido ?? null);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        setTotal(0);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [token, puedeUsar]);

  return { total, temaIdSugerido, items, loading };
}
