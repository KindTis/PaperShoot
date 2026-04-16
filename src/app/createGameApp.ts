type DestroyableGame = {
  destroy: (removeCanvas?: boolean) => void;
};

type PhaserModuleLike = {
  AUTO: number | string;
  Scale: {
    RESIZE: number | string;
    FIT: number | string;
    CENTER_BOTH: number | string;
  };
  Game: new (config: Record<string, unknown>) => DestroyableGame;
};

type SceneConstructor = new (...args: never[]) => unknown;

type SceneModuleLike = {
  BootScene: SceneConstructor;
  StageScene: SceneConstructor;
};

export type CreateGameAppDependencies = {
  loadPhaser: () => Promise<PhaserModuleLike>;
  loadScenes: () => Promise<SceneModuleLike>;
};

export type GameApp = {
  appRoot: HTMLDivElement;
  hudRoot: HTMLDivElement;
  game: DestroyableGame;
};

let activeGame: DestroyableGame | null = null;

export function getAppConfig() {
  return {
    parentId: 'app' as const,
    hudRootId: 'hud-root' as const,
    sceneKeys: ['BootScene', 'StageScene'] as const,
  };
}

export function ensureAppRoot(doc: Document, parentId = getAppConfig().parentId): HTMLDivElement {
  let appRoot = doc.getElementById(parentId) as HTMLDivElement | null;
  if (!appRoot) {
    appRoot = doc.createElement('div');
    appRoot.id = parentId;
    doc.body.appendChild(appRoot);
  }
  return appRoot;
}

export function ensureHudRoot(doc: Document, hudRootId = getAppConfig().hudRootId): HTMLDivElement {
  let hudRoot = doc.getElementById(hudRootId) as HTMLDivElement | null;
  if (!hudRoot) {
    hudRoot = doc.createElement('div');
    hudRoot.id = hudRootId;
    doc.body.appendChild(hudRoot);
  }
  return hudRoot;
}

function getDefaultDependencies(): CreateGameAppDependencies {
  return {
    loadPhaser: async () => (await import('phaser')).default as unknown as PhaserModuleLike,
    loadScenes: async () => {
      const [{ BootScene }, { StageScene }] = await Promise.all([
        import('../game/scenes/BootScene'),
        import('../game/scenes/StageScene'),
      ]);
      return { BootScene, StageScene };
    },
  };
}

function buildGameConfig(
  phaserModule: PhaserModuleLike,
  scenes: SceneModuleLike,
): Record<string, unknown> {
  return {
    type: phaserModule.AUTO,
    parent: getAppConfig().parentId,
    backgroundColor: '#ede4d6',
    width: 540,
    height: 960,
    scene: [scenes.BootScene, scenes.StageScene],
    scale: {
      mode: phaserModule.Scale.FIT,
      autoCenter: phaserModule.Scale.CENTER_BOTH,
      width: 540,
      height: 960,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    input: {
      mouse: true,
      touch: true,
      keyboard: true,
    },
  };
}

export async function createGameApp(
  doc: Document,
  dependencies: Partial<CreateGameAppDependencies> = {},
): Promise<GameApp> {
  const defaultDependencies = getDefaultDependencies();
  const loadPhaser = dependencies.loadPhaser ?? defaultDependencies.loadPhaser;
  const loadScenes = dependencies.loadScenes ?? defaultDependencies.loadScenes;

  const appRoot = ensureAppRoot(doc);
  const hudRoot = ensureHudRoot(doc);

  if (activeGame) {
    activeGame.destroy(true);
    activeGame = null;
  }

  const [phaserModule, scenes] = await Promise.all([loadPhaser(), loadScenes()]);
  const game = new phaserModule.Game(buildGameConfig(phaserModule, scenes));
  activeGame = game;

  return {
    appRoot,
    hudRoot,
    game,
  };
}
