export type StageDebugState = Readonly<{
  stageId: string;
  stageOrder: number;
  stageSource: 'default' | 'query' | 'fallback';
  obstacleIds: string[];
}>;

export function publishStageDebugState(doc: Document, state: StageDebugState): void {
  doc.body.dataset.stageId = state.stageId;
  doc.body.dataset.stageOrder = `${state.stageOrder}`;
  doc.body.dataset.stageSource = state.stageSource;
  doc.body.dataset.stageObstacles = state.obstacleIds.join(',');
}
