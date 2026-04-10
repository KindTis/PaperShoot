import type { RuntimeSnapshot } from '../runtime/runtimeTypes';

export class StageRenderer {
  private lastSnapshot: RuntimeSnapshot | null = null;

  render(snapshot: RuntimeSnapshot): void {
    this.lastSnapshot = snapshot;
  }

  getLastSnapshot(): RuntimeSnapshot | null {
    return this.lastSnapshot;
  }
}
