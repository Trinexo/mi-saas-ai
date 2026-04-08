// Barrel de compatibilidad - los metodos se han dividido en catalogAdminOposicion y catalogAdminTaxonomia.
import { catalogAdminOposicionService } from './catalogAdminOposicion.service.js';
import { catalogAdminTaxonomiaService } from './catalogAdminTaxonomia.service.js';

export const catalogAdminService = {
  ...catalogAdminOposicionService,
  ...catalogAdminTaxonomiaService,
};

export { catalogAdminOposicionService, catalogAdminTaxonomiaService };
