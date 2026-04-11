export type StageSelectionSource = 'default' | 'query' | 'fallback';

export interface StageSelectionResult {
  order: number;
  source: StageSelectionSource;
}

const DECIMAL_INTEGER_PATTERN = /^\d+$/;

export function resolveStageSelection(search: string, totalStages: number): StageSelectionResult {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  if (!params.has('stage')) {
    return { order: 1, source: 'default' };
  }

  const rawStage = params.get('stage');
  if (rawStage === null || !DECIMAL_INTEGER_PATTERN.test(rawStage)) {
    return { order: 1, source: 'fallback' };
  }

  const parsed = Number.parseInt(rawStage, 10);

  if (parsed < 1 || parsed > totalStages) {
    return { order: 1, source: 'fallback' };
  }

  return { order: parsed, source: 'query' };
}
