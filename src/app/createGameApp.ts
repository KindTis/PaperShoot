export function getAppConfig() {
  return {
    parentId: 'app' as const,
    hudRootId: 'hud-root' as const,
    sceneKeys: ['BootScene', 'StageScene'] as const,
  };
}

export function ensureHudRoot(doc: Document, hudRootId = getAppConfig().hudRootId) {
  let hudRoot = doc.getElementById(hudRootId);
  if (!hudRoot) {
    hudRoot = doc.createElement('div');
    hudRoot.id = hudRootId;
    doc.body.appendChild(hudRoot);
  }
  return hudRoot;
}
