import type { StageConfig } from '../contracts';

export function validateStageCatalog(stages: StageConfig[]): void {
  const ids = new Set<string>();

  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];

    if (ids.has(stage.id)) {
      throw new Error(`Duplicate stage id: ${stage.id}`);
    }
    ids.add(stage.id);

    const expectedOrder = index + 1;
    if (stage.order !== expectedOrder) {
      throw new Error(
        `Invalid stage order for ${stage.id}: expected ${expectedOrder}, got ${stage.order}`,
      );
    }
  }
}
