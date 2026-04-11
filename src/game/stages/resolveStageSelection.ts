export type StageSelectionSource = 'default' | 'query' | 'fallback';

export interface StageSelectionResult {
  order: number;
  source: StageSelectionSource;
}

const DEFAULT_SELECTION: StageSelectionResult = { order: 1, source: 'default' };
const FALLBACK_SELECTION: StageSelectionResult = { order: 1, source: 'fallback' };

export function resolveStageSelection(search: string, totalStages: number): StageSelectionResult {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  if (!params.has('stage')) {
    return DEFAULT_SELECTION;
  }

  const rawStage = params.get('stage');
  if (rawStage === null || rawStage.trim() === '') {
    return FALLBACK_SELECTION;
  }

  const parsed = Number(rawStage);
  if (!Number.isInteger(parsed)) {
    return FALLBACK_SELECTION;
  }

  if (parsed < 1 || parsed > totalStages) {
    return FALLBACK_SELECTION;
  }

  return { order: parsed, source: 'query' };
}
