export function shouldConfirmFromPointerDown(input: {
  button: number;
  event?: Event;
}): boolean {
  if (input.button > 0) {
    return false;
  }

  const event = input.event;
  if (!event) {
    return true;
  }

  const pointerLikeEvent = event as Partial<PointerEvent>;
  if (pointerLikeEvent.pointerType === 'touch' || pointerLikeEvent.pointerType === 'pen') {
    return false;
  }

  return !event.type.startsWith('touch');
}

export function shouldBeginLaunchDrag(
  point: { x: number; y: number },
  launchAnchor: { x: number; y: number } = { x: 0.5, y: 0.84 },
  radius = 0.16,
): boolean {
  const dx = point.x - launchAnchor.x;
  const dy = point.y - launchAnchor.y;
  return dx * dx + dy * dy <= radius * radius;
}

export function shouldResetForNewDrag(input: {
  stageStatus: 'playing' | 'cleared' | 'failed';
  hasActiveBody: boolean;
  failureReason: string | null;
}): boolean {
  return input.stageStatus === 'playing' && !input.hasActiveBody && input.failureReason !== null;
}
