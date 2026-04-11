export type StageArtAsset = Readonly<{
  key: string;
  path: string;
}>;

export const assetManifest = {
  background: {
    backplate: {
      key: 'office-backplate-main',
      path: 'assets/papershoot/background/office-backplate-main.webp',
    },
  },
  paper: {
    idle: {
      key: 'paper-ball',
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
    cup: {
      key: 'cup-main',
      path: 'assets/papershoot/props/cup-main.png',
    },
    pencilCup: {
      key: 'pencil-cup-main',
      path: 'assets/papershoot/props/pencil-cup-main.png',
    },
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
    successBurst: {
      key: 'success-burst',
      path: 'assets/papershoot/fx/success-burst.png',
    },
  },
} as const;
