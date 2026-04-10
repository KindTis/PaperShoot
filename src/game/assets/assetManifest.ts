export type StageArtAsset = Readonly<{
  key: string;
  path: string;
  width: number;
  height: number;
}>;

export const assetManifest = {
  paper: {
    idle: {
      key: 'paper-ball',
      path: 'assets/papershoot/paper/paper-ball.svg',
      width: 128,
      height: 128,
    },
  },
  bin: {
    main: {
      key: 'trash-bin',
      path: 'assets/papershoot/bin/trash-bin.svg',
      width: 160,
      height: 160,
    },
  },
  fan: {
    main: {
      key: 'desk-fan',
      path: 'assets/papershoot/fan/desk-fan.svg',
      width: 180,
      height: 180,
    },
  },
  props: {
    cup: {
      key: 'cup',
      path: 'assets/papershoot/props/cup.svg',
      width: 120,
      height: 120,
    },
    pencilCup: {
      key: 'pencil-cup',
      path: 'assets/papershoot/props/pencil-cup.svg',
      width: 140,
      height: 140,
    },
  },
} as const;
