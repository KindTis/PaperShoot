export type StageArtAsset = Readonly<{
  key: string;
  path: string;
}>;

const coffeeCupAsset = {
  key: 'coffee-cup',
  path: 'assets/papershoot/props/coffee-cup.png',
} as const satisfies StageArtAsset;

const pencilHolderAsset = {
  key: 'pencil-holder',
  path: 'assets/papershoot/props/pencil-holder.png',
} as const satisfies StageArtAsset;

export const assetManifest = {
  background: {
    backplate: {
      key: 'office-backplate-main',
      path: 'assets/papershoot/background/office-backplate-main.webp',
    },
    midgroundDeskCluster: {
      key: 'office-midground-desk-cluster',
      path: 'assets/papershoot/background/office-midground-desk-cluster.png',
    },
    sideCubicleLeft: {
      key: 'office-side-cubicle-left',
      path: 'assets/papershoot/background/office-side-cubicle-left.png',
    },
    sideCubicleRight: {
      key: 'office-side-cubicle-right',
      path: 'assets/papershoot/background/office-side-cubicle-right.png',
    },
    foregroundDeskEdge: {
      key: 'office-foreground-desk-edge',
      path: 'assets/papershoot/background/office-foreground-desk-edge.png',
    },
  },
  paper: {
    idle: {
      key: 'paper-ball-main',
      path: 'assets/papershoot/paper/paper-ball-main.png',
    },
  },
  bin: {
    main: {
      key: 'trash-bin-main',
      path: 'assets/papershoot/bin/trash-bin-main.png',
    },
  },
  fan: {
    main: {
      key: 'desk-fan-main',
      path: 'assets/papershoot/fan/desk-fan-main.png',
    },
  },
  props: {
    coffeeCup: coffeeCupAsset,
    pencilHolder: pencilHolderAsset,
    cup: coffeeCupAsset,
    pencilCup: pencilHolderAsset,
  },
  obstacles: {
    centerBlock: {
      key: 'obstacle-center-block',
      path: 'assets/papershoot/obstacles/obstacle-center-block.png',
    },
    dualBlockLeft: {
      key: 'obstacle-dual-block-left',
      path: 'assets/papershoot/obstacles/obstacle-dual-block-left.png',
    },
    dualBlockRight: {
      key: 'obstacle-dual-block-right',
      path: 'assets/papershoot/obstacles/obstacle-dual-block-right.png',
    },
    movingCart: {
      key: 'obstacle-moving-cart',
      path: 'assets/papershoot/obstacles/obstacle-moving-cart.png',
    },
    swingPanel: {
      key: 'obstacle-swing-panel',
      path: 'assets/papershoot/obstacles/obstacle-swing-panel.png',
    },
    narrowGate: {
      key: 'obstacle-narrow-gate',
      path: 'assets/papershoot/obstacles/obstacle-narrow-gate.png',
    },
  },
  fx: {
    windStreak: {
      key: 'wind-streak',
      path: 'assets/papershoot/fx/wind-streak.png',
    },
    rimHitFlash: {
      key: 'rim-hit-flash',
      path: 'assets/papershoot/fx/rim-hit-flash.png',
    },
    successBurst: {
      key: 'success-burst',
      path: 'assets/papershoot/fx/success-burst.png',
    },
  },
} as const;

export const stageArtAssets = [
  assetManifest.background.backplate,
  assetManifest.background.midgroundDeskCluster,
  assetManifest.background.sideCubicleLeft,
  assetManifest.background.sideCubicleRight,
  assetManifest.background.foregroundDeskEdge,
  assetManifest.paper.idle,
  assetManifest.bin.main,
  assetManifest.fan.main,
  assetManifest.props.coffeeCup,
  assetManifest.props.pencilHolder,
  assetManifest.obstacles.centerBlock,
  assetManifest.obstacles.dualBlockLeft,
  assetManifest.obstacles.dualBlockRight,
  assetManifest.obstacles.movingCart,
  assetManifest.obstacles.swingPanel,
  assetManifest.obstacles.narrowGate,
  assetManifest.fx.windStreak,
  assetManifest.fx.rimHitFlash,
  assetManifest.fx.successBurst,
] as const satisfies ReadonlyArray<StageArtAsset>;
