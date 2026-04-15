// Barrel de compatibilidad - los metodos se han dividido en testSubmitScoringNota y testSubmitScoringEvaluacion.
import { testSubmitScoringNotaService } from './testSubmitScoringNota.service.js';
import { testSubmitScoringEvaluacionService } from './testSubmitScoringEvaluacion.service.js';

export const testSubmitScoringService = {
  ...testSubmitScoringNotaService,
  ...testSubmitScoringEvaluacionService,
};

export { testSubmitScoringNotaService, testSubmitScoringEvaluacionService };
