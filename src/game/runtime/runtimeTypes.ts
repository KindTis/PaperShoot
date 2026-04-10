import type { BinState } from '../collision/binStateMachine';
import type { FailureReason, StageConfig, Vec3 } from '../contracts';
import type { ThrowInputSnapshot } from '../input/ThrowInputController';

export interface ThrowBody {
  position: Vec3;
  velocity: Vec3;
  elapsedMs: number;
  binState: BinState;
}

export interface ResultOverlay {
  kind: 'success' | 'failure' | null;
  text: string;
}

export interface ShellEvent {
  type: 'stage_cleared' | 'stage_failed';
  stageId: StageConfig['id'];
}

export interface RuntimeSnapshot {
  worldTimeMs: number;
  throwIndex: number;
  remainingThrows: number;
  successCount: number;
  stageStatus: 'playing' | 'cleared' | 'failed';
  resultOverlay: ResultOverlay;
  failureReason: FailureReason;
  input: ThrowInputSnapshot;
  activeBody: ThrowBody | null;
}
