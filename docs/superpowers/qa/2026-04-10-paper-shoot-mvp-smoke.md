# PaperShoot Commercial Redesign Smoke QA

- Date: 2026-04-10
- Branch: `feat/papershoot-commercial-redesign`
- Build SHA: `8553a331c7a20e88a8740be626ea9a311c909579`
- Local URL: `http://127.0.0.1:4174/`
- Build command: `npm.cmd run build`
- Browser automation: `npx.cmd --yes --package @playwright/cli playwright-cli`

## Checks

- [x] Desktop boot baseline
  - Initial snapshot showed `Stage 1`, `3 throws left`, `0/1`, `→ weak wind`, `종이공을 위로 드래그해 던지세요.`
- [x] Desktop drag-release interaction
  - Pointer drag on the canvas changed HUD state from `3 throws left` to `2 throws left`
- [x] Desktop persistent HUD overlap
  - Measured `.hud-top` + `.hud-side` occupied about `1.32%` of a `1280x720` viewport
  - Persistent HUD stayed at the left and right edges; the central play lane remained unobstructed
- [x] Mobile boot baseline
  - Initial snapshot showed `Stage 1`, `3 throws left`, `0/1`, `→ weak wind`, `종이공을 위로 드래그해 던지세요.`
- [x] Mobile drag-release interaction
  - CDP touch injection on the canvas changed HUD state from `3 throws left` to `2 throws left`
- [x] Mobile persistent HUD overlap
  - Measured `.hud-top` + `.hud-side` occupied about `3.01%` of a `390x844` viewport
  - Wind badge moved to the lower-right corner and left the launch area open
- [x] Console health during clean desktop/mobile sessions
  - Only recurring console error was `favicon.ico` 404 on boot

## Measurements

### Desktop (`1280x720`)

- `.hud-top`: `x=14`, `y=14`, `width=246.42`, `height=34.09`
- `.hud-side`: `x=1155.92`, `y=14`, `width=110.08`, `height=34.09`
- `.hud-result`: `x=516.10`, `y=72`, `width=247.80`, `height=42.09`

### Mobile (`390x844`)

- `.hud-top`: `x=14`, `y=14`, `width=219.81`, `height=30.94`
- `.hud-side`: `x=275.92`, `y=795.06`, `width=100.08`, `height=30.94`
- `.hud-result`: `x=97.50`, `y=88`, `width=195.00`, `height=51.88`

## Evidence

- Desktop drag screenshot: `output/playwright/desktop-clean-drag.png`
- Desktop post-throw screenshot: `output/playwright/desktop-clean-after.png`
- Mobile drag screenshot: `output/playwright/mobile-clean-drag.png`
- Mobile post-throw screenshot: `output/playwright/mobile-clean-after.png`
- Desktop console log: `.playwright-cli/console-2026-04-10T10-11-49-184Z.log`
- Mobile console log: `.playwright-cli/console-2026-04-10T10-11-12-758Z.log`

## Notes

- This smoke pass verified boot, HUD placement, and drag-release interaction on desktop and mobile-sized viewports.
- Screenshot artifacts were captured for human visual review of paper/bin/fan composition and perceived depth.
- Final commercial art sign-off still benefits from a human eyeball pass, but no blocking implementation issue appeared in this smoke run.
