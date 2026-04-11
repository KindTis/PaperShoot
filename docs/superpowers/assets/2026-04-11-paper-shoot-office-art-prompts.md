# Paper Shoot Office Raster Art Prompt Pack (2026-04-11)

## 공통 스타일 규칙
- 톤: stylized 3D game-like office, 과도한 디테일 대신 깨끗한 실루엣 우선.
- 조명: 상단 형광등 + 창측 확산광 기반의 soft office lighting, 강한 하드 섀도우 금지.
- 색상: 블루/그레이 중성 팔레트 + 라이트 옐로 포인트(성공/효과 연출).
- 재질: 플라스틱/메탈/종이 질감은 브러시 텍스처 대신 명암 블록으로 단순화.
- 실루엣 일관성: 게임 히트영역과 충돌하지 않도록 배경 투명 여백을 충분히 유지.
- 파이프라인: 모든 산출물은 UTF-8 기준 문서화, 실제 래스터는 PNG/WEBP로 생성.

## 지오메트리 정합성 메모
- `trash-bin-main.png`: `stageArtGeometry.bin.entryWindow` 의도에 맞춰 개구부를 width=0.74, height=0.18, offsetY=-0.32 비율로 배치.
- 장애물 6종: `worldSize/anchor/referenceStage/expectedScreenSize/silhouetteRule` 시트를 우선 기준으로 사용.
- `obstacle-swing-panel.png`: `top-center` 앵커 특성을 반영해 상단 연결부(힌지/봉) 포함.
- `obstacle-moving-cart.png`: `bottom-center` 앵커 기준에서 바닥 접점이 흔들리지 않도록 베이스 하단을 안정적으로 유지.

## 파일별 생성 사양
### Background (5)
| 파일 경로 | 해상도 | 생성 프롬프트 요약 |
|---|---:|---|
| `public/assets/papershoot/background/office-backplate-main.webp` | 1920x1080 | "Stylized 3D office backplate, soft daylight from right window, centered desk blockout, readable playfield, no clutter" |
| `public/assets/papershoot/background/office-midground-desk-cluster.png` | 1920x1080 | "Desk cluster and monitor mass as transparent midground layer, chunky forms" |
| `public/assets/papershoot/background/office-side-cubicle-left.png` | 1920x1080 | "Left cubicle wall silhouette with soft edge shading, transparent layer" |
| `public/assets/papershoot/background/office-side-cubicle-right.png` | 1920x1080 | "Right cubicle wall silhouette mirrored for frame balance, transparent layer" |
| `public/assets/papershoot/background/office-foreground-desk-edge.png` | 1920x1080 | "Foreground desk edge strip at bottom, perspective cue with gentle highlight" |

### Paper/Bin/Fan/Props (5)
| 파일 경로 | 해상도 | 생성 프롬프트 요약 |
|---|---:|---|
| `public/assets/papershoot/paper/paper-ball-main.png` | 512x512 | "Crumpled paper ball, stylized folds, readable from distance, transparent background" |
| `public/assets/papershoot/bin/trash-bin-main.png` | 512x512 | "Office trash bin with clear top opening, opening aligned to gameplay entry window ratios" |
| `public/assets/papershoot/fan/desk-fan-main.png` | 512x512 | "Desk fan, rounded safety cage, simplified blades, game-like silhouette" |
| `public/assets/papershoot/props/coffee-cup.png` | 512x512 | "Simple ceramic coffee cup, soft specular highlight, clean contour" |
| `public/assets/papershoot/props/pencil-holder.png` | 512x512 | "Pencil holder with 3 pencils, chunky readability and stable base" |

### Obstacles (6)
| 파일 경로 | 해상도 | 생성 프롬프트 요약 |
|---|---:|---|
| `public/assets/papershoot/obstacles/obstacle-center-block.png` | 512x512 | "Centered cube-like office crate, hitbox-friendly square mass" |
| `public/assets/papershoot/obstacles/obstacle-dual-block-left.png` | 512x512 | "Dual stacked blocks biased left silhouette, centered pivot for animation" |
| `public/assets/papershoot/obstacles/obstacle-dual-block-right.png` | 512x512 | "Dual stacked blocks mirrored right silhouette, same volume language" |
| `public/assets/papershoot/obstacles/obstacle-moving-cart.png` | 640x400 | "Wide low office cart with wheels, horizontal silhouette for side movement" |
| `public/assets/papershoot/obstacles/obstacle-swing-panel.png` | 320x720 | "Tall hanging swing panel with top hinge, narrow width and long vertical reach" |
| `public/assets/papershoot/obstacles/obstacle-narrow-gate.png` | 320x720 | "Tall narrow gate post, centered collision profile with top cap" |

### FX (3)
| 파일 경로 | 해상도 | 생성 프롬프트 요약 |
|---|---:|---|
| `public/assets/papershoot/fx/success-burst.png` | 512x512 | "Warm yellow starburst success effect with soft bloom" |
| `public/assets/papershoot/fx/wind-streak.png` | 512x256 | "Cool blue wind streak for fan influence, tapering layered motion shape" |
| `public/assets/papershoot/fx/rim-hit-flash.png` | 512x512 | "Bright rim hit flash ring for bin/obstacle contact moment, additive pop" |

## 생성 메모
- 생성 스크립트: `scripts/generate_office_raster_assets.py`
- 사용 라이브러리: Python + Pillow (Pillow 설치 필요)
- 설치 예시: `python -m pip install pillow`
- SVG 원본은 보존 가능하며, 런타임 manifest가 참조하는 `.png/.webp`는 실제 파일로 제공
