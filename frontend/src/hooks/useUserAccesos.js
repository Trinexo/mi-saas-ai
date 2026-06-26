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

  const mergeAccesoActualizado = (oposicionId, updated, fallback = {}) => {
    setAccesos((prev) =>
      prev.map((acceso) =>
        Number(acceso.oposicion_id) === Number(oposicionId)
          ? {
              ...acceso,
              ...updated,
              oposicion_id: updated?.oposicion_id ?? acceso.oposicion_id,
              modo_preparacion: updated?.modo_preparacion ?? fallback.modoPreparacion ?? acceso.modo_preparacion,
              tipo_alumno: updated?.tipo_alumno ?? acceso.tipo_alumno,
              ranking_publico: updated?.ranking_publico ?? fallback.rankingPublico ?? acceso.ranking_publico,
            }
          : acceso,
      ),
    );
  };

  const actualizarPreparacion = async (oposicionId, modoPreparacion) => {
    if (!token) throw new Error('Sesion no iniciada');
    const updated = await accesosApi.updatePreparacion(token, oposicionId, {
      modoPreparacion,
    });
    mergeAccesoActualizado(oposicionId, updated, { modoPreparacion });
    return updated;
  };

  const actualizarRankingPublico = async (oposicionId, rankingPublico) => {
    if (!token) throw new Error('Sesion no iniciada');
    const updated = await accesosApi.updatePreparacion(token, oposicionId, {
      rankingPublico,
    });
    mergeAccesoActualizado(oposicionId, updated, { rankingPublico });
    return updated;
  };

  const tieneAlgunAcceso = accesos.length > 0;

  return { accesos, loading, tieneAcceso, tieneAlgunAcceso, actualizarPreparacion, actualizarRankingPublico };
}
