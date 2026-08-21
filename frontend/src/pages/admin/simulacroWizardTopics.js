export function normalizeWizardTopics(topicData, isProfesor) {
  const source = isProfesor
    ? (topicData?.items ?? topicData?.data?.items ?? topicData ?? [])
    : (Array.isArray(topicData) ? topicData : (topicData?.items ?? topicData?.data ?? []));

  return (Array.isArray(source) ? source : []).map((item) => ({
    tema_id: String(item.tema_id ?? item.id),
    tema_nombre: item.tema_nombre ?? item.nombre ?? `Tema ${item.id}`,
  })).filter((item) => item.tema_id !== 'undefined');
}

export function getWizardTopicsView({ oposicionId, topics }) {
  if (!oposicionId) return 'sin-oposicion';
  if (topics.length === 0) return 'sin-temas';
  if (topics.length === 1) return 'un-tema';
  return 'multi-tema';
}
