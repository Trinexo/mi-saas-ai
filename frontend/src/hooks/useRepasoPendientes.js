import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';
import { useUserPlan } from './useUserPlan';
import { repasoApi } from '../services/repasoApi';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';

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
  const { oposicionActiva } = useOposicionActiva();
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
      .getPendientes(token, 50, oposicionActiva?.id)
      .then((data) => {
        const safeData = data ?? {};
        setTotal(safeData.totalPendientes ?? 0);
        setTemaIdSugerido(safeData.temaIdSugerido ?? null);
        setItems(Array.isArray(safeData.items) ? safeData.items : []);
      })
      .catch(() => {
        setTotal(0);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [token, puedeUsar, oposicionActiva?.id]);

  return { total, temaIdSugerido, items, loading };
}
