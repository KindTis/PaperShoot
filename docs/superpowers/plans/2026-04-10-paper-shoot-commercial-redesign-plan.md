# PaperShoot Commercial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 MVP를 `데스크탑 디오라마`, `낮은 시점 원근`, `드래그-릴리즈 투척` 기준의 상용 감각 플레이 화면으로 재구성한다.

**Architecture:** 기존 Phaser + TypeScript 스택은 유지하되, 시뮬레이션은 계속 소스 오브 트루스로 두고 입력과 렌더를 상용 경험 기준으로 다시 자른다. 핵심은 `DragThrowController`, `desk-diorama-low` 카메라/레이아웃, 월드 중심 피드백, 에셋 매니페스트를 도입하고 `StageScene`에서만 통합하는 것이다.

**Tech Stack:** Phaser, TypeScript, Vite, Vitest, Playwright, DOM HUD, SVG placeholder assets

---

## Scope Guard

- 엔진은 Phaser를 유지한다. Three.js 전환은 이번 계획 범위가 아니다.
- 상용 감각을 만드는 것이 목표이며, 실사풍 복제는 목표가 아니다.
- 초기 에셋은 `AI 초안 생성 + 게임용 정리`를 위한 자리표시자 리소스와 샷 리스트까지만 포함한다.
- 멀티플레이, 메타 시스템, 자유 카메라, 접근성 전용 대체 입력은 이번 범위에 넣지 않는다.

## Planned File Structure

- Modify: `src/game/contracts.ts` — 상용 재설계용 카메라/입력/아트 계약 추가
- Create: `src/game/input/DragThrowController.ts` — 드래그-릴리즈 입력과 미리보기 계산
- Modify: `src/game/runtime/StageRuntime.ts`, `src/game/runtime/runtimeTypes.ts` — 드래그 입력 스냅샷과 전진형 투척 루프 반영
- Create: `src/game/render/cameraRig.ts`, `src/game/render/deskLayout.ts`, `src/game/render/renderTheme.ts` — 원근 카메라, 장면 배치, 색/재질 규칙
- Modify: `src/game/render/StageRenderer.ts` — 종이공, 그림자, 쓰레기통, 선풍기, 소품, 월드 피드백 렌더링
- Modify: `src/game/scenes/StageScene.ts` — 새 입력 모델과 최소 HUD 연결
- Modify: `src/game/hud/createHudRoot.ts`, `src/game/hud/HudPresenter.ts`, `src/app/style.css` — HUD 축소 및 모바일 레이아웃
- Create: `src/game/assets/assetManifest.ts`, `src/game/assets/loadStageArt.ts` — 리소스 키와 로더
- Create: `public/assets/papershoot/**` — 자리표시자 SVG 리소스
- Create: `docs/superpowers/assets/2026-04-10-paper-shoot-shot-list.md` — 생성 샷 리스트와 프롬프트
- Modify/Create tests under `tests/input`, `tests/render`, `tests/runtime`, `tests/hud`, `tests/assets`

## Parallel Agent Strategy

### Wave 0: 공유 계약 고정
- `Task 1`은 주 에이전트 단독 수행.
- 이 단계가 끝나기 전에는 아무도 `StageScene`, `StageRuntime`, `StageRenderer`를 건드리지 않는다.

### Wave 1: 독립 구현 구간
- Agent A: `Task 2` 입력 재설계 (`src/game/input/**`, `tests/input/**`)
- Agent B: `Task 3` 카메라/레이아웃 (`src/game/render/cameraRig.ts`, `src/game/render/deskLayout.ts`, `tests/render/**`)
- Agent C: `Task 6` 에셋 셸과 샷 리스트 (`src/game/assets/**`, `public/assets/**`, `docs/superpowers/assets/**`, `tests/assets/**`)

### Wave 2: 주 에이전트 통합
- `Task 4`, `Task 5`, `Task 7`은 주 에이전트 단독 수행.
- 이유: 시뮬레이션, 렌더, HUD, 씬이 한 지점에서 합쳐진다.

### Task 1: 상용 재설계용 공용 계약 고정

**Files:**
- Modify: `src/game/contracts.ts`
- Modify: `src/game/stages/buildBaseStage.ts`
- Modify: `src/game/stages/stage01.ts`
- Create: `tests/contracts/commercialRedesignContract.test.ts`

- [ ] **Step 1: 상용 재설계 계약 테스트를 먼저 작성한다**

```ts
import { describe, expect, it } from 'vitest';
import { stage01 } from '../../src/game/stages/stage01';

describe('commercial redesign contract', () => {
  it('uses desk diorama camera and drag-release input', () => {
    expect(stage01.cameraPreset).toBe('desk-diorama-low');
    expect(stage01.inputMode).toBe('drag_release');
    expect(stage01.artTheme).toBe('desk-diorama-paper');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/contracts/commercialRedesignContract.test.ts`
Expected: FAIL with `property inputMode does not exist`.

- [ ] **Step 3: 공용 타입과 기본 스테이지 값을 최소 구현한다**

```ts
export interface StageConfig {
  // ...existing fields...
  inputMode: 'drag_release';
  artTheme: 'desk-diorama-paper';
  cameraPreset: 'desk-diorama-low';
}
```

```ts
return {
  // ...existing defaults...
  inputMode: 'drag_release',
  artTheme: 'desk-diorama-paper',
  cameraPreset: 'desk-diorama-low',
};
```

- [ ] **Step 4: 계약 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/contracts/commercialRedesignContract.test.ts tests/contracts/contracts.test.ts`
Expected: PASS.

- [ ] **Step 5: 계약 변경을 커밋한다**

```bash
git add src/game/contracts.ts src/game/stages/buildBaseStage.ts src/game/stages/stage01.ts tests/contracts/commercialRedesignContract.test.ts
git commit -m "refactor: add commercial redesign stage contract"
```

### Task 2: 드래그-릴리즈 입력 컨트롤러로 교체

**Files:**
- Create: `src/game/input/DragThrowController.ts`
- Modify: `src/game/scenes/StageScene.ts`
- Modify: `src/game/runtime/runtimeTypes.ts`
- Create: `tests/input/DragThrowController.test.ts`

- [ ] **Step 1: 드래그 입력 실패 테스트를 작성한다**

```ts
const controller = new DragThrowController(stage01);
controller.beginDrag({ x: 0.5, y: 0.88 });
controller.updateDrag({ x: 0.62, y: 0.54 });
const preview = controller.getPreview();
expect(preview).toMatchObject({ active: true });
expect(preview.power01).toBeGreaterThan(0.4);
expect(preview.yawDeg).not.toBe(stage01.aim.defaultYawDeg);
const launch = controller.releaseDrag();
expect(launch).not.toBeNull();
expect(launch?.phaseAfterRelease).toBe('flying');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/input/DragThrowController.test.ts`
Expected: FAIL with `Cannot find module '../../src/game/input/DragThrowController'`.

- [ ] **Step 3: 최소 드래그 컨트롤러와 씬 바인딩을 구현한다**

```ts
export class DragThrowController {
  beginDrag(point: { x: number; y: number }): void { /* pointer capture start */ }
  updateDrag(point: { x: number; y: number }): void { /* derive yaw/pitch/power from drag vector */ }
  releaseDrag(): { yawDeg: number; pitchDeg: number; power: number; phaseAfterRelease: 'flying' } | null {
    if (!this.dragState.active) return null;
    return { yawDeg: this.preview.yawDeg, pitchDeg: this.preview.pitchDeg, power: this.preview.power01, phaseAfterRelease: 'flying' };
  }
}
```

```ts
this.input.on('pointerdown', (pointer) => dragController.beginDrag(normalize(pointer)));
this.input.on('pointermove', (pointer) => dragController.updateDrag(normalize(pointer)));
this.input.on('pointerup', () => this.runtime.releaseDragThrow(dragController.releaseDrag()));
```

- [ ] **Step 4: 입력 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/input/DragThrowController.test.ts tests/scenes/stageInputPolicy.test.ts`
Expected: PASS.

- [ ] **Step 5: 입력 재설계를 커밋한다**

```bash
git add src/game/input/DragThrowController.ts src/game/scenes/StageScene.ts src/game/runtime/runtimeTypes.ts tests/input/DragThrowController.test.ts
git commit -m "feat: replace staged buttons with drag release input"
```

### Task 3: 낮은 시점 원근 카메라와 데스크탑 디오라마 배치 추가

**Files:**
- Create: `src/game/render/cameraRig.ts`
- Create: `src/game/render/deskLayout.ts`
- Create: `src/game/render/renderTheme.ts`
- Modify: `src/game/render/StageRenderer.ts`
- Create: `tests/render/cameraRig.test.ts`
- Create: `tests/render/deskLayout.test.ts`

- [ ] **Step 1: 원근 카메라와 레이아웃 테스트를 작성한다**

```ts
const near = projectDeskPoint({ x: 0, y: 1.1, z: 1.2 }, viewport);
const far = projectDeskPoint({ x: 0, y: 1.1, z: 8.4 }, viewport);
expect(far.y).toBeLessThan(near.y);
expect(far.scale).toBeLessThan(near.scale);
const layout = createDeskLayout(viewport);
expect(layout.paperAnchor.y).toBeGreaterThan(viewport.height * 0.75);
expect(layout.binAnchor.y).toBeGreaterThan(viewport.height * 0.4);
expect(layout.binAnchor.y).toBeLessThan(viewport.height * 0.65);
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/render/cameraRig.test.ts tests/render/deskLayout.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: 카메라 투영과 장면 배치를 최소 구현한다**

```ts
export function projectDeskPoint(position: Vec3, viewport: { width: number; height: number }) {
  const depth = Math.max(1, position.z + 1.2);
  const scale = 1 / depth;
  return {
    x: viewport.width * 0.5 + position.x * 260 * scale,
    y: viewport.height * 0.88 - position.y * 180 * scale - position.z * 22,
    scale,
  };
}
```

```ts
export function createDeskLayout(viewport: { width: number; height: number }) {
  return {
    paperAnchor: { x: viewport.width * 0.5, y: viewport.height * 0.84 },
    binAnchor: { x: viewport.width * 0.56, y: viewport.height * 0.52 },
    fanAnchor: { x: viewport.width * 0.18, y: viewport.height * 0.78 },
  };
}
```

- [ ] **Step 4: 렌더 테스트를 통과시킨다**

Run: `npm exec vitest run tests/render/cameraRig.test.ts tests/render/deskLayout.test.ts`
Expected: PASS.

- [ ] **Step 5: 카메라와 배치 변경을 커밋한다**

```bash
git add src/game/render/cameraRig.ts src/game/render/deskLayout.ts src/game/render/renderTheme.ts src/game/render/StageRenderer.ts tests/render/cameraRig.test.ts tests/render/deskLayout.test.ts
git commit -m "feat: add desk diorama camera and layout"
```

### Task 4: 전진형 투척 체감으로 시뮬레이션과 런타임 보정

**Files:**
- Modify: `src/game/simulation/createLaunchVector.ts`
- Modify: `src/game/runtime/StageRuntime.ts`
- Modify: `src/game/runtime/runtimeTypes.ts`
- Create: `tests/runtime/StageRuntime.commercialFeel.test.ts`
- Modify: `tests/simulation/createLaunchVector.test.ts`

- [ ] **Step 1: 전진형 투척 회귀 테스트를 작성한다**

```ts
const runtime = new StageRuntime(stage01);
runtime.releaseDragThrow({ yawDeg: 4, pitchDeg: 38, power: 0.72, phaseAfterRelease: 'flying' });
const before = runtime.getSnapshot().activeBody?.position;
runtime.tick(150);
const after = runtime.getSnapshot().activeBody?.position;
expect(after!.z).toBeGreaterThan(before!.z + 0.8);
expect(after!.y).toBeGreaterThan(stage01.paper.radius);
expect(runtime.getSnapshot().failureReason).toBeNull();
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/runtime/StageRuntime.commercialFeel.test.ts tests/simulation/createLaunchVector.test.ts`
Expected: FAIL because `releaseDragThrow` does not exist or the z delta is too small.

- [ ] **Step 3: 전방 속도 우선과 드래그 발사 입력을 구현한다**

```ts
export function createLaunchVector(input: { yawDeg: number; pitchDeg: number; power: number; minPower: number; maxPower: number }) {
  const power01 = clamp((input.power - input.minPower) / (input.maxPower - input.minPower), 0, 1);
  const launchSpeed = 10.5 + 8.5 * power01;
  const yawRad = degToRad(input.yawDeg);
  const pitchRad = degToRad(input.pitchDeg);
  const flatSpeed = launchSpeed * Math.cos(pitchRad);
  return {
    x: Math.sin(yawRad) * flatSpeed,
    y: launchSpeed * Math.sin(pitchRad),
    z: Math.cos(yawRad) * flatSpeed,
  };
}
```

```ts
releaseDragThrow(launch: { yawDeg: number; pitchDeg: number; power: number; phaseAfterRelease: 'flying' } | null): void {
  if (!launch || this.stageStatus !== 'playing') return;
  this.throwIndex += 1;
  this.activeBody = {
    position: cloneVec3(this.stage.paper.spawn),
    velocity: createLaunchVector({ ...launch, minPower: this.stage.power.minPower, maxPower: this.stage.power.maxPower }),
    elapsedMs: 0,
    binState: 'Outside',
    insideBinMs: 0,
  };
}
```

- [ ] **Step 4: 시뮬레이션과 런타임 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/runtime/StageRuntime.commercialFeel.test.ts tests/runtime/StageRuntime.test.ts tests/simulation/createLaunchVector.test.ts`
Expected: PASS.

- [ ] **Step 5: 전진형 투척 보정을 커밋한다**

```bash
git add src/game/simulation/createLaunchVector.ts src/game/runtime/StageRuntime.ts src/game/runtime/runtimeTypes.ts tests/runtime/StageRuntime.commercialFeel.test.ts tests/simulation/createLaunchVector.test.ts
git commit -m "feat: tune forward flight for commercial throw feel"
```

### Task 5: HUD 축소와 월드 중심 피드백으로 재구성

**Files:**
- Modify: `src/game/hud/createHudRoot.ts`
- Modify: `src/game/hud/HudPresenter.ts`
- Modify: `src/app/style.css`
- Modify: `src/game/render/StageRenderer.ts`
- Create: `tests/hud/HudPresenter.commercial.test.ts`

- [ ] **Step 1: 최소 HUD 실패 테스트를 작성한다**

```ts
presenter.render({
  stageLabel: 'Stage 1',
  throwText: '1 / 3',
  successText: '0 / 1',
  windText: 'weak wind',
  aimText: '',
  powerText: '',
  failureReasonText: '',
  resultBannerText: '약한 바람에서 기본 투척 감각을 익힌다.',
});
expect(root.stageValue.textContent).toContain('Stage 1');
expect(root.throwValue.textContent).toContain('1 / 3');
expect(root.aimValue.textContent).toBe('');
expect(root.powerValue.textContent).toBe('');
expect(root.failureReason.textContent).toBe('');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/hud/HudPresenter.commercial.test.ts`
Expected: FAIL because the current HUD still renders debug-heavy defaults.

- [ ] **Step 3: 최소 HUD와 월드 피드백을 구현한다**

```ts
this.root.stageValue.textContent = view.stageLabel;
this.root.throwValue.textContent = view.throwText;
this.root.successValue.textContent = view.successText;
this.root.windValue.textContent = view.windText;
this.root.aimValue.textContent = '';
this.root.powerValue.textContent = '';
this.root.failureReason.textContent = '';
this.root.resultBanner.textContent = view.resultBannerText;
```

```css
.hud-bottom [data-role='aim'],
.hud-bottom [data-role='power'],
.hud-bottom [data-role='failure'] {
  display: none;
}
```

- [ ] **Step 4: HUD 테스트를 다시 실행한다**

Run: `npm exec vitest run tests/hud/HudPresenter.commercial.test.ts tests/hud/HudPresenter.test.ts`
Expected: PASS.

- [ ] **Step 5: HUD 축소를 커밋한다**

```bash
git add src/game/hud/createHudRoot.ts src/game/hud/HudPresenter.ts src/app/style.css src/game/render/StageRenderer.ts tests/hud/HudPresenter.commercial.test.ts
git commit -m "refactor: reduce hud and favor in-world feedback"
```

### Task 6: 에셋 매니페스트와 자리표시자 리소스 셸 추가

**Files:**
- Create: `src/game/assets/assetManifest.ts`
- Create: `src/game/assets/loadStageArt.ts`
- Create: `public/assets/papershoot/paper/paper-ball.svg`
- Create: `public/assets/papershoot/bin/trash-bin.svg`
- Create: `public/assets/papershoot/fan/desk-fan.svg`
- Create: `public/assets/papershoot/props/cup.svg`
- Create: `public/assets/papershoot/props/pencil-cup.svg`
- Create: `docs/superpowers/assets/2026-04-10-paper-shoot-shot-list.md`
- Create: `tests/assets/assetManifest.test.ts`

- [ ] **Step 1: 에셋 매니페스트 테스트를 작성한다**

```ts
import { assetManifest } from '../../src/game/assets/assetManifest';

expect(assetManifest.paper.idle).toBe('/assets/papershoot/paper/paper-ball.svg');
expect(assetManifest.bin.main).toBe('/assets/papershoot/bin/trash-bin.svg');
expect(assetManifest.fan.main).toBe('/assets/papershoot/fan/desk-fan.svg');
expect(assetManifest.props).toContain('/assets/papershoot/props/cup.svg');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/assets/assetManifest.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: 매니페스트, 로더, 자리표시자 리소스를 추가한다**

```ts
export const assetManifest = {
  paper: { idle: '/assets/papershoot/paper/paper-ball.svg' },
  bin: { main: '/assets/papershoot/bin/trash-bin.svg' },
  fan: { main: '/assets/papershoot/fan/desk-fan.svg' },
  props: ['/assets/papershoot/props/cup.svg', '/assets/papershoot/props/pencil-cup.svg'],
} as const;
```

```ts
export function queueStageArt(loader: Phaser.Loader.LoaderPlugin) {
  loader.svg('paper-ball', assetManifest.paper.idle);
  loader.svg('trash-bin', assetManifest.bin.main);
  loader.svg('desk-fan', assetManifest.fan.main);
}
```

- [ ] **Step 4: 에셋 테스트와 샷 리스트 문서를 확인한다**

Run: `npm exec vitest run tests/assets/assetManifest.test.ts`
Expected: PASS.

- [ ] **Step 5: 에셋 셸을 커밋한다**

```bash
git add src/game/assets public/assets/papershoot docs/superpowers/assets/2026-04-10-paper-shoot-shot-list.md tests/assets/assetManifest.test.ts
git commit -m "feat: add commercial art manifest and placeholder assets"
```

### Task 7: 씬 통합과 모바일 플레이테스트 기준선 정리

**Files:**
- Modify: `src/game/scenes/StageScene.ts`
- Modify: `src/app/createGameApp.ts`
- Modify: `docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md`
- Create: `tests/runtime/commercialIntegration.test.ts`

- [ ] **Step 1: 통합 회귀 테스트를 작성한다**

```ts
const runtime = new StageRuntime(stage01);
runtime.releaseDragThrow({ yawDeg: 2, pitchDeg: 40, power: 0.68, phaseAfterRelease: 'flying' });
runtime.tick(300);
const snapshot = runtime.getSnapshot();
expect(snapshot.activeBody?.position.z).toBeGreaterThan(stage01.paper.spawn.z + 1.2);
expect(snapshot.resultOverlay.kind).toBeNull();
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm exec vitest run tests/runtime/commercialIntegration.test.ts`
Expected: FAIL until StageScene and runtime wiring are aligned.

- [ ] **Step 3: 씬 통합과 QA 체크리스트를 정리한다**

```ts
create(): void {
  this.stageRenderer = new StageRenderer(this, stageCatalog[0]);
  this.hudRoot = createHudRoot(document);
  this.hud = new HudPresenter(this.hudRoot);
  this.bindDragInput();
  this.renderFrame();
}
```

```md
- [ ] 모바일 세로 화면에서 종이공 시작점이 하단 중앙에 보이는가
- [ ] 쓰레기통이 첫 시선에 읽히는가
- [ ] 드래그 방향과 실제 비행 방향이 일치하는가
- [ ] 종이공이 먼저 전진하고 나중에 낙하하는가
```

- [ ] **Step 4: 전체 테스트와 빌드, 플레이테스트를 실행한다**

Run: `npm test && npm run build`
Expected: PASS.

Run: `npx playwright screenshot https://kindtis.github.io/PaperShoot/ output/playwright/papershoot-commercial-check.png`
Expected: screenshot saved successfully.

- [ ] **Step 5: 통합 완료를 커밋한다**

```bash
git add src/game/scenes/StageScene.ts src/app/createGameApp.ts docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md tests/runtime/commercialIntegration.test.ts
git commit -m "feat: integrate commercial PaperShoot play loop"
```

## Self-Review

- Spec coverage:
  - 아트 리소스: Task 6
  - 공간감과 카메라: Task 3
  - 입력과 투척 감각: Task 2, Task 4
  - HUD 축소: Task 5
  - 시스템 구조 변경: Task 1, Task 7
- Placeholder scan:
  - `TODO`, `TBD`, `implement later` 없음
  - 각 Task는 구체 코드와 명령 포함
- Type consistency:
  - `inputMode`, `artTheme`, `cameraPreset`는 Task 1에서 정의 후 이후 Task들이 동일 이름 사용
  - `releaseDragThrow`는 Task 4에서 정의하고 Task 7이 동일 이름 사용

