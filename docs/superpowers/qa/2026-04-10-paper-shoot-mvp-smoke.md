# PaperShoot MVP Smoke Checklist

- Desktop 1280px 이상에서 HUD가 캔버스를 가리지 않는가
- 모바일 390x844 기준에서 상단/우측/하단 HUD가 모두 보이는가
- desktop persistent HUD가 viewport 20% 이내이고 중앙 40% 폭을 가리지 않는가
- mobile persistent HUD가 viewport 28% 이내이고 조준 드래그 영역과 버튼 영역이 겹치지 않는가
- Stage 3에서 장애물 실패 이유가 `장애물`로 보이는가
- Stage 5에서 retry 후에도 이동 장애물 위상이 유지되는가
- Stage 6에서 좁은 입구 통과 후 `InsideBin` 성공이 자연스럽게 보이는가
- 쓰레기통 시각 입구 폭이 실제 충돌 폭의 `1.08x`로 보이되 centerline mismatch가 `<= 4px @1080p`인가
- 종이 스프라이트와 `paper.radius` 프록시 중심 오차가 정지 시 `<= 3px @1080p`, 비행 중 `<= proxy diameter의 10%`인가

## Result Log

- [ ] Desktop HUD overlap check
- [ ] Mobile HUD overlap check
- [ ] Stage 5 retry continuity check
- [ ] Stage 6 narrow gate success check
- [ ] Visual/collision bin centerline check (`<= 4px @1080p`)
- [ ] Sprite/proxy center alignment check (idle `<= 3px`, flight `<= 10% diameter`)

Evidence:
- Device:
- Build SHA:
- Notes:
