import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

type StageExpectation = {
  order: number;
  stageId: string;
  obstacles: string;
};

const STAGE_EXPECTATIONS: StageExpectation[] = [
  { order: 1, stageId: 'stage-01', obstacles: '' },
  { order: 2, stageId: 'stage-02', obstacles: '' },
  { order: 3, stageId: 'stage-03', obstacles: 'block-center' },
  { order: 4, stageId: 'stage-04', obstacles: 'block-left,block-right' },
  { order: 5, stageId: 'stage-05', obstacles: 'moving-slab' },
  { order: 6, stageId: 'stage-06', obstacles: 'moving-panel,gate-final' },
];

const SCREENSHOT_DIR = path.join('output', 'playwright');

function parseThrowsLeft(text: string): number {
  const match = text.match(/(\d+)\s+throws left/i);
  if (!match) {
    throw new Error(`Unexpected throws HUD text: ${text}`);
  }
  return Number(match[1]);
}

async function gotoStage(page: Page, stageOrder: number, expectedStageId: string): Promise<void> {
  await page.goto(`?stage=${stageOrder}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => document.body.dataset.stageId ?? ''), {
      timeout: 15_000,
      message: `Expected stage dataset to publish ${expectedStageId}`,
    })
    .toBe(expectedStageId);
  await expect(page.locator('[data-role="stage"]')).toHaveText(`Stage ${stageOrder}`);
}

async function dragRelease(
  page: Page,
  input: { startX: number; startY: number; endX: number; endY: number },
): Promise<void> {
  const canvas = page.locator('#app canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box is unavailable.');
  }

  const fromX = box.x + box.width * input.startX;
  const fromY = box.y + box.height * input.startY;
  const toX = box.x + box.width * input.endX;
  const toY = box.y + box.height * input.endY;

  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(toX, toY, { steps: 8 });
  await page.mouse.up();
}

test.describe('stage direct-entry smoke', () => {
  test.beforeAll(() => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const stage of STAGE_EXPECTATIONS) {
    test(`stage ${stage.order} direct entry metadata and drag`, async ({ page }) => {
      await gotoStage(page, stage.order, stage.stageId);

      const stageLabel = page.locator('[data-role="stage"]');
      await expect(stageLabel).toBeVisible();
      await expect(stageLabel).toHaveText(`Stage ${stage.order}`);

      const debugState = await page.evaluate(() => ({
        stageId: document.body.dataset.stageId ?? '',
        stageObstacles: document.body.dataset.stageObstacles ?? '',
      }));

      expect(debugState.stageId).toBe(stage.stageId);
      expect(debugState.stageObstacles).toBe(stage.obstacles);

      const throwsValue = page.locator('[data-role="throws"]');
      const throwsBefore = parseThrowsLeft(await throwsValue.innerText());

      await dragRelease(page, {
        startX: 0.5,
        startY: 0.84,
        endX: 0.58,
        endY: 0.55,
      });

      await expect
        .poll(async () => parseThrowsLeft(await throwsValue.innerText()), {
          timeout: 10_000,
          message: `Expected throw count to decrease after drag on stage ${stage.order}`,
        })
        .toBeLessThan(throwsBefore);

      const filename = `${stage.stageId}-direct-entry.png`;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, filename),
        fullPage: true,
      });
    });
  }

  test('stage 1 regression: consume 3 throws then retry from game over', async ({ page }) => {
    await gotoStage(page, 1, 'stage-01');

    const throwsValue = page.locator('[data-role="throws"]');
    await expect(throwsValue).toHaveText('3 throws left');

    for (const expectedRemaining of [2, 1, 0]) {
      await dragRelease(page, {
        startX: 0.5,
        startY: 0.84,
        endX: 0.98,
        endY: 0.7,
      });

      await expect
        .poll(async () => parseThrowsLeft(await throwsValue.innerText()), {
          timeout: 10_000,
          message: `Expected remaining throws to become ${expectedRemaining}`,
        })
        .toBe(expectedRemaining);
    }

    const resultBanner = page.locator('[data-role="result"]');
    await expect(resultBanner).toContainText('Game Over');

    const retryButton = page.locator('[data-role="retry"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toHaveText('Retry');
    await retryButton.click();

    await expect(throwsValue).toHaveText('3 throws left');
    await expect(resultBanner).not.toContainText('Game Over');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'stage-01-game-over-retry.png'),
      fullPage: true,
    });
  });
});
