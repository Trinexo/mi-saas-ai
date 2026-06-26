export const resolveWidgetModeOptions = (options = {}) => ({
  modoPreparacion: options.modoPreparacion || 'experto',
  albacerModuloId: options.albacerModuloId ? Number(options.albacerModuloId) : null,
});

export const widgetModeSql = (testAlias = 't') => (
  `AND COALESCE(${testAlias}.modo_preparacion, 'experto') = $3
   AND ($4::bigint IS NULL OR ${testAlias}.albacer_modulo_id = $4)`
);
