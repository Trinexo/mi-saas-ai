// Barrel de compatibilidad - los metodos se han dividido en progressTemarioResumenTema y progressTemarioResumenOposicion.
import { progressTemarioResumenTemaRepository } from './progressTemarioResumenTema.repository.js';
import { progressTemarioResumenOposicionRepository } from './progressTemarioResumenOposicion.repository.js';

export const progressTemarioResumenRepository = { ...progressTemarioResumenTemaRepository, ...progressTemarioResumenOposicionRepository };
export { progressTemarioResumenTemaRepository, progressTemarioResumenOposicionRepository };
