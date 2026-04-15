import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';
import { accesosApi } from '../services/accesosApi';

/**
 * Devuelve los accesos activos del usuario a oposiciones.
 * - accesos: array de { oposicion_id, fecha_fin }
 * - loading: true mientras carga
 * - tieneAcceso(oposicionId): true si el usuario tiene acceso a esa oposición
 * - tieneAlgunAcceso: true si tiene al menos un curso comprado
 */
export function useUserAccesos() {
  const { token } = useAuth();
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    accesosApi
      .getMisOposiciones(token)
      .then((res) => setAccesos(Array.isArray(res) ? res : []))
      .catch(() => setAccesos([]))
      .finally(() => setLoading(false));
  }, [token]);

  const tieneAcceso = (oposicionId) =>
    accesos.some((a) => Number(a.oposicion_id) === Number(oposicionId));

  const tieneAlgunAcceso = accesos.length > 0;

  return { accesos, loading, tieneAcceso, tieneAlgunAcceso };
}
