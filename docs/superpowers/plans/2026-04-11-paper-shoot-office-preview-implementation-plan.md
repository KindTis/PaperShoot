# PaperShoot Office Preview and Art Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 플레이 스테이지를 공용 오피스 공간 안에서 일관되게 보이도록 재구성하고, `?stage=` 직접 진입과 Playwright 검수 경로를 통해 각 스테이지의 실제 모습을 즉시 확인 가능하게 만든다.

**Architecture:** `StageScene`는 URL 파라미터 해석기를 통해 직접 진입 스테이지를 결정하고, 동일한 Stage 카탈로그를 Playwright와 공유한다. 렌더링은 `공용 오피스 배경 레이어 + 스테이지별 장애물 스프라이트` 구조로 통일하고, 쓰레기통/장애물은 기하-우선 정렬 시트와 앵커 규칙을 따라 배치한다.

**Tech Stack:** Phaser, TypeScript, Vite, Vitest, Playwright, DOM HUD, raster image assets (`PNG`/`WebP`)

---

## Scope Guard

- 플레이어용 스테이지 선택 메뉴는 만들지 않는다. 개발/QA용 `?stage=` 직접 진입만 추가한다.
- Stage 1~6 전체를 `office` 세계로 통일한다. `room`, `classroom`, `cafe`의 별도 배경 세트는 만들지 않는다.
- 배경은 공용 오피스 1세트만 유지하고, 스테이지 차이는 바람/장애물/배치로 만든다.
- 충돌체를 이미지에 맞추지 않는다. 이미지가 시뮬레이션 기하와 정렬되도록 앵커/치수 시트를 먼저 고정한다.
- 실사풍 복제는 목표가 아니다. `스타일라이즈된 3D 게임풍`과 모바일 가독성을 우선한다.

## Planned File Structure

- Modify: `src/game/stages/stage01.ts`, `src/game/stages/stage02.ts`, `src/game/stages/stage05.ts`, `src/game/stages/stage06.ts` — 모든 스테이지를 `office`로 통일
- Create: `src/game/stages/resolveStageSelection.ts` — `?stage=` 해석과 폴백 규칙
- Modify: `src/game/scenes/StageScene.ts` — 선택된 스테이지로 런타임/렌더러/입력 컨트롤러를 지연 생성
- Create: `src/game/scenes/publishStageDebugState.ts` — Playwright 검수용 `data-stage-*` 디버그 메타데이터 게시
- Create: `src/game/assets/stageArtGeometry.ts` — 쓰레기통/장애물 앵커, 월드 치수, 기대 스크린 크기, 실루엣 규칙
- Modify: `src/game/assets/assetManifest.ts` — 공용 오피스 배경, 공용 오브젝트, 장애물, FX용 raster 매니페스트
- Modify: `src/game/assets/loadStageArt.ts` — `loader.image()` 기반 raster 로딩
- Create: `src/game/render/stageSpriteLayout.ts` — 월드 좌표 + 기하 시트를 받아 스프라이트 배치 사각형 계산
- Modify: `src/game/render/StageRenderer.ts` — 배경 레이어, 공용 소품, 장애물 스프라이트 렌더링으로 재구성
- Create: `public/assets/papershoot/background/*`, `public/assets/papershoot/paper/*`, `public/assets/papershoot/bin/*`, `public/assets/papershoot/fan/*`, `public/assets/papershoot/props/*`, `public/assets/papershoot/obstacles/*`, `public/assets/papershoot/fx/*` — 최종 raster 아트 리소스
- Create: `docs/superpowers/assets/2026-04-11-paper-shoot-office-art-prompts.md` — 생성 프롬프트와 정렬 규칙
- Modify: `package.json` — `preview`, `test:e2e:stages` 스크립트 추가
- Create: `playwright.config.ts` — 로컬 preview 서버 기준 e2e 설정
- Create: `tests/e2e/stage-direct-entry.spec.ts` — Stage 1~6 직접 진입 검수
- Modify/Create: `tests/stages/resolveStageSelection.test.ts`, `tests/stages/stageCatalog.test.ts`, `tests/scenes/StageScene.test.ts`, `tests/assets/stageArtGeometry.test.ts`, `tests/assets/assetManifest.test.ts`, `tests/render/stageSpriteLayout.test.ts`, `tests/render/StageRenderer.theme.test.ts`
- Modify: `docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md` — Stage 1~6 직접 진입 QA 기록으로 갱신

## Parallel Agent Strategy

### Wave 0: 공유 계약 고정
- `Task 1`은 주 에이전트 단독 수행.
- 이유: 이후 모든 작업이 `stage theme = office`, `?stage=` 파라미터 규칙, 카탈로그 안정성에 의존한다.

### Wave 1: 독립 기초 작업
- Agent A: `Task 2` 직접 진입 부트스트랩 (`src/game/scenes/**`, `tests/scenes/**`)
- Agent B: `Task 3` 아트 기하/매니페스트 계약 (`src/game/assets/**`, `tests/assets/**`)
- 두 작업은 서로 다른 쓰기 범위를 가지므로 병렬 수행 가능하다.

### Wave 2: 리소스/렌더/브라우저 검수 병렬화
- Agent A: `Task 4` raster 아트 생성 및 프롬프트 시트 (`public/assets/papershoot/**`, `docs/superpowers/assets/**`)
- Agent B: `Task 5` 렌더러 레이어링 및 스프라이트 배치 (`src/game/render/**`, `tests/render/**`)
- Agent C: `Task 6` Playwright 직접 진입 검수 (`package.json`, `playwright.config.ts`, `tests/e2e/**`, `docs/superpowers/qa/**`)
- 전제 조건:
  - `Task 4`와 `Task 5`는 `Task 3`의 키/앵커 계약이 먼저 고정되어야 한다.
  - `Task 6`은 `Task 2`의 `data-stage-*` 게시가 먼저 고정되어야 한다.

### Wave 3: 통합 검증
- `Task 7`은 주 에이전트 단독 수행.
- 이유: unit/e2e/build/QA 산출물을 한 번에 검토하고 문서/자산/코드 간 불일치를 마감해야 한다.

### Task 1: Stage 카탈로그를 공용 오피스로 통일하고 직접 진입 규칙을 고정한다

**Files:**
- Create: `src/game/stages/resolveStageSelection.ts`
- Modify: `src/game/stages/stage01.ts`
- Modify: `src/game/stages/stage02.ts`
- Modify: `src/game/stages/stage05.ts`
- Modify: `src/game/stages/stage06.ts`
- Create: `tests/stages/resolveStageSelection.test.ts`
- Modify: `tests/stages/stageCatalog.test.ts`

- [ ] **Step 1: 직접 진입 규칙과 office 통일 계약을 먼저 테스트로 고정한다**

```ts
import { describe, expect, it } from 'vitest';
import { stageCatalog } from '../../src/game/stages/stageCatalog';
import { resolveStageSelection } from '../../src/game/stages/resolveStageSelection';

describe('resolveStageSelection', () => {
  it('accepts ?stage=1..6 and returns a query source', () => {
    expect(resolveStageSelection('?stage=4', stageCatalog.length)).toEqual({
      order: 4,
      source: 'query',
    });
  });

  it('falls back to stage 1 when the query is missing or invalid', () => {
    expect(resolveStageSelection('', stageCatalog.length)).toEqual({
      order: 1,
      source: 'default',
    });
    expect(resolveStageSelection('?stage=0', stageCatalog.length)).toEqual({
      order: 1,
      source: 'fallback',
    });
    expect(resolveStageSelection('?stage=999', stageCatalog.length)).toEqual({
      order: 1,
      source: 'fallback',
    });
    expect(resolveStageSelection('?stage=abc', stageCatalog.length)).toEqual({
      order: 1,
      source: 'fallback',
    });
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { stageCatalog } from '../../src/game/stages/stageCatalog';
import { validateStageCatalog } from '../../src/game/stages/stageValidator';

describe('stageCatalog (all office stages)', () => {
  it('keeps stage ids ordered and all themes pinned to office', () => {
    expect(stageCatalog.map((stage) => stage.id)).toEqual([
      'stage-01',
      'stage-02',
      'stage-03',
      'stage-04',
      'stage-05',
      'stage-06',
    ]);
    expect(stageCatalog.every((stage) => stage.theme === 'office')).toBe(true);
  });

  it('still passes catalog validation', () => {
    expect(() => validateStageCatalog(stageCatalog)).not.toThrow();
  });
});
```

- [ ] **Step 2: 새 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/stages/resolveStageSelection.test.ts tests/stages/stageCatalog.test.ts`

Expected:
- `Cannot find module '../../src/game/stages/resolveStageSelection'`
- `Expected false to be true` because Stage 1/2/5/6 are not `office`

- [ ] **Step 3: 직접 진입 해석기와 stage theme 통일을 최소 구현한다**

```ts
export type StageSelectionSource = 'default' | 'query' | 'fallback';

export type StageSelection = Readonly<{
  order: number;
  source: StageSelectionSource;
}>;

export function resolveStageSelection(search: string, totalStages: number): StageSelection {
  const params = new URLSearchParams(search);
  const rawStage = params.get('stage');

  if (!rawStage) {
    return { order: 1, source: 'default' };
  }

  const parsed = Number(rawStage);
  const isValidInteger = Number.isInteger(parsed);
  if (!isValidInteger || parsed < 1 || parsed > totalStages) {
    return { order: 1, source: 'fallback' };
  }

  return { order: parsed, source: 'query' };
}
```

```ts
// src/game/stages/stage01.ts, stage02.ts, stage05.ts, stage06.ts
theme: 'office',
```

- [ ] **Step 4: 카탈로그 계약 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/stages/resolveStageSelection.test.ts tests/stages/stageCatalog.test.ts tests/stages/fullCatalog.test.ts`

Expected: PASS.

- [ ] **Step 5: 공유 계약 변경을 커밋한다**

```bash
git add src/game/stages/resolveStageSelection.ts src/game/stages/stage01.ts src/game/stages/stage02.ts src/game/stages/stage05.ts src/game/stages/stage06.ts tests/stages/resolveStageSelection.test.ts tests/stages/stageCatalog.test.ts
git commit -m "refactor: normalize office stage selection contract"
```

### Task 2: StageScene를 직접 진입 가능한 지연 초기화 구조로 바꾼다

**Files:**
- Create: `src/game/scenes/publishStageDebugState.ts`
- Modify: `src/game/scenes/StageScene.ts`
- Modify: `tests/scenes/StageScene.test.ts`

- [ ] **Step 1: StageScene가 URL 파라미터를 따라 부팅되고 디버그 메타를 게시하는 실패 테스트를 작성한다**

```ts
it('boots the requested stage from the query string and publishes debug state', async () => {
  window.history.replaceState({}, '', '/?stage=4');

  const { scene, hudRender } = await loadFixture({
    stages: [
      createStageFixture(1, []),
      createStageFixture(2, []),
      createStageFixture(3, ['block-center']),
      createStageFixture(4, ['block-left', 'block-right']),
    ],
    snapshot: createSnapshot(),
  });

  scene.update(0, 16);

  expect(hudRender.mock.lastCall?.[0].stageLabel).toBe('Stage 4');
  expect(document.body.dataset.stageId).toBe('stage-04');
  expect(document.body.dataset.stageSource).toBe('query');
  expect(document.body.dataset.stageObstacles).toBe('block-left,block-right');
});
```

```ts
function createStageFixture(order: number, obstacleIds: string[]) {
  return {
    id: `stage-0${order}`,
    order,
    theme: 'office',
    clear: { throwLimit: 3, requiredSuccesses: 1 },
    retryPolicy: { resetThrowOnly: true, keepWorldTimeOnRetry: true },
    aim: {
      yawMinDeg: -18,
      yawMaxDeg: 18,
      pitchMinDeg: 18,
      pitchMaxDeg: 42,
      defaultYawDeg: 0,
      defaultPitchDeg: 30,
    },
    power: {
      mode: 'ping_pong',
      minPower: 0.25,
      maxPower: 1,
      gaugeSpeed: 1.5,
      startPower: 0.55,
    },
    paper: { spawn: { x: 0, y: 1.45, z: 0.65 }, radius: 0.11 },
    physics: {
      fixedDtSec: 1 / 60,
      gravityY: -22,
      linearDrag: 1.35,
      maxFallSpeed: -18,
      obstacleRestitution: 0.22,
      rimRestitution: 0.34,
      tangentialDamping: 0.84,
      minSeparationSpeed: 2.4,
      maxFlightTimeMs: 4000,
    },
    fan: {
      enabled: true,
      position: { x: -1.4, y: 1.35, z: 2.1 },
      directionDeg: 90,
      strength: 1,
      strengthLabel: 'weak',
      targetLateralSpeed: 1.2,
      windResponse: 6,
      gravityScaleInZone: 0.96,
      influenceShape: 'box',
      influenceLength: 4.2,
      influenceWidth: 2.6,
      influenceHeight: 2.2,
      feather: 0.3,
      showParticles: true,
    },
    obstacles: obstacleIds.map((id) => ({
      id,
      kind: 'static_block' as const,
      position: { x: 0, y: 1.2, z: 5.3 },
      size: { x: 0.8, y: 1.0, z: 0.4 },
      motion: {
        type: 'none' as const,
        amplitude: 0,
        durationMs: 0,
        phaseMs: 0,
        timeSource: 'world_time' as const,
      },
    })),
    bin: {
      position: { x: 0.2, y: 0.85, z: 8.8 },
      openingWidth: 0.9,
      openingHeight: 1.05,
      innerDepth: 0.9,
      depthTolerance: 0.35,
      rimThickness: 0.08,
      entryAssistRadius: 0.18,
      entrySpeedMin: 2,
      entrySpeedMax: 11.5,
      settleTimeMs: 120,
    },
    assists: { showGuideArc: true, showFailureReason: true, showAimReticle: true },
    inputMode: 'drag_release',
    artTheme: 'desk-diorama-paper',
    score: { mode: 'binary_success', successValue: 1, failureValue: 0 },
    cameraPreset: 'desk-diorama-low',
    clearConditionText: '3번 안에 1회 성공',
  };
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/scenes/StageScene.test.ts`

Expected:
- `Stage 1`가 계속 렌더되어 Stage 4 기대값과 불일치
- `document.body.dataset.stageId`가 비어 있음

- [ ] **Step 3: StageScene를 지연 초기화하고 직접 진입 메타를 게시한다**

```ts
// src/game/scenes/publishStageDebugState.ts
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
```

```ts
// src/game/scenes/StageScene.ts
import type { StageConfig } from '../contracts';
import { publishStageDebugState } from './publishStageDebugState';
import { resolveStageSelection } from '../stages/resolveStageSelection';

export class StageScene extends Phaser.Scene {
  private stage!: StageConfig;
  private runtime!: StageRuntime;
  private dragController!: DragThrowController;

  create(): void {
    const selection = resolveStageSelection(window.location.search, stageCatalog.length);
    this.stage = stageCatalog[selection.order - 1];
    this.runtime = new StageRuntime(this.stage);
    this.dragController = new DragThrowController(this.stage);
    publishStageDebugState(document, {
      stageId: this.stage.id,
      stageOrder: this.stage.order,
      stageSource: selection.source,
      obstacleIds: this.stage.obstacles.map((obstacle) => obstacle.id),
    });

    this.stageRenderer = new StageRenderer(this, this.stage);
    this.hudRoot = createHudRoot(document);
    this.hud = new HudPresenter(this.hudRoot);
    this.bindDragInput();
    this.bindKeyboardInput();
    this.bindHudActions();
    this.hideLegacyTouchButtons();
    this.renderFrame();
  }
}
```

- [ ] **Step 4: 씬 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/scenes/StageScene.test.ts tests/scenes/stageInputPolicy.test.ts`

Expected: PASS.

- [ ] **Step 5: 직접 진입 부트스트랩 변경을 커밋한다**

```bash
git add src/game/scenes/publishStageDebugState.ts src/game/scenes/StageScene.ts tests/scenes/StageScene.test.ts
git commit -m "feat: boot requested stage from query overrides"
```

### Task 3: raster 아트 정렬 시트와 매니페스트 계약을 고정한다

**Files:**
- Create: `src/game/assets/stageArtGeometry.ts`
- Modify: `src/game/assets/assetManifest.ts`
- Modify: `src/game/assets/loadStageArt.ts`
- Create: `tests/assets/stageArtGeometry.test.ts`
- Modify: `tests/assets/assetManifest.test.ts`

- [ ] **Step 1: 쓰레기통/장애물 정렬 시트와 raster 매니페스트의 실패 테스트를 작성한다**

```ts
import { describe, expect, it } from 'vitest';
import { stageArtGeometry } from '../../src/game/assets/stageArtGeometry';

describe('stageArtGeometry', () => {
  it('pins bin opening alignment and narrow gate anchor rules', () => {
    expect(stageArtGeometry.bin.anchor).toBe('bottom-center');
    expect(stageArtGeometry.bin.entryWindow.widthRatio).toBeCloseTo(0.74, 2);
    expect(stageArtGeometry.bin.entryWindow.heightRatio).toBeCloseTo(0.18, 2);
    expect(stageArtGeometry.obstacles.narrowGate.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.swingPanel.anchor).toBe('top-center');
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { assetManifest } from '../../src/game/assets/assetManifest';
import { queueStageArt, resolveAssetUrl } from '../../src/game/assets/loadStageArt';

describe('assetManifest (raster office pack)', () => {
  it('maps office background, shared props, obstacles, and fx to relative raster paths', () => {
    expect(assetManifest.background.backplate.path).toBe('assets/papershoot/background/office-backplate-main.webp');
    expect(assetManifest.bin.main.path).toBe('assets/papershoot/bin/trash-bin-main.png');
    expect(assetManifest.obstacles.movingCart.path).toBe('assets/papershoot/obstacles/obstacle-moving-cart.png');
    expect(assetManifest.fx.successBurst.path).toBe('assets/papershoot/fx/success-burst.png');
  });

  it('resolves raster asset urls against a subpath base url', () => {
    expect(resolveAssetUrl(assetManifest.background.backplate.path, '/PaperShoot/')).toBe(
      '/PaperShoot/assets/papershoot/background/office-backplate-main.webp',
    );
  });

  it('queues raster assets with loader.image()', () => {
    const calls: Array<{ key: string; path: string }> = [];
    const loader = {
      image(key: string, path: string) {
        calls.push({ key, path });
      },
    };

    queueStageArt(loader as never, '/PaperShoot/');

    expect(calls.some((call) => call.key === 'office-backplate-main')).toBe(true);
    expect(calls.some((call) => call.key === 'trash-bin')).toBe(true);
    expect(calls.some((call) => call.key === 'obstacle-swing-panel')).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/assets/stageArtGeometry.test.ts tests/assets/assetManifest.test.ts`

Expected:
- `Cannot find module '../../src/game/assets/stageArtGeometry'`
- `Expected ...png/.webp` mismatch because current manifest still points to SVG
- `loader.image is not a function` or `calls` missing expected raster keys

- [ ] **Step 3: 기하 시트와 raster 매니페스트/로더를 구현한다**

```ts
// src/game/assets/stageArtGeometry.ts
import type { Vec3 } from '../contracts';

export type StageArtAnchor = 'bottom-center' | 'center' | 'top-center';

export type StageArtGeometry = Readonly<{
  worldSize: Vec3;
  anchor: StageArtAnchor;
  referenceStage: number;
  expectedScreenSize: Readonly<{ width: number; height: number }>;
  silhouetteRule: 'tight' | 'bin-opening' | 'gate-opening';
  entryWindow?: Readonly<{
    widthRatio: number;
    heightRatio: number;
    offsetYRatio: number;
  }>;
}>;

export const stageArtGeometry = {
  bin: {
    worldSize: { x: 0.9, y: 1.05, z: 0.9 },
    anchor: 'bottom-center',
    referenceStage: 1,
    expectedScreenSize: { width: 186, height: 228 },
    silhouetteRule: 'bin-opening',
    entryWindow: {
      widthRatio: 0.74,
      heightRatio: 0.18,
      offsetYRatio: -0.32,
    },
  },
  obstacles: {
    centerBlock: {
      worldSize: { x: 0.8, y: 1.0, z: 0.4 },
      anchor: 'center',
      referenceStage: 3,
      expectedScreenSize: { width: 142, height: 176 },
      silhouetteRule: 'tight',
    },
    dualBlockLeft: {
      worldSize: { x: 0.6, y: 0.95, z: 0.35 },
      anchor: 'center',
      referenceStage: 4,
      expectedScreenSize: { width: 124, height: 166 },
      silhouetteRule: 'tight',
    },
    dualBlockRight: {
      worldSize: { x: 0.7, y: 1.0, z: 0.35 },
      anchor: 'center',
      referenceStage: 4,
      expectedScreenSize: { width: 130, height: 172 },
      silhouetteRule: 'tight',
    },
    movingCart: {
      worldSize: { x: 0.9, y: 1.0, z: 0.35 },
      anchor: 'bottom-center',
      referenceStage: 5,
      expectedScreenSize: { width: 168, height: 168 },
      silhouetteRule: 'tight',
    },
    swingPanel: {
      worldSize: { x: 0.7, y: 1.0, z: 0.35 },
      anchor: 'top-center',
      referenceStage: 6,
      expectedScreenSize: { width: 132, height: 176 },
      silhouetteRule: 'tight',
    },
    narrowGate: {
      worldSize: { x: 0.55, y: 1.1, z: 0.2 },
      anchor: 'center',
      referenceStage: 6,
      expectedScreenSize: { width: 110, height: 182 },
      silhouetteRule: 'gate-opening',
    },
  },
} as const;
```

```ts
// src/game/assets/assetManifest.ts
export type StageArtAsset = Readonly<{
  key: string;
  path: string;
}>;

export const assetManifest = {
  background: {
    backplate: { key: 'office-backplate-main', path: 'assets/papershoot/background/office-backplate-main.webp' },
    midgroundDeskCluster: { key: 'office-midground-desk-cluster', path: 'assets/papershoot/background/office-midground-desk-cluster.png' },
    sideCubicleLeft: { key: 'office-side-cubicle-left', path: 'assets/papershoot/background/office-side-cubicle-left.png' },
    sideCubicleRight: { key: 'office-side-cubicle-right', path: 'assets/papershoot/background/office-side-cubicle-right.png' },
    foregroundDeskEdge: { key: 'office-foreground-desk-edge', path: 'assets/papershoot/background/office-foreground-desk-edge.png' },
  },
  paper: {
    idle: { key: 'paper-ball', path: 'assets/papershoot/paper/paper-ball-main.png' },
  },
  bin: {
    main: { key: 'trash-bin', path: 'assets/papershoot/bin/trash-bin-main.png' },
  },
  fan: {
    main: { key: 'desk-fan', path: 'assets/papershoot/fan/desk-fan-main.png' },
  },
  props: {
    cup: { key: 'coffee-cup', path: 'assets/papershoot/props/coffee-cup.png' },
    pencilCup: { key: 'pencil-holder', path: 'assets/papershoot/props/pencil-holder.png' },
  },
  obstacles: {
    centerBlock: { key: 'obstacle-center-block', path: 'assets/papershoot/obstacles/obstacle-center-block.png' },
    dualBlockLeft: { key: 'obstacle-dual-block-left', path: 'assets/papershoot/obstacles/obstacle-dual-block-left.png' },
    dualBlockRight: { key: 'obstacle-dual-block-right', path: 'assets/papershoot/obstacles/obstacle-dual-block-right.png' },
    movingCart: { key: 'obstacle-moving-cart', path: 'assets/papershoot/obstacles/obstacle-moving-cart.png' },
    swingPanel: { key: 'obstacle-swing-panel', path: 'assets/papershoot/obstacles/obstacle-swing-panel.png' },
    narrowGate: { key: 'obstacle-narrow-gate', path: 'assets/papershoot/obstacles/obstacle-narrow-gate.png' },
  },
  fx: {
    windStreak: { key: 'wind-streak', path: 'assets/papershoot/fx/wind-streak.png' },
    rimHitFlash: { key: 'rim-hit-flash', path: 'assets/papershoot/fx/rim-hit-flash.png' },
    successBurst: { key: 'success-burst', path: 'assets/papershoot/fx/success-burst.png' },
  },
} as const;
```

```ts
// src/game/assets/loadStageArt.ts
import Phaser from 'phaser';
import { assetManifest } from './assetManifest';

function normalizeBaseUrl(baseUrl: string): string {
  if (baseUrl === '/') {
    return '/';
  }

  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) {
    return '/';
  }

  return `${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}/`;
}

export function resolveAssetUrl(path: string, baseUrl: string = import.meta.env.BASE_URL): string {
  return `${normalizeBaseUrl(baseUrl)}${path.replace(/^\/+/, '')}`;
}

export function queueStageArt(loader: Phaser.Loader.LoaderPlugin, baseUrl: string = import.meta.env.BASE_URL): void {
  const assets = [
    assetManifest.background.backplate,
    assetManifest.background.midgroundDeskCluster,
    assetManifest.background.sideCubicleLeft,
    assetManifest.background.sideCubicleRight,
    assetManifest.background.foregroundDeskEdge,
    assetManifest.paper.idle,
    assetManifest.bin.main,
    assetManifest.fan.main,
    assetManifest.props.cup,
    assetManifest.props.pencilCup,
    assetManifest.obstacles.centerBlock,
    assetManifest.obstacles.dualBlockLeft,
    assetManifest.obstacles.dualBlockRight,
    assetManifest.obstacles.movingCart,
    assetManifest.obstacles.swingPanel,
    assetManifest.obstacles.narrowGate,
    assetManifest.fx.windStreak,
    assetManifest.fx.rimHitFlash,
    assetManifest.fx.successBurst,
  ] as const;

  for (const asset of assets) {
    loader.image(asset.key, resolveAssetUrl(asset.path, baseUrl));
  }
}
```

- [ ] **Step 4: 아트 계약 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/assets/stageArtGeometry.test.ts tests/assets/assetManifest.test.ts`

Expected: PASS.

- [ ] **Step 5: 아트 계약 변경을 커밋한다**

```bash
git add src/game/assets/stageArtGeometry.ts src/game/assets/assetManifest.ts src/game/assets/loadStageArt.ts tests/assets/stageArtGeometry.test.ts tests/assets/assetManifest.test.ts
git commit -m "refactor: define raster office art contract"
```

### Task 4: 공용 오피스 raster 아트 세트와 프롬프트 시트를 추가한다

**Files:**
- Create: `docs/superpowers/assets/2026-04-11-paper-shoot-office-art-prompts.md`
- Create: `public/assets/papershoot/background/office-backplate-main.webp`
- Create: `public/assets/papershoot/background/office-midground-desk-cluster.png`
- Create: `public/assets/papershoot/background/office-side-cubicle-left.png`
- Create: `public/assets/papershoot/background/office-side-cubicle-right.png`
- Create: `public/assets/papershoot/background/office-foreground-desk-edge.png`
- Create: `public/assets/papershoot/paper/paper-ball-main.png`
- Create: `public/assets/papershoot/bin/trash-bin-main.png`
- Create: `public/assets/papershoot/fan/desk-fan-main.png`
- Create: `public/assets/papershoot/props/coffee-cup.png`
- Create: `public/assets/papershoot/props/pencil-holder.png`
- Create: `public/assets/papershoot/obstacles/obstacle-center-block.png`
- Create: `public/assets/papershoot/obstacles/obstacle-dual-block-left.png`
- Create: `public/assets/papershoot/obstacles/obstacle-dual-block-right.png`
- Create: `public/assets/papershoot/obstacles/obstacle-moving-cart.png`
- Create: `public/assets/papershoot/obstacles/obstacle-swing-panel.png`
- Create: `public/assets/papershoot/obstacles/obstacle-narrow-gate.png`
- Create: `public/assets/papershoot/fx/wind-streak.png`
- Create: `public/assets/papershoot/fx/rim-hit-flash.png`
- Create: `public/assets/papershoot/fx/success-burst.png`
- Modify: `tests/assets/assetManifest.test.ts`

- [ ] **Step 1: manifest에 선언된 raster 파일이 실제로 존재해야 한다는 실패 테스트를 추가한다**

```ts
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { assetManifest } from '../../src/game/assets/assetManifest';

function collectPaths(): string[] {
  return [
    assetManifest.background.backplate.path,
    assetManifest.background.midgroundDeskCluster.path,
    assetManifest.background.sideCubicleLeft.path,
    assetManifest.background.sideCubicleRight.path,
    assetManifest.background.foregroundDeskEdge.path,
    assetManifest.paper.idle.path,
    assetManifest.bin.main.path,
    assetManifest.fan.main.path,
    assetManifest.props.cup.path,
    assetManifest.props.pencilCup.path,
    assetManifest.obstacles.centerBlock.path,
    assetManifest.obstacles.dualBlockLeft.path,
    assetManifest.obstacles.dualBlockRight.path,
    assetManifest.obstacles.movingCart.path,
    assetManifest.obstacles.swingPanel.path,
    assetManifest.obstacles.narrowGate.path,
    assetManifest.fx.windStreak.path,
    assetManifest.fx.rimHitFlash.path,
    assetManifest.fx.successBurst.path,
  ];
}

describe('office raster pack files', () => {
  it('ships every raster file declared in the manifest', () => {
    const missing = collectPaths()
      .map((relativePath) => `public/${relativePath}`)
      .filter((filePath) => !existsSync(filePath));

    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: 새 파일 존재 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/assets/assetManifest.test.ts`

Expected: FAIL with a list of missing `public/assets/papershoot/**` files.

- [ ] **Step 3: 프롬프트 시트와 binary raster 파일을 추가한다**

```md
# PaperShoot Office Raster Art Prompt Sheet

## Global rules
- Style: stylized 3D browser game asset pack, clean silhouette, mid-saturation office colors, no photoreal noise
- Lighting: soft overhead office lighting, slightly warm key light, consistent top-left highlight
- Perspective: match low desk-diorama camera, mild three-quarter angle, readable on mobile
- Backgrounds: transparent PNG for layered assets, opaque WebP only for the backplate
- Alignment: do not crop away the object base; keep bottom-center anchoring stable for bin/cart assets

## trash-bin-main.png
- Canvas: 768x768 transparent PNG
- Anchor: bottom-center
- Entry window: visible rim width matches 74% of sprite width, top opening height matches 18% of sprite height
- Prompt: stylized 3D office wire trash bin, warm gray plastic rim, slightly tapered metal body, readable interior opening, centered on transparent background, mobile-friendly silhouette

## obstacle-narrow-gate.png
- Canvas: 768x768 transparent PNG
- Anchor: center
- Gate opening: visible open lane centered and clearly readable, no decorative pieces crossing the passable opening
- Prompt: stylized 3D office training gate, slim foam frame, safety orange trim, centered transparent background, clear pass-through opening, game obstacle silhouette
```

Add the binary raster outputs listed in **Files** exactly under their declared paths. Do not rename any key after generation; rerender the asset if the filename or silhouette target is wrong.

- [ ] **Step 4: 파일 존재 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/assets/assetManifest.test.ts`

Expected: PASS.

- [ ] **Step 5: raster 아트 팩을 커밋한다**

```bash
git add docs/superpowers/assets/2026-04-11-paper-shoot-office-art-prompts.md public/assets/papershoot/background public/assets/papershoot/paper public/assets/papershoot/bin public/assets/papershoot/fan public/assets/papershoot/props public/assets/papershoot/obstacles public/assets/papershoot/fx tests/assets/assetManifest.test.ts
git commit -m "feat: add office raster art pack"
```

### Task 5: 공용 오피스 배경 레이어와 장애물 스프라이트 렌더링을 통합한다

**Files:**
- Create: `src/game/render/stageSpriteLayout.ts`
- Modify: `src/game/render/StageRenderer.ts`
- Create: `tests/render/stageSpriteLayout.test.ts`
- Modify: `tests/render/StageRenderer.theme.test.ts`

- [ ] **Step 1: 스프라이트 레이아웃 계산과 raster 키 사용을 검증하는 실패 테스트를 작성한다**

```ts
import { describe, expect, it } from 'vitest';
import { stageArtGeometry } from '../../src/game/assets/stageArtGeometry';
import { createBinSpriteLayout, getObstacleAssetKey } from '../../src/game/render/stageSpriteLayout';
import { stage06 } from '../../src/game/stages/stage06';

describe('stageSpriteLayout', () => {
  it('creates a bottom-center bin layout from the geometry sheet', () => {
    const layout = createBinSpriteLayout(
      { x: 400, y: 240, scale: 1, depthClamped: false },
      stageArtGeometry.bin,
    );

    expect(layout.displayWidth).toBe(stageArtGeometry.bin.expectedScreenSize.width);
    expect(layout.displayHeight).toBe(stageArtGeometry.bin.expectedScreenSize.height);
    expect(layout.originX).toBe(0.5);
    expect(layout.originY).toBe(1);
  });

  it('maps late-game obstacles to authored raster keys', () => {
    expect(stage06.obstacles.map(getObstacleAssetKey)).toEqual([
      'obstacle-swing-panel',
      'obstacle-narrow-gate',
    ]);
  });
});
```

```ts
import { describe, expect, it, vi } from 'vitest';
import { stage01 } from '../../src/game/stages/stage01';

describe('StageRenderer theme routing', () => {
  it('creates raster image layers for office stages', async () => {
    vi.resetModules();
    const createdKeys: string[] = [];
    const fakeImage = {
      setVisible: vi.fn(),
      setDepth: vi.fn(),
      setPosition: vi.fn(),
      setDisplaySize: vi.fn(),
      setAngle: vi.fn(),
      setAlpha: vi.fn(),
      setOrigin: vi.fn(),
    };

    const { StageRenderer } = await import('../../src/game/render/StageRenderer');
    const graphics = {
      setDepth: vi.fn(),
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      fillRoundedRect: vi.fn(),
      lineStyle: vi.fn(),
      strokeRoundedRect: vi.fn(),
      strokeCircle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn(),
      fillCircle: vi.fn(),
      closePath: vi.fn(),
      fillPath: vi.fn(),
    };
    const scene = {
      add: {
        graphics: () => graphics,
        image: (_x: number, _y: number, key: string) => {
          createdKeys.push(key);
          return fakeImage;
        },
      },
      textures: {
        exists: () => true,
      },
      scale: { width: 1280, height: 720 },
      cameras: { main: { setBackgroundColor: vi.fn() } },
    };

    new StageRenderer(scene as never, stage01);

    expect(createdKeys).toContain('office-backplate-main');
    expect(createdKeys).toContain('office-foreground-desk-edge');
    expect(createdKeys).toContain('trash-bin');
  });
});
```

- [ ] **Step 2: 렌더러 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/render/stageSpriteLayout.test.ts tests/render/StageRenderer.theme.test.ts`

Expected:
- `Cannot find module '../../src/game/render/stageSpriteLayout'`
- `office-backplate-main` key not created because current renderer only knows `paper/bin/fan/cup/pencilCup`

- [ ] **Step 3: 스프라이트 레이아웃 헬퍼와 StageRenderer raster 통합을 구현한다**

```ts
// src/game/render/stageSpriteLayout.ts
import type { StageConfig } from '../contracts';
import type { StageArtGeometry, StageArtAnchor } from '../assets/stageArtGeometry';

type ScreenPoint = {
  x: number;
  y: number;
  scale: number;
  depthClamped: boolean;
};

export type SpriteLayout = Readonly<{
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  originX: number;
  originY: number;
}>;

function originForAnchor(anchor: StageArtAnchor): Pick<SpriteLayout, 'originX' | 'originY'> {
  if (anchor === 'bottom-center') {
    return { originX: 0.5, originY: 1 };
  }
  if (anchor === 'top-center') {
    return { originX: 0.5, originY: 0 };
  }
  return { originX: 0.5, originY: 0.5 };
}

export function createBinSpriteLayout(screen: ScreenPoint, geometry: StageArtGeometry): SpriteLayout {
  const origin = originForAnchor(geometry.anchor);
  return {
    x: screen.x,
    y: screen.y,
    displayWidth: Math.round(geometry.expectedScreenSize.width * screen.scale),
    displayHeight: Math.round(geometry.expectedScreenSize.height * screen.scale),
    ...origin,
  };
}

export function getObstacleAssetKey(obstacle: StageConfig['obstacles'][number]): string {
  if (obstacle.id === 'block-center') {
    return 'obstacle-center-block';
  }
  if (obstacle.id === 'block-left') {
    return 'obstacle-dual-block-left';
  }
  if (obstacle.id === 'block-right') {
    return 'obstacle-dual-block-right';
  }
  if (obstacle.id === 'moving-slab') {
    return 'obstacle-moving-cart';
  }
  if (obstacle.id === 'moving-panel') {
    return 'obstacle-swing-panel';
  }
  return 'obstacle-narrow-gate';
}
```

```ts
// src/game/render/StageRenderer.ts
type RenderSprites = {
  backplate: Phaser.GameObjects.Image | null;
  midgroundDeskCluster: Phaser.GameObjects.Image | null;
  sideCubicleLeft: Phaser.GameObjects.Image | null;
  sideCubicleRight: Phaser.GameObjects.Image | null;
  foregroundDeskEdge: Phaser.GameObjects.Image | null;
  paper: Phaser.GameObjects.Image | null;
  bin: Phaser.GameObjects.Image | null;
  fan: Phaser.GameObjects.Image | null;
  cup: Phaser.GameObjects.Image | null;
  pencilCup: Phaser.GameObjects.Image | null;
  obstacles: Record<string, Phaser.GameObjects.Image | null>;
};
```

```ts
// src/game/render/StageRenderer.ts
return {
  backplate: create(assetManifest.background.backplate.key, 1),
  midgroundDeskCluster: create(assetManifest.background.midgroundDeskCluster.key, 2),
  sideCubicleLeft: create(assetManifest.background.sideCubicleLeft.key, 2),
  sideCubicleRight: create(assetManifest.background.sideCubicleRight.key, 2),
  foregroundDeskEdge: create(assetManifest.background.foregroundDeskEdge.key, 7),
  paper: create(assetManifest.paper.idle.key, 8),
  bin: create(assetManifest.bin.main.key, 6),
  fan: create(assetManifest.fan.main.key, 5),
  cup: create(assetManifest.props.cup.key, 5),
  pencilCup: create(assetManifest.props.pencilCup.key, 5),
  obstacles: {
    [assetManifest.obstacles.centerBlock.key]: create(assetManifest.obstacles.centerBlock.key, 6),
    [assetManifest.obstacles.dualBlockLeft.key]: create(assetManifest.obstacles.dualBlockLeft.key, 6),
    [assetManifest.obstacles.dualBlockRight.key]: create(assetManifest.obstacles.dualBlockRight.key, 6),
    [assetManifest.obstacles.movingCart.key]: create(assetManifest.obstacles.movingCart.key, 6),
    [assetManifest.obstacles.swingPanel.key]: create(assetManifest.obstacles.swingPanel.key, 6),
    [assetManifest.obstacles.narrowGate.key]: create(assetManifest.obstacles.narrowGate.key, 6),
  },
};
```

```ts
// src/game/render/StageRenderer.ts
private drawOfficeBackdrop(): void {
  const width = this.scene.scale.width;
  const height = this.scene.scale.height;

  this.syncFullScreenLayer(this.sprites.backplate, width, height, 0);
  this.syncLayerSprite(this.sprites.sideCubicleLeft, width * 0.14, height * 0.48, width * 0.28, height * 0.62, 0.5, 0.5);
  this.syncLayerSprite(this.sprites.sideCubicleRight, width * 0.86, height * 0.49, width * 0.28, height * 0.60, 0.5, 0.5);
  this.syncLayerSprite(this.sprites.midgroundDeskCluster, width * 0.5, height * 0.54, width * 0.72, height * 0.32, 0.5, 0.5);
}
```

```ts
// src/game/render/StageRenderer.ts
private drawObstacles(worldTimeMs: number): void {
  for (const obstacle of this.stage.obstacles) {
    const pose = getObstacleWorldPose({
      basePosition: obstacle.position,
      motion: obstacle.motion,
      worldTimeMs,
    });
    const screen = this.toScreen(pose);
    if (screen.depthClamped) {
      continue;
    }

    const key = getObstacleAssetKey(obstacle);
    const sprite = this.sprites.obstacles[key];
    if (!sprite) {
      continue;
    }

    const geometry =
      obstacle.id === 'block-center'
        ? stageArtGeometry.obstacles.centerBlock
        : obstacle.id === 'block-left'
          ? stageArtGeometry.obstacles.dualBlockLeft
          : obstacle.id === 'block-right'
            ? stageArtGeometry.obstacles.dualBlockRight
            : obstacle.id === 'moving-slab'
              ? stageArtGeometry.obstacles.movingCart
              : obstacle.id === 'moving-panel'
                ? stageArtGeometry.obstacles.swingPanel
                : stageArtGeometry.obstacles.narrowGate;

    const layout = createBinSpriteLayout(screen, geometry);
    this.syncLayerSprite(
      sprite,
      layout.x,
      layout.y,
      layout.displayWidth,
      layout.displayHeight,
      layout.originX,
      layout.originY,
    );
  }
}
```

- [ ] **Step 4: 렌더러 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/render/stageSpriteLayout.test.ts tests/render/StageRenderer.theme.test.ts tests/render/cameraRig.test.ts tests/render/deskLayout.test.ts`

Expected: PASS.

- [ ] **Step 5: 렌더러 통합을 커밋한다**

```bash
git add src/game/render/stageSpriteLayout.ts src/game/render/StageRenderer.ts tests/render/stageSpriteLayout.test.ts tests/render/StageRenderer.theme.test.ts
git commit -m "feat: render office stages with layered raster art"
```

### Task 6: Playwright가 `?stage=` 직접 진입으로 Stage 1~6을 모두 검수하게 만든다

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/stage-direct-entry.spec.ts`
- Modify: `docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md`

- [ ] **Step 1: 직접 진입 smoke spec을 먼저 작성한다**

```ts
import { expect, test } from '@playwright/test';

const scenarios = [
  { order: 1, stageId: 'stage-01', obstacles: '' },
  { order: 2, stageId: 'stage-02', obstacles: '' },
  { order: 3, stageId: 'stage-03', obstacles: 'block-center' },
  { order: 4, stageId: 'stage-04', obstacles: 'block-left,block-right' },
  { order: 5, stageId: 'stage-05', obstacles: 'moving-slab' },
  { order: 6, stageId: 'stage-06', obstacles: 'moving-panel,gate-final' },
] as const;

for (const scenario of scenarios) {
  test(`boots ${scenario.stageId} through query override`, async ({ page }) => {
    await page.goto(`/?stage=${scenario.order}`);
    await expect(page.getByText(`Stage ${scenario.order}`)).toBeVisible();

    await expect.poll(async () => {
      return page.evaluate(() => ({
        stageId: document.body.dataset.stageId ?? '',
        stageObstacles: document.body.dataset.stageObstacles ?? '',
      }));
    }).toEqual({
      stageId: scenario.stageId,
      stageObstacles: scenario.obstacles,
    });

    await page.locator('canvas').dragTo(page.locator('canvas'), {
      sourcePosition: { x: 640, y: 620 },
      targetPosition: { x: 640, y: 200 },
    });

    await page.screenshot({
      path: `output/playwright/stage-${`${scenario.order}`.padStart(2, '0')}-direct-entry.png`,
      fullPage: true,
    });
  });
}
```

- [ ] **Step 2: Playwright 의존성이 없어 실패하는지 확인한다**

Run: `npm exec playwright test tests/e2e/stage-direct-entry.spec.ts`

Expected:
- `Cannot find module '@playwright/test'`
- 또는 `Unknown command "playwright"` if the package is not installed yet

- [ ] **Step 3: Playwright 스크립트, 설정, QA 템플릿을 추가한다**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "preview": "vite preview --host 127.0.0.1 --port 4174",
    "test:e2e:stages": "playwright test tests/e2e/stage-direct-entry.spec.ts"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.1"
  }
}
```

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm.cmd run preview',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

```md
## 2026-04-11 Stage Direct Entry Smoke

| Stage | URL | Expected obstacle ids | Screenshot |
| --- | --- | --- | --- |
| 1 | `/?stage=1` | `(none)` | `output/playwright/stage-01-direct-entry.png` |
| 2 | `/?stage=2` | `(none)` | `output/playwright/stage-02-direct-entry.png` |
| 3 | `/?stage=3` | `block-center` | `output/playwright/stage-03-direct-entry.png` |
| 4 | `/?stage=4` | `block-left,block-right` | `output/playwright/stage-04-direct-entry.png` |
| 5 | `/?stage=5` | `moving-slab` | `output/playwright/stage-05-direct-entry.png` |
| 6 | `/?stage=6` | `moving-panel,gate-final` | `output/playwright/stage-06-direct-entry.png` |
```

- [ ] **Step 4: Playwright 직접 진입 smoke를 실행한다**

Run:
- `npm.cmd install -D @playwright/test`
- `npx.cmd playwright install chromium`
- `npm exec playwright test tests/e2e/stage-direct-entry.spec.ts`

Expected:
- Stage 1~6 전부 PASS
- `output/playwright/stage-01-direct-entry.png` ~ `stage-06-direct-entry.png` 생성

- [ ] **Step 5: Playwright 검수 경로를 커밋한다**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/stage-direct-entry.spec.ts docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md
git commit -m "test: add direct-entry playwright smoke coverage"
```

### Task 7: 전체 통합 검증으로 머지 가능 상태를 확정한다

**Files:**
- Modify: `docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md`
- Review only: all files from Tasks 1~6

- [ ] **Step 1: 핵심 회귀 테스트 세트를 한 번에 실행한다**

Run:
- `npm exec vitest run tests/stages/resolveStageSelection.test.ts tests/stages/stageCatalog.test.ts tests/scenes/StageScene.test.ts tests/assets/stageArtGeometry.test.ts tests/assets/assetManifest.test.ts tests/render/stageSpriteLayout.test.ts tests/render/StageRenderer.theme.test.ts tests/runtime/commercialIntegration.test.ts`
- `npm.cmd run build`

Expected:
- Vitest PASS
- Vite build PASS with the raster assets emitted under `dist/assets`

- [ ] **Step 2: Stage 1과 Stage 6의 직접 진입 캡처를 QA 문서에 최종 반영한다**

```md
## Final verification notes

- Stage 1 confirms the shared office backplate with no obstacle overlays.
- Stage 6 confirms `moving-panel` and `gate-final` composition in the same office lane.
- `Game Over -> Retry` regression still passes after the raster art swap.
- Wind HUD remains visible and does not occlude the main throw lane on 1280x720.
```

- [ ] **Step 3: 최종 smoke를 다시 실행해 산출물을 잠근다**

Run:
- `npm exec playwright test tests/e2e/stage-direct-entry.spec.ts`
- `git status --short`

Expected:
- Playwright PASS
- 변경 파일이 계획한 코드/문서/자산 범위 안에만 남아 있음

- [ ] **Step 4: 통합 마감 커밋을 남긴다**

```bash
git add .
git commit -m "feat: add office direct-entry stage preview pipeline"
```

## Self-Review

### 1. Spec coverage
- Stage 1~6 전체 office 통일: `Task 1`
- `?stage=` 직접 진입: `Task 1`, `Task 2`
- Playwright Stage 1~6 직접 진입 검수: `Task 6`, `Task 7`
- 공용 오피스 배경 1세트 + 장애물 변주: `Task 3`, `Task 4`, `Task 5`
- 기하 우선 정렬, 쓰레기통/장애물 불일치 방지: `Task 3`, `Task 5`
- 스타일라이즈된 3D 게임풍 raster 리소스: `Task 4`

### 2. Placeholder scan
- `TBD`, `TODO`, `implement later` 같은 미정 문구를 넣지 않았다.
- 각 task에 정확한 파일, 테스트, 명령, 기대 결과를 적었다.
- binary asset 생성은 실제 파일 경로와 프롬프트 시트까지 명시했다.

### 3. Type consistency
- 직접 진입 해석기는 `resolveStageSelection(search, totalStages)`로 고정했고, `Task 1`과 `Task 2` 모두 같은 서명을 사용한다.
- Stage 디버그 게시 필드는 `stageId`, `stageOrder`, `stageSource`, `stageObstacles`로 일관되게 사용한다.
- obstacle 키는 `block-center`, `block-left`, `block-right`, `moving-slab`, `moving-panel`, `gate-final`과 대응하는 raster 키로 일관되게 매핑했다.
