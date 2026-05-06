import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Contexto que almacena la oposición activa seleccionada por el usuario.
 * Persiste en localStorage bajo la clave 'oposicionActiva'.
 *
 * Forma: { id: number, nombre: string } | null
 */
const OposicionActivaContext = createContext(null);

const STORAGE_KEY = 'oposicionActiva';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function OposicionActivaProvider({ children }) {
  const [oposicionActiva, setOposicionActivaState] = useState(loadFromStorage);

  const setOposicionActiva = useCallback((oposicion) => {
    setOposicionActivaState(oposicion);
    if (oposicion) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(oposicion));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearOposicionActiva = useCallback(() => {
    setOposicionActivaState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ oposicionActiva, setOposicionActiva, clearOposicionActiva }),
    [oposicionActiva, setOposicionActiva, clearOposicionActiva],
  );

  return (
    <OposicionActivaContext.Provider value={value}>
      {children}
    </OposicionActivaContext.Provider>
  );
}

export function useOposicionActiva() {
  const context = useContext(OposicionActivaContext);
  if (!context) {
    throw new Error('useOposicionActiva debe usarse dentro de OposicionActivaProvider');
  }
  return context;
}
