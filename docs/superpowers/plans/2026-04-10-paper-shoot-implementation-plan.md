# PaperShoot MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phaser + TypeScript + Vite 기반으로, spec의 고정 스텝 투척/바람/쓰레기통 판정을 갖는 `PaperShoot` MVP를 Stage 1~6까지 플레이 가능한 상태로 구현한다.

**Architecture:** Phaser는 씬과 렌더링만 담당하고, 실제 규칙은 커스텀 시뮬레이션 데이터가 소스 오브 트루스가 된다. `StageRuntime`, `simulation`, `collision`, `input/hud`, `stage data`를 분리해 병렬 작업 시 파일 충돌을 줄이고 마지막에 `StageScene`에서 통합한다.

**Tech Stack:** Phaser, TypeScript, Vite, Vitest, DOM HUD, CSS

---

## Scope Guard

- 첫 구현은 `React`를 도입하지 않는다. HUD는 DOM + presenter로 유지한다.
- Phaser 기본 물리 엔진은 사용하지 않는다.
- 바람은 `x` 편차와 `gravityScale`에만 영향을 준다.
- 성공/실패 판정은 `binary_success`만 지원한다.
- 구현 순서는 spec 21장의 Stage 1~3 우선 원칙을 따른다.

## Planned File Structure

- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`: 툴링
- `index.html`, `src/main.ts`, `src/app/createGameApp.ts`, `src/app/style.css`: 앱 부트스트랩
- `src/game/contracts.ts`: spec 기반 공용 타입
- `src/game/scenes/BootScene.ts`, `src/game/scenes/StageScene.ts`: Phaser 씬
- `src/game/runtime/StageRuntime.ts`, `src/game/runtime/runtimeTypes.ts`: 월드 상태와 투척 루프
- `src/game/simulation/*`: 발사 벡터, 바람, 고정 스텝 이동
- `src/game/collision/*`, `src/game/scoring/*`: 충돌, 쓰레기통 상태 머신, 실패 원인
- `src/game/input/*`, `src/game/hud/*`, `src/game/render/*`: 입력, HUD, 2.5D 투영 표현
- `src/game/stages/*`, `src/game/obstacles/*`: StageConfig와 장애물 이동
- `tests/**`: `src`와 같은 경로 구조의 단위/통합 테스트
- `docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md`: 수동 스모크 체크리스트

## Parallel Agent Strategy

### Wave 0: 공유 기반 고정
- `Task 1`은 주 에이전트 단독 수행.
- 이 단계에서 디렉터리 구조와 `src/game/contracts.ts`를 고정한다.

### Wave 1: 병렬 안전 구간
- Agent A: `Task 2` (`src/game/simulation/**`, `tests/simulation/**`)
- Agent B: `Task 3` (`src/game/input/**`, `src/game/hud/**`, `tests/input/**`, `tests/hud/**`)
- Agent C: `Task 4` (`src/game/stages/**`, `tests/stages/**`)
- Agent D: `Task 5` (`src/game/collision/**`, `src/game/scoring/**`, `tests/collision/**`, `tests/scoring/**`)

규칙:
- Wave 1 에이전트는 `src/game/contracts.ts`를 수정하지 않는다.
- 공용 타입 변경이 필요하면 새 로컬 타입을 만들지 말고 주 에이전트에 인터페이스 변경을 요청한다.
- 최종 통합 검증은 주 에이전트가 한다.

### Wave 2: 공유 상태 통합
- `Task 6`은 주 에이전트 단독 수행.
- 이유: `StageRuntime`, `StageScene`, `StageRenderer`는 모든 lane이 만나는 공유 지점이다.

### Wave 3: 후반 콘텐츠 확장
- 기본은 `Task 7`, `Task 8`도 주 에이전트 단독 수행.
- 일정 압박이 있을 때만 `Task 7`을 `obstacle motion`과 `stage04~06 data` 두 갈래로 좁게 나눈다.

### Task 1: 프로젝트 부트스트랩과 공용 계약 고정

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`
- Create: `index.html`, `src/main.ts`, `src/app/createGameApp.ts`, `src/app/style.css`
- Create: `src/game/contracts.ts`
- Create: `tests/app/createGameApp.test.ts`, `tests/contracts/contracts.test.ts`

- [ ] **Step 1: 툴링과 스크립트를 만든다**

```bash
npm init -y
npm install phaser
npm install -D typescript vite vitest jsdom @types/node
```

`package.json` scripts는 아래로 고정한다.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: app config와 공용 계약의 실패 테스트를 먼저 작성한다**

```ts
import { describe, expect, it } from 'vitest';
import { getAppConfig } from '../../src/app/createGameApp';

describe('getAppConfig', () => {
  it('uses app and hud roots together', () => {
    expect(getAppConfig()).toEqual({
      parentId: 'app',
      hudRootId: 'hud-root',
      sceneKeys: ['BootScene', 'StageScene'],
    });
  });
});
```

```ts
import type { FailureReason, ThrowPhase } from '../../src/game/contracts';

const phases: ThrowPhase[] = ['aim', 'power', 'flying', 'resolved'];
const reasons: FailureReason[] = ['rim_reject', 'obstacle_block', 'wind_push', 'power_low', 'power_high', 'ground_hit', 'out_of_bounds', 'time_expired', null];
```

- [ ] **Step 3: 최소 앱 셸과 공용 타입을 구현한다**

```ts
export function getAppConfig() {
  return {
    parentId: 'app' as const,
    hudRootId: 'hud-root' as const,
    sceneKeys: ['BootScene', 'StageScene'] as const,
  };
}
```

```ts
export interface Vec3 { x: number; y: number; z: number; }
export type ThrowPhase = 'aim' | 'power' | 'flying' | 'resolved';
export type FailureReason = 'rim_reject' | 'obstacle_block' | 'wind_push' | 'power_low' | 'power_high' | 'ground_hit' | 'out_of_bounds' | 'time_expired' | null;
export interface StageConfig {
  id: string;
  order: number;
  theme: 'room' | 'office' | 'classroom' | 'cafe';
  clear: { throwLimit: number; requiredSuccesses: number };
  retryPolicy: { resetThrowOnly: true; keepWorldTimeOnRetry: true };
  aim: { yawMinDeg: number; yawMaxDeg: number; pitchMinDeg: number; pitchMaxDeg: number; defaultYawDeg: number; defaultPitchDeg: number };
  power: { mode: 'ping_pong'; minPower: number; maxPower: number; gaugeSpeed: number; startPower: number };
  paper: { spawn: Vec3; radius: number };
  physics: { fixedDtSec: number; gravityY: number; linearDrag: number; maxFallSpeed: number; obstacleRestitution: number; rimRestitution: number; tangentialDamping: number; minSeparationSpeed: number; maxFlightTimeMs: number };
  fan: { enabled: boolean; position: Vec3; directionDeg: number; strength: number; strengthLabel: 'weak' | 'medium' | 'strong'; targetLateralSpeed: number; windResponse: number; gravityScaleInZone: number; influenceShape: 'box' | 'cone'; influenceLength: number; influenceWidth: number; influenceHeight: number; feather: number; showParticles: boolean };
  obstacles: Array<{ id: string; kind: 'static_block' | 'moving_block' | 'narrow_gate'; position: Vec3; size: Vec3; motion: { type: 'none' | 'ping_pong_x' | 'ping_pong_y'; amplitude: number; durationMs: number; phaseMs: number; timeSource: 'world_time' } }>;
  bin: { position: Vec3; openingWidth: number; openingHeight: number; innerDepth: number; depthTolerance: number; rimThickness: number; entryAssistRadius: number; entrySpeedMin: number; entrySpeedMax: number; settleTimeMs: number };
  assists: { showGuideArc: boolean; showFailureReason: boolean; showAimReticle: boolean };
  score: { mode: 'binary_success'; successValue: 1; failureValue: 0 };
  cameraPreset: 'semi-fps-default';
  tutorialText?: string;
  clearConditionText: string;
}
```

- [ ] **Step 4: 기초 테스트와 빌드를 확인한다**

```bash
npm exec vitest run tests/app/createGameApp.test.ts tests/contracts/contracts.test.ts
npm run build
```

Expected: `test files passed`, `vite build completed successfully`

- [ ] **Step 5: 기초 계약을 커밋한다**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts index.html src/main.ts src/app/createGameApp.ts src/app/style.css src/game/contracts.ts tests/app/createGameApp.test.ts tests/contracts/contracts.test.ts
git commit -m "chore: bootstrap PaperShoot MVP shell"
```

### Task 2: 결정적 시뮬레이션 코어 구현

**Files:**
- Create: `src/game/simulation/createLaunchVector.ts`
- Create: `src/game/simulation/applyWindZone.ts`
- Create: `src/game/simulation/advanceThrowStep.ts`
- Create: `tests/simulation/createLaunchVector.test.ts`
- Create: `tests/simulation/applyWindZone.test.ts`
- Create: `tests/simulation/advanceThrowStep.test.ts`

- [ ] **Step 1: 발사 벡터, 바람 적용, 고정 스텝 실패 테스트를 작성한다**

```ts
expect(createLaunchVector({ yawDeg: 0, pitchDeg: 30, power: 0.5, minPower: 0, maxPower: 1 })).toMatchObject({ x: 0, y: 6.25, z: 10.83 });
const forwardFan = { ...fan, directionDeg: 0 };
const rightFan = { ...fan, directionDeg: 90 };
expect(applyWindZone({ bodyPosition: { x: 0, y: 1.4, z: 3.4 }, fan: forwardFan }).gravityScale).toBeCloseTo(0.88, 2);
expect(applyWindZone({ bodyPosition: { x: 0, y: 1.4, z: 3.4 }, fan: forwardFan }).windTargetX).toBeLessThan(0);
expect(applyWindZone({ bodyPosition: { x: 3.4, y: 1.4, z: 0 }, fan: rightFan }).windTargetX).toBeLessThan(0);
expect(applyWindZone({ bodyPosition: { x: 0, y: 1.4, z: 3.4 }, fan: rightFan }).windTargetX).toBe(0);
expect(applyWindZone({ bodyPosition: { x: 1.29, y: 1.4, z: 3.4 }, fan: forwardFan }).windTargetX).toBeLessThan(0);
expect(applyWindZone({ bodyPosition: { x: 1.6, y: 1.4, z: 3.4 }, fan: forwardFan }).windTargetX).toBe(0);
expect(applyWindZone({ bodyPosition: { x: 0, y: 1.4, z: 6.8 }, fan: forwardFan }).gravityScale).toBe(1);
const center = applyWindZone({ bodyPosition: { x: 0.0, y: 1.4, z: 3.4 }, fan: forwardFan });
const edge = applyWindZone({ bodyPosition: { x: 1.29, y: 1.4, z: 3.4 }, fan: forwardFan });
expect(Math.abs(edge.windTargetX)).toBeLessThan(Math.abs(center.windTargetX));
expect(edge.gravityScale).toBeGreaterThan(center.gravityScale);
expect(advanceThrowStep(input).velocity.y).toBeGreaterThanOrEqual(-18);
```

- [ ] **Step 2: 테스트가 실패하는지 먼저 확인한다**

```bash
npm exec vitest run tests/simulation/createLaunchVector.test.ts tests/simulation/applyWindZone.test.ts tests/simulation/advanceThrowStep.test.ts
```

Expected: `FAIL with module not found / exported member not found`

- [ ] **Step 3: spec 공식 그대로 최소 구현을 작성한다**

```ts
const power01 = clamp((power - minPower) / (maxPower - minPower), 0, 1);
const launchSpeed = 9.5 + (15.5 - 9.5) * power01;
const worldOffset = subtract(bodyPosition, fan.position);
const localOffset = rotateY(worldOffset, -degToRad(fan.directionDeg));
velocity.y += gravityY * gravityScale * dtSec;
velocity.x += (windTargetX - velocity.x) * windResponse * dtSec;
velocity.y = Math.max(velocity.y, maxFallSpeed);
// local +z = influenceLength, local x/y = width/height, feather는 경계 선형 감쇠로 적용
// feather 구간에서는 windTargetX 절대값이 중심보다 작아지고 gravityScale은 1.0에 가까워져야 한다
```

- [ ] **Step 4: 시뮬레이션 테스트를 통과시킨다**

```bash
npm exec vitest run tests/simulation/createLaunchVector.test.ts tests/simulation/applyWindZone.test.ts tests/simulation/advanceThrowStep.test.ts
```

Expected: `3 test files passed`

- [ ] **Step 5: 시뮬레이션 코어를 커밋한다**

```bash
git add src/game/simulation tests/simulation
git commit -m "feat: add deterministic throw simulation core"
```
### Task 3: 입력 상태 머신과 HUD 셸 구현

**Files:**
- Create: `src/game/input/ThrowInputController.ts`
- Create: `src/game/hud/createHudRoot.ts`
- Create: `src/game/hud/HudPresenter.ts`
- Modify: `src/app/style.css`
- Create: `tests/input/ThrowInputController.test.ts`
- Create: `tests/hud/HudPresenter.test.ts`

- [ ] **Step 1: 2단계 확정형 입력과 HUD 반영 테스트를 작성한다**

```ts
const controller = new ThrowInputController(config);
controller.updateAimFromNormalizedPoint({ x: 0.75, y: 0.25 });
controller.confirmAim();
controller.tick(200);
controller.confirmPower();
expect(controller.getSnapshot().phase).toBe('flying');
```

```ts
presenter.render({
  stageLabel: 'Stage 3',
  throwText: '2 / 4',
  successText: '0 / 1',
  windText: '강한 바람 / 오른쪽',
  aimText: 'Yaw +6 / Pitch 32',
  powerText: 'Power 74%',
  failureReasonText: '장애물에 막힘',
  resultBannerText: '',
});
expect(root.stageValue.textContent).toBe('Stage 3');
expect(root.throwValue.textContent).toBe('2 / 4');
expect(root.successValue.textContent).toBe('0 / 1');
expect(root.windValue.textContent).toContain('강한 바람');
expect(root.aimValue.textContent).toContain('Yaw +6');
expect(root.powerValue.textContent).toContain('74%');
expect(root.failureReason.textContent).toContain('장애물');
expect(root.resultBanner.textContent).toBe('');
```

```ts
const root = createHudRoot(document);
const controller = new ThrowInputController(config);

controller.bindTouchButtons({
  confirmAimButton: root.confirmAimButton,
  confirmPowerButton: root.confirmPowerButton,
  retryButton: root.retryButton,
});

root.confirmAimButton.click();
expect(controller.getSnapshot().phase).toBe('power');

root.confirmPowerButton.click();
expect(controller.getSnapshot().phase).toBe('flying');

root.retryButton.click();
expect(controller.getSnapshot().phase).toBe('aim');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm exec vitest run tests/input/ThrowInputController.test.ts tests/hud/HudPresenter.test.ts
```

Expected: `FAIL with missing controller / presenter modules`

- [ ] **Step 3: 입력 상태 머신과 DOM HUD 최소 구현을 작성한다**

```ts
export class ThrowInputController {
  updateAimFromNormalizedPoint(point: { x: number; y: number }): void { /* normalized 입력을 yaw/pitch로 변환 */ }
  tick(deltaMs: number): void { /* power phase에서 ping-pong 게이지 갱신 */ }
  confirmAim(): void { if (this.phase === 'aim') this.phase = 'power'; }
  confirmPower(): void { if (this.phase === 'power') this.phase = 'flying'; }
  resetForRetry(): void { this.phase = 'aim'; this.power = this.config.startPower; }
  getSnapshot(): ThrowInputSnapshot { /* phase, yawDeg, pitchDeg, power 반환 */ }
  bindPointerHandlers(input: Phaser.Input.InputPlugin): void { /* mouse + keyboard 연결 */ }
  bindTouchButtons(buttons: {
    confirmAimButton: HTMLButtonElement;
    confirmPowerButton: HTMLButtonElement;
    retryButton: HTMLButtonElement;
  }): void { /* touch 전용 액션 버튼 연결 */ }
}
```

```ts
export function createHudRoot(doc: Document) {
  const root = doc.createElement('div');
  root.id = 'hud-root';
  root.innerHTML = `
    <div class="hud-top">
      <span data-role="stage"></span>
      <span data-role="throws"></span>
      <span data-role="success"></span>
    </div>
    <div class="hud-side">
      <span data-role="wind"></span>
    </div>
    <div class="hud-bottom">
      <span data-role="aim"></span>
      <span data-role="power"></span>
      <span data-role="failure"></span>
    </div>
    <div class="hud-actions">
      <button data-role="confirm-aim">확정</button>
      <button data-role="confirm-power">던지기</button>
      <button data-role="retry">재시도</button>
    </div>
    <div class="hud-result" data-role="result"></div>
  `;
  doc.body.appendChild(root);
  return {
    element: root,
    stageValue: root.querySelector('[data-role="stage"]')!,
    throwValue: root.querySelector('[data-role="throws"]')!,
    successValue: root.querySelector('[data-role="success"]')!,
    windValue: root.querySelector('[data-role="wind"]')!,
    aimValue: root.querySelector('[data-role="aim"]')!,
    powerValue: root.querySelector('[data-role="power"]')!,
    failureReason: root.querySelector('[data-role="failure"]')!,
    confirmAimButton: root.querySelector('[data-role="confirm-aim"]')!,
    confirmPowerButton: root.querySelector('[data-role="confirm-power"]')!,
    retryButton: root.querySelector('[data-role="retry"]')!,
    resultBanner: root.querySelector('[data-role="result"]')!,
  };
}
```

```ts
export class HudPresenter {
  render(view: HudViewModel): void {
    this.root.stageValue.textContent = view.stageLabel;
    this.root.throwValue.textContent = view.throwText;
    this.root.successValue.textContent = view.successText;
    this.root.windValue.textContent = view.windText;
    this.root.aimValue.textContent = view.aimText;
    this.root.powerValue.textContent = view.powerText;
    this.root.failureReason.textContent = view.failureReasonText;
    this.root.resultBanner.textContent = view.resultBannerText;
  }
}
```

- [ ] **Step 4: 입력/HUD 테스트를 통과시킨다**

```bash
npm exec vitest run tests/input/ThrowInputController.test.ts tests/hud/HudPresenter.test.ts
```

Expected: `2 test files passed`

- [ ] **Step 5: 입력/HUD 셸을 커밋한다**

```bash
git add src/game/input src/game/hud src/app/style.css tests/input tests/hud
git commit -m "feat: add throw input controller and DOM HUD shell"
```

### Task 3 입력 매핑 고정안

| 플랫폼 | 조준 | 1차 확정 | 파워 진행 | 2차 확정 | 재시도 |
| --- | --- | --- | --- | --- | --- |
| Mouse | 포인터 이동 | 좌클릭 | 자동 ping-pong | 좌클릭 | `R` |
| Touch | 좌측 플레이필드 드래그 | 우하단 `확정` 버튼 탭 | 자동 ping-pong | 우하단 `던지기` 버튼 탭 | 좌하단 `재시도` 버튼 탭 |
| Keyboard | 화살표/WASD | `Space` | 자동 ping-pong | `Space` | `R` |

모든 플랫폼은 동일한 `confirmAim -> confirmPower` 상태 머신을 공유한다.
터치는 `손을 떼면 확정`을 쓰지 않는다. 의도치 않은 확정을 막기 위해 명시적 버튼으로만 확정한다.
`createHudRoot()`는 touch 액션 버튼을 항상 만들고, `ThrowInputController.bindTouchButtons()`가 이 버튼들을 상태 머신에 연결한다.

### Task 4: StageRepository와 Stage 1~3 데이터 구현

**Files:**
- Create: `src/game/stages/buildBaseStage.ts`
- Create: `src/game/stages/stageValidator.ts`
- Create: `src/game/stages/stage01.ts`
- Create: `src/game/stages/stage02.ts`
- Create: `src/game/stages/stage03.ts`
- Create: `src/game/stages/stageCatalog.ts`
- Create: `tests/stages/stageCatalog.test.ts`

- [ ] **Step 1: stage schema 검증과 Stage 1~3 카탈로그 테스트를 작성한다**

```ts
expect(stageCatalog.slice(0, 3).map((stage) => stage.id)).toEqual(['stage-01', 'stage-02', 'stage-03']);
expect(stageCatalog[0].fan.strengthLabel).toBe('weak');
expect(stageCatalog[1].fan.strengthLabel).toBe('strong');
expect(stageCatalog[2].obstacles).toHaveLength(1);
expect(() => validateStageCatalog(stageCatalog.slice(0, 3))).not.toThrow();
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm exec vitest run tests/stages/stageCatalog.test.ts
```

Expected: `FAIL with missing stage catalog / validator modules`

- [ ] **Step 3: 공통 빌더와 Stage 1~3 데이터를 작성한다**

```ts
export function buildBaseStage(input: Pick<StageConfig, 'id' | 'order' | 'theme' | 'clear' | 'fan' | 'obstacles' | 'tutorialText' | 'clearConditionText'>): StageConfig {
  return {
    ...input,
    score: { mode: 'binary_success', successValue: 1, failureValue: 0 },
    retryPolicy: { resetThrowOnly: true, keepWorldTimeOnRetry: true },
    aim: { yawMinDeg: -18, yawMaxDeg: 18, pitchMinDeg: 18, pitchMaxDeg: 54, defaultYawDeg: 0, defaultPitchDeg: 30 },
    power: { mode: 'ping_pong', minPower: 0.25, maxPower: 1, gaugeSpeed: 1.5, startPower: 0.55 },
    paper: { spawn: { x: 0, y: 1.45, z: 0.65 }, radius: 0.11 },
    physics: { fixedDtSec: 1 / 60, gravityY: -22, linearDrag: 1.35, maxFallSpeed: -18, obstacleRestitution: 0.22, rimRestitution: 0.34, tangentialDamping: 0.84, minSeparationSpeed: 2.4, maxFlightTimeMs: 4000 },
    bin: { position: { x: 0.2, y: 0.85, z: 8.8 }, openingWidth: 0.9, openingHeight: 1.05, innerDepth: 0.9, depthTolerance: 0.35, rimThickness: 0.08, entryAssistRadius: 0.18, entrySpeedMin: 2, entrySpeedMax: 11.5, settleTimeMs: 120 },
    assists: { showGuideArc: true, showFailureReason: true, showAimReticle: true },
    cameraPreset: 'semi-fps-default',
  };
}
```

```ts
export const stage01 = buildBaseStage({ id: 'stage-01', order: 1, theme: 'room', clear: { throwLimit: 3, requiredSuccesses: 1 }, fan: { enabled: true, position: { x: -1.4, y: 1.35, z: 2.1 }, directionDeg: 90, strength: 1, strengthLabel: 'weak', targetLateralSpeed: 1.2, windResponse: 6, gravityScaleInZone: 0.96, influenceShape: 'box', influenceLength: 4.2, influenceWidth: 2.6, influenceHeight: 2.2, feather: 0.3, showParticles: true }, obstacles: [], tutorialText: '약한 바람에서 기본 투척 감각을 익힌다.', clearConditionText: '3번 안에 1회 성공' });
export const stage02 = buildBaseStage({ id: 'stage-02', order: 2, theme: 'room', clear: { throwLimit: 3, requiredSuccesses: 1 }, fan: { enabled: true, position: { x: -1.4, y: 1.35, z: 2.1 }, directionDeg: 90, strength: 1, strengthLabel: 'strong', targetLateralSpeed: 3.4, windResponse: 8, gravityScaleInZone: 0.88, influenceShape: 'box', influenceLength: 4.2, influenceWidth: 2.6, influenceHeight: 2.2, feather: 0.3, showParticles: true }, obstacles: [], tutorialText: '강한 바람 보정을 익힌다.', clearConditionText: '3번 안에 1회 성공' });
export const stage03 = buildBaseStage({ id: 'stage-03', order: 3, theme: 'office', clear: { throwLimit: 4, requiredSuccesses: 1 }, fan: { enabled: true, position: { x: -1.4, y: 1.35, z: 2.1 }, directionDeg: 90, strength: 1, strengthLabel: 'strong', targetLateralSpeed: 3.4, windResponse: 8, gravityScaleInZone: 0.88, influenceShape: 'box', influenceLength: 4.2, influenceWidth: 2.6, influenceHeight: 2.2, feather: 0.3, showParticles: true }, obstacles: [{ id: 'block-center', kind: 'static_block', position: { x: 0.1, y: 1.2, z: 5.3 }, size: { x: 0.8, y: 1.0, z: 0.4 }, motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' } }], tutorialText: '강한 바람과 고정 장애물을 함께 읽는다.', clearConditionText: '4번 안에 1회 성공' });
```

- [ ] **Step 4: stage catalog 테스트를 통과시킨다**

```bash
npm exec vitest run tests/stages/stageCatalog.test.ts
```

Expected: `1 test file passed`

- [ ] **Step 5: Stage 1~3 데이터를 커밋한다**

```bash
git add src/game/stages tests/stages
git commit -m "feat: add stage repository and tutorial stage data"
```

### Task 5: 충돌 응답, 쓰레기통 상태 머신, 실패 원인 우선순위 구현

**Files:**
- Create: `src/game/collision/resolveObstacleCollision.ts`
- Create: `src/game/collision/binStateMachine.ts`
- Create: `src/game/scoring/selectFailureReason.ts`
- Create: `tests/collision/resolveObstacleCollision.test.ts`
- Create: `tests/collision/binStateMachine.test.ts`
- Create: `tests/scoring/selectFailureReason.test.ts`

- [ ] **Step 1: 이동 장애물 충돌, InsideBin, 실패 원인 우선순위 테스트를 작성한다**

```ts
expect(updateBinState(tooSlowInput).state).toBe('RimContact');
expect(updateBinState(tooFastInput).state).toBe('RimContact');
expect(updateBinState(outsideOpeningInput).state).toBe('RimContact');
expect(updateBinState(validEntryInput).state).toBe('EntryCandidate');
expect(updateBinState(assistButOutsideOpeningInput).state).not.toBe('EntryCandidate');
expect(updateBinState(insideDepthInput).state).toBe('SuccessLatched');
expect(updateBinState(insideFloorInput).suppressWorldFloorFailure).toBe(true);
expect(resolveObstacleCollision(input).z).toBeLessThan(0);
expect(selectFailureReason({ rimRejected: true, hitObstacle: true, leftByWind: true, launchWasTooWeak: false, launchWasTooStrong: false, hitGround: true })).toBe('rim_reject');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm exec vitest run tests/collision/resolveObstacleCollision.test.ts tests/collision/binStateMachine.test.ts tests/scoring/selectFailureReason.test.ts
```

Expected: `FAIL with missing collision / scoring modules`

- [ ] **Step 3: 충돌/판정 최소 구현을 작성한다**

```ts
if (rimRejected) return 'rim_reject';
if (hitObstacle) return 'obstacle_block';
if (leftByWind) return 'wind_push';
if (launchWasTooWeak) return 'power_low';
if (launchWasTooStrong) return 'power_high';
if (hitGround) return 'ground_hit';
return null;
```

```ts
if (crossedOpeningPlaneDownward && horizontalOffset <= openingWidth / 2 && speed >= entrySpeedMin && speed <= entrySpeedMax) {
  return { state: 'EntryCandidate', suppressWorldFloorFailure: false };
}

if (speed < entrySpeedMin || speed > entrySpeedMax || horizontalOffset > openingWidth / 2) {
  return { state: 'RimContact', suppressWorldFloorFailure: false };
}

const allowAssist = currentState === 'RimContact' || currentState === 'EntryCandidate';
const inwardAssistOffset = allowAssist
  ? clamp(desiredInwardOffset, 0, entryAssistRadius)
  : 0;

// 보정은 x 위치에만 적용하고 openingWidth 자체는 넓히지 않는다.
const assistedHorizontalOffset = Math.max(0, horizontalOffset - inwardAssistOffset);

if (enteredInnerVolume && (insideTimeMs >= settleTimeMs || depthBelowOpening >= depthTolerance)) {
  return { state: 'SuccessLatched', suppressWorldFloorFailure: true };
}

const relative = subtract(bodyVelocity, obstacleSurfaceVelocity);
const bounced = reflect(relative, obstacleNormal, restitution);
return add(applyTangentialDamping(bounced, tangentialDamping), obstacleSurfaceVelocity);
```

Task 5는 반드시 아래 4경로를 각각 독립 테스트로 고정한다.
1. 림에 맞고 튕겨 실패
2. 유효 속도로 입구 평면을 통과해 진입 후보
3. 내부 정착 시간 또는 깊이 조건으로 성공 래치
4. `InsideBin` 이후 월드 바닥 실패 억제 + `bin` 로컬 바닥 처리
5. `entryAssistRadius`는 입구 폭을 넓히지 않고, 이미 진입 후보가 된 샷에만 미세 보정으로 작동
6. `entryAssistRadius`는 위치 보정량 상한이며 속도 보정에는 쓰지 않는다

- [ ] **Step 4: 충돌/판정 테스트를 통과시킨다**

```bash
npm exec vitest run tests/collision/resolveObstacleCollision.test.ts tests/collision/binStateMachine.test.ts tests/scoring/selectFailureReason.test.ts
```

Expected: `3 test files passed`

- [ ] **Step 5: 충돌/판정 로직을 커밋한다**

```bash
git add src/game/collision src/game/scoring tests/collision tests/scoring
git commit -m "feat: add collision response and bin scoring rules"
```
### Task 6: StageRuntime, Scene, Renderer 통합

**Files:**
- Create: `src/game/runtime/runtimeTypes.ts`
- Create: `src/game/runtime/StageRuntime.ts`
- Create: `src/game/scenes/BootScene.ts`
- Create: `src/game/scenes/StageScene.ts`
- Create: `src/game/render/projectWorldToScreen.ts`
- Create: `src/game/render/StageRenderer.ts`
- Create: `tests/runtime/StageRuntime.test.ts`

- [ ] **Step 1: 재시도 연속성과 confirm_power 생성 규칙 테스트를 작성한다**

```ts
const runtime = new StageRuntime(stageCatalog[0]);
runtime.tick(1000 / 60);
runtime.confirmAim();
runtime.confirmPower();
runtime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });
runtime.retryThrow();
expect(runtime.getSnapshot().worldTimeMs).toBeGreaterThan(0);
expect(runtime.getSnapshot().input.phase).toBe('aim');
expect(runtime.getSnapshot().activeBody).toBeNull();
expect(runtime.getSnapshot().failureReason).toBe(null);
expect(runtime.getSnapshot().resultOverlay.kind).toBe(null);
```

```ts
const successRuntime = new StageRuntime(stageCatalog[0]);
successRuntime.confirmAim();
expect(successRuntime.getSnapshot().activeBody).toBeNull();
successRuntime.confirmPower();
expect(successRuntime.getSnapshot().activeBody?.position).toEqual(stageCatalog[0].paper.spawn);
successRuntime.applyThrowResolution({ success: true, failureReason: null });
expect(successRuntime.getSnapshot().successCount).toBe(1);
expect(successRuntime.getSnapshot().stageStatus).toBe('cleared');
```

```ts
const failureRuntime = new StageRuntime(stageCatalog[0]);
failureRuntime.confirmAim();
failureRuntime.confirmPower();
const before = failureRuntime.getSnapshot().remainingThrows;
failureRuntime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });
expect(failureRuntime.getSnapshot().remainingThrows).toBe(before - 1);
expect(failureRuntime.getSnapshot().failureReason).toBe('ground_hit');
expect(failureRuntime.getSnapshot().resultOverlay.kind).toBe('failure');
failureRuntime.tick(320);
expect(failureRuntime.getSnapshot().resultOverlay.kind).toBe(null);
```

```ts
const failStageRuntime = new StageRuntime(singleThrowStage);
failStageRuntime.confirmAim();
failStageRuntime.confirmPower();
failStageRuntime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });
expect(failStageRuntime.getSnapshot().stageStatus).toBe('failed');
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm exec vitest run tests/runtime/StageRuntime.test.ts
```

Expected: `FAIL with missing runtime module`

- [ ] **Step 3: runtime과 scene 통합 최소 구현을 작성한다**

```ts
interface RuntimeSnapshot {
  worldTimeMs: number;
  throwIndex: number;
  remainingThrows: number;
  successCount: number;
  stageStatus: 'playing' | 'cleared' | 'failed';
  resultOverlay: { kind: 'success' | 'failure' | null; text: string };
  failureReason: FailureReason;
  input: ThrowInputSnapshot;
  activeBody: ThrowBody | null;
}

export class StageRuntime {
  tick(deltaMs: number): void { this.worldTimeMs += deltaMs; this.input.tick(deltaMs); /* activeBody 있으면 fixed step 적용 */ }
  confirmAim(): void { this.input.confirmAim(); }
  confirmPower(): void { /* input snapshot으로 launch vector 계산 후 paper.spawn에서 body 생성 */ }
  applyThrowResolution(result: { success: boolean; failureReason: FailureReason }): void { /* successCount, remainingThrows, overlay, stageStatus 갱신 */ }
  retryThrow(): void { this.activeBody = null; this.failureReason = null; this.input.resetForRetry(); }
  getSnapshot(): RuntimeSnapshot {
    return {
      worldTimeMs: this.worldTimeMs,
      throwIndex: this.throwIndex,
      remainingThrows: this.remainingThrows,
      successCount: this.successCount,
      stageStatus: this.stageStatus,
      resultOverlay: this.resultOverlay,
      failureReason: this.failureReason,
      input: this.input.getSnapshot(),
      activeBody: this.activeBody,
    };
  }
}
```

```ts
const FIXED_DT_MS = 1000 / 60;
update(_time: number, delta: number): void {
  this.accumulatorMs += delta;
  while (this.accumulatorMs >= FIXED_DT_MS) {
    this.runtime.tick(FIXED_DT_MS);
    this.accumulatorMs -= FIXED_DT_MS;
  }
  const snapshot = this.runtime.getSnapshot();
  this.renderer.render(snapshot);
  this.hud.render(this.mapHudView(snapshot));
}
```

Task 6은 아래를 반드시 검증한다.
- 실패 시 throw 소모와 `failureReason` 반영
- 성공 시 `successCount` 증가와 clear 조건 판정
- success/failure result overlay는 월드를 멈추지 않고 0.3초 내외로 사라짐
- stage clear/fail 후 `GameShell`로 전이 이벤트를 올림
- 쓰레기통의 시각 입구 폭은 실제 충돌 폭의 `1.08x`로 렌더링
- 종이 스프라이트는 시각 연출용이고, 판정은 항상 `paper.radius` 구형 프록시를 사용

- [ ] **Step 4: runtime 통합 테스트를 통과시키고 빌드한다**

```bash
npm exec vitest run tests/runtime/StageRuntime.test.ts
npm run build
```

Expected: `1 test file passed`, `vite build completed successfully`

- [ ] **Step 5: 통합 레이어를 커밋한다**

```bash
git add src/game/runtime src/game/scenes src/game/render tests/runtime
git commit -m "feat: integrate runtime with stage scene and renderer"
```

### Task 7: Stage 4~6과 이동 장애물 확장

**Files:**
- Create: `src/game/obstacles/getObstacleWorldPose.ts`
- Create: `src/game/stages/stage04.ts`
- Create: `src/game/stages/stage05.ts`
- Create: `src/game/stages/stage06.ts`
- Modify: `src/game/stages/stageCatalog.ts`
- Create: `tests/obstacles/getObstacleWorldPose.test.ts`
- Create: `tests/stages/fullCatalog.test.ts`

- [ ] **Step 1: 이동 장애물 world_time 기반 위치와 6개 스테이지 카탈로그 테스트를 작성한다**

```ts
const poseA = getObstacleWorldPose({ basePosition: { x: 0, y: 1.3, z: 5.8 }, motion, worldTimeMs: 0 });
const poseB = getObstacleWorldPose({ basePosition: { x: 0, y: 1.3, z: 5.8 }, motion, worldTimeMs: 1000 });
expect(poseA.x).not.toBe(poseB.x);
expect(stageCatalog).toHaveLength(6);
expect(stageCatalog[4].obstacles[0].motion.type).toBe('ping_pong_x');
expect(stageCatalog[5].obstacles.some((obstacle) => obstacle.kind === 'narrow_gate')).toBe(true);
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
npm exec vitest run tests/obstacles/getObstacleWorldPose.test.ts tests/stages/fullCatalog.test.ts
```

Expected: `FAIL because stage04-06 / obstacle motion modules do not exist yet`

- [ ] **Step 3: 장애물 모션과 Stage 4~6 데이터를 작성한다**

```ts
export function getObstacleWorldPose({ basePosition, motion, worldTimeMs }: Input): Vec3 {
  if (motion.type === 'none' || motion.durationMs <= 0) return basePosition;
  const phase01 = ((worldTimeMs + motion.phaseMs) % motion.durationMs) / motion.durationMs;
  const pingPong = phase01 < 0.5 ? phase01 * 2 : (1 - phase01) * 2;
  const offset = (pingPong - 0.5) * 2 * motion.amplitude;
  return motion.type === 'ping_pong_x' ? { ...basePosition, x: basePosition.x + offset } : { ...basePosition, y: basePosition.y + offset };
}
```

```ts
export const stage05 = buildBaseStage({ id: 'stage-05', order: 5, theme: 'classroom', clear: { throwLimit: 5, requiredSuccesses: 1 }, fan: { enabled: true, position: { x: -1.5, y: 1.35, z: 2.0 }, directionDeg: 90, strength: 1, strengthLabel: 'medium', targetLateralSpeed: 2.2, windResponse: 7, gravityScaleInZone: 0.92, influenceShape: 'box', influenceLength: 4.5, influenceWidth: 2.8, influenceHeight: 2.2, feather: 0.3, showParticles: true }, obstacles: [{ id: 'moving-slab', kind: 'moving_block', position: { x: 0, y: 1.25, z: 5.8 }, size: { x: 0.9, y: 1.0, z: 0.35 }, motion: { type: 'ping_pong_x', amplitude: 1.1, durationMs: 2000, phaseMs: 0, timeSource: 'world_time' } }], tutorialText: '움직이는 장애물 타이밍을 읽는다.', clearConditionText: '5번 안에 1회 성공' });
export const stage06 = buildBaseStage({ id: 'stage-06', order: 6, theme: 'cafe', clear: { throwLimit: 5, requiredSuccesses: 1 }, fan: { enabled: true, position: { x: -1.6, y: 1.35, z: 1.9 }, directionDeg: 90, strength: 1, strengthLabel: 'strong', targetLateralSpeed: 3.4, windResponse: 8, gravityScaleInZone: 0.88, influenceShape: 'box', influenceLength: 4.5, influenceWidth: 2.8, influenceHeight: 2.2, feather: 0.3, showParticles: true }, obstacles: [{ id: 'moving-panel', kind: 'moving_block', position: { x: 0.2, y: 1.2, z: 5.6 }, size: { x: 0.7, y: 1.0, z: 0.35 }, motion: { type: 'ping_pong_y', amplitude: 0.7, durationMs: 1800, phaseMs: 150, timeSource: 'world_time' } }, { id: 'gate-final', kind: 'narrow_gate', position: { x: 0.15, y: 1.1, z: 7.2 }, size: { x: 0.55, y: 1.1, z: 0.2 }, motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' } }], tutorialText: '강한 바람, 타이밍, 좁은 입구를 함께 푼다.', clearConditionText: '5번 안에 1회 성공' });
```

- [ ] **Step 4: 후반 스테이지 테스트를 통과시킨다**

```bash
npm exec vitest run tests/obstacles/getObstacleWorldPose.test.ts tests/stages/fullCatalog.test.ts
```

Expected: `2 test files passed`

- [ ] **Step 5: Stage 4~6 확장을 커밋한다**

```bash
git add src/game/obstacles src/game/stages tests/obstacles tests/stages
git commit -m "feat: add late-game stages and moving obstacle motion"
```

### Task 8: 최종 검증과 플레이테스트 체크리스트 정리

**Files:**
- Create: `docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md`
- Create: `tests/runtime/mvpContract.test.ts`

- [ ] **Step 1: MVP 계약 테스트와 수동 체크리스트를 추가한다**

```ts
expect(stageCatalog).toHaveLength(6);
expect(stageCatalog.every((stage) => stage.retryPolicy.keepWorldTimeOnRetry)).toBe(true);
expect(stageCatalog.every((stage) => stage.score.mode === 'binary_success')).toBe(true);
```

```md
# PaperShoot MVP Smoke Checklist
- Desktop 1280px 이상에서 HUD가 캔버스를 가리지 않는가
- 모바일 390x844 기준에서 상단/우측/하단 HUD가 모두 보이는가
- Stage 3에서 장애물 실패 이유가 `장애물`로 보이는가
- Stage 5에서 retry 후에도 이동 장애물 위상이 유지되는가
- Stage 6에서 좁은 입구 통과 후 `InsideBin` 성공이 자연스럽게 보이는가
- 쓰레기통 시각 입구 폭이 실제 충돌 폭의 `1.08x`로 보이는가
- 종이 스프라이트와 `paper.radius` 프록시 중심이 눈에 띄게 어긋나지 않는가
```

- [ ] **Step 2: 전체 테스트 스위트를 실행한다**

```bash
npm test
```

Expected: `all test files passed`

- [ ] **Step 3: 프로덕션 빌드와 수동 스모크를 실행한다**

```bash
npm run build
npm run dev
```

Expected: `vite build completed successfully`, `local dev server starts without runtime errors`

- [ ] **Step 4: 수동 스모크 결과를 체크리스트에 반영한다**

```md
- [ ] Desktop HUD overlap check
- [ ] Mobile HUD overlap check
- [ ] Stage 5 retry continuity check
- [ ] Stage 6 narrow gate success check
- Evidence:
  - Device:
  - Build SHA:
  - Notes:
```

- [ ] **Step 5: 최종 검증 결과를 커밋한다**

```bash
git add docs/superpowers/qa/2026-04-10-paper-shoot-mvp-smoke.md tests/runtime/mvpContract.test.ts
git commit -m "chore: verify PaperShoot MVP contract"
```

## Spec Coverage Check

- 섹션 5, 7, 8: `Task 3`, `Task 6`
- 섹션 9, 13: `Task 2`, `Task 5`, `Task 6`
- 섹션 12, 14: `Task 1`, `Task 4`, `Task 6`, `Task 7`
- 섹션 15, 16: `Task 5`, `Task 6`, `Task 8`
- 섹션 17, 18, 19, 20: `Task 4`, `Task 7`, `Task 8`

누락 없이 모두 대응한다. 가장 높은 구현 리스크는 `Task 5`의 쓰레기통 상태 머신과 `Task 6`의 runtime 통합이다. 이 둘은 병렬 분해하지 않고 주 에이전트가 직접 마감한다.

