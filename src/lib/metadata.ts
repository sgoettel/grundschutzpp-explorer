export const KNOWN_PROP_LABELS: Record<string, string> = {
  sec_level: 'Sicherheitsniveau',
  modal_verb: 'Modalverb',
  action_word: 'Handlungswort',
  result: 'Ergebnis',
  result_specification: 'Ergebnisspezifikation',
  documentation: 'Dokumentation',
  'alt-identifier': 'Technische Kennung',
  effort_level: 'Aufwandsstufe',
  tags: 'Tags',
  target_object_categories: 'Zielobjektkategorien',
  threats: 'Gefährdungen',
  confidentiality: 'Vertraulichkeit',
  integrity: 'Integrität',
  availability: 'Verfügbarkeit',
  authenticity: 'Authentizität'
};

export const KNOWN_PROP_NAMES = new Set(Object.keys(KNOWN_PROP_LABELS));

export const metadataLabel = (name?: string): string =>
  (name && KNOWN_PROP_LABELS[name]) ?? name ?? 'Metadatum';
