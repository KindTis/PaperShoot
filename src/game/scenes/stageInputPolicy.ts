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
