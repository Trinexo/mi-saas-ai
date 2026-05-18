import { useEffect, useState } from 'react';

/**
 * Devuelve breakpoints reactivos basados en el ancho de ventana.
 * isMobile : < 640 px  (teléfonos)
 * isTablet : < 1024 px (tablets / ventanas pequeñas)
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile: width < 640,
    isTablet: width < 1024,
    width,
  };
}
