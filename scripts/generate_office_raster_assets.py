from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets" / "papershoot"

# Keep these constants aligned with `stageArtGeometry.bin.entryWindow`.
BIN_ENTRY_WINDOW_CENTER_X_RATIO = 0.5
BIN_ENTRY_WINDOW_WIDTH_RATIO = 0.74
BIN_ENTRY_WINDOW_HEIGHT_RATIO = 0.18
BIN_ENTRY_WINDOW_OFFSET_Y_RATIO = -0.32


Color = tuple[int, int, int, int]


@dataclass(frozen=True)
class AssetSpec:
    path: Path
    build: Callable[[], Image.Image]
    format: str


def rgba(color: tuple[int, int, int], alpha: int = 255) -> Color:
    return (color[0], color[1], color[2], alpha)


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    width, height = size
    gradient = Image.new("RGBA", size)
    pixels = gradient.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        color = (
            int(top[0] * (1 - t) + bottom[0] * t),
            int(top[1] * (1 - t) + bottom[1] * t),
            int(top[2] * (1 - t) + bottom[2] * t),
            255,
        )
        for x in range(width):
            pixels[x, y] = color
    return gradient


def add_vignette(image: Image.Image, opacity: int = 72) -> None:
    width, height = image.size
    overlay = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(overlay)
    for i in range(0, max(width, height), 24):
        alpha = int(opacity * (i / max(width, height)))
        draw.ellipse((-i, -i, width + i, height + i), outline=alpha, width=24)
    image.putalpha(255)
    shaded = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shaded.putalpha(overlay)
    image.alpha_composite(shaded)


def draw_soft_shadow(layer: Image.Image, box: tuple[int, int, int, int], blur: float, alpha: int) -> None:
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse(box, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    layer.alpha_composite(shadow)


def build_background_backplate() -> Image.Image:
    width, height = 1920, 1080
    image = vertical_gradient((width, height), (229, 238, 248), (189, 204, 221))
    draw = ImageDraw.Draw(image, "RGBA")

    draw.rectangle((0, 0, width, int(height * 0.55)), fill=rgba((224, 234, 246)))
    draw.polygon(
        [
            (0, int(height * 0.55)),
            (width, int(height * 0.55)),
            (width, height),
            (0, height),
        ],
        fill=rgba((183, 198, 216)),
    )

    window = (int(width * 0.61), int(height * 0.12), int(width * 0.95), int(height * 0.5))
    draw.rounded_rectangle(window, radius=26, fill=rgba((196, 220, 244)), outline=rgba((117, 141, 170), 220), width=8)
    for i in range(1, 4):
        x = int(window[0] + i * (window[2] - window[0]) / 4)
        draw.line((x, window[1], x, window[3]), fill=rgba((142, 164, 188), 210), width=4)
    draw.line(
        (window[0], int(window[1] + (window[3] - window[1]) * 0.53), window[2], int(window[1] + (window[3] - window[1]) * 0.53)),
        fill=rgba((142, 164, 188), 210),
        width=4,
    )

    desk = (int(width * 0.17), int(height * 0.52), int(width * 0.83), int(height * 0.74))
    draw.rounded_rectangle(desk, radius=22, fill=rgba((121, 143, 165)), outline=rgba((92, 114, 137), 220), width=6)
    draw.rounded_rectangle((desk[0] + 70, desk[1] - 52, desk[0] + 390, desk[1] + 40), radius=16, fill=rgba((97, 122, 148)))
    draw.rounded_rectangle((desk[2] - 390, desk[1] - 52, desk[2] - 70, desk[1] + 40), radius=16, fill=rgba((97, 122, 148)))

    floor_glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(floor_glow)
    glow_draw.ellipse((int(width * 0.23), int(height * 0.63), int(width * 0.77), int(height * 0.97)), fill=rgba((255, 248, 225), 120))
    floor_glow = floor_glow.filter(ImageFilter.GaussianBlur(56))
    image.alpha_composite(floor_glow)

    add_vignette(image, opacity=64)
    return image


def build_background_midground_desk_cluster() -> Image.Image:
    width, height = 1920, 1080
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    desk = (int(width * 0.18), int(height * 0.52), int(width * 0.82), int(height * 0.74))
    draw.rounded_rectangle(desk, radius=22, fill=rgba((122, 145, 168), 235), outline=rgba((88, 111, 136), 230), width=6)
    draw.rounded_rectangle((int(width * 0.42), int(height * 0.38), int(width * 0.58), int(height * 0.53)), radius=18, fill=rgba((83, 104, 128), 230))
    draw.rectangle((int(width * 0.485), int(height * 0.53), int(width * 0.515), int(height * 0.58)), fill=rgba((83, 104, 128), 230))
    draw.rounded_rectangle((int(width * 0.27), int(height * 0.46), int(width * 0.33), int(height * 0.54)), radius=10, fill=rgba((103, 126, 151), 220))
    draw.polygon(
        [
            (int(width * 0.72), int(height * 0.47)),
            (int(width * 0.75), int(height * 0.38)),
            (int(width * 0.78), int(height * 0.47)),
        ],
        fill=rgba((95, 125, 141), 230),
    )
    draw_soft_shadow(layer, (int(width * 0.22), int(height * 0.63), int(width * 0.78), int(height * 0.86)), 26, 95)
    return layer


def build_background_side_cubicle_left() -> Image.Image:
    width, height = 1920, 1080
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    draw.rounded_rectangle((0, int(height * 0.14), int(width * 0.22), int(height * 0.82)), radius=32, fill=rgba((171, 185, 204), 214))
    draw.rounded_rectangle((int(width * 0.09), int(height * 0.24), int(width * 0.32), int(height * 0.72)), radius=28, fill=rgba((150, 167, 189), 208))
    draw.rounded_rectangle((int(width * 0.13), int(height * 0.17), int(width * 0.27), int(height * 0.3)), radius=12, fill=rgba((236, 245, 252), 196))
    draw.rectangle((int(width * 0.04), int(height * 0.45), int(width * 0.14), int(height * 0.78)), fill=rgba((103, 123, 147), 170))
    draw_soft_shadow(layer, (int(width * 0.06), int(height * 0.68), int(width * 0.34), int(height * 0.95)), 24, 74)
    return layer


def build_background_side_cubicle_right() -> Image.Image:
    return build_background_side_cubicle_left().transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def build_background_foreground_desk_edge() -> Image.Image:
    width, height = 1920, 1080
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    draw.polygon(
        [
            (0, int(height * 0.78)),
            (int(width * 0.2), int(height * 0.72)),
            (int(width * 0.8), int(height * 0.72)),
            (width, int(height * 0.78)),
            (width, height),
            (0, height),
        ],
        fill=rgba((124, 148, 173), 232),
    )
    draw.rectangle((0, int(height * 0.77), width, int(height * 0.8)), fill=rgba((174, 198, 221), 210))
    draw_soft_shadow(layer, (int(width * 0.28), int(height * 0.78), int(width * 0.72), int(height * 0.98)), 24, 92)
    return layer


def build_paper_ball() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((74, 72, 438, 438), fill=rgba((236, 238, 241)), outline=rgba((170, 179, 191), 230), width=6)
    draw.ellipse((132, 118, 362, 332), fill=rgba((255, 255, 255), 145))
    for offset in (120, 160, 202, 244, 286):
        draw.arc((92, offset - 48, 418, offset + 56), start=18, end=202, fill=rgba((156, 166, 180), 175), width=4)
    draw.arc((108, 132, 422, 402), start=242, end=320, fill=rgba((145, 155, 170), 160), width=5)
    return image


def build_trash_bin() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")

    draw_soft_shadow(image, (86, 404, 430, 506), 18, 110)
    draw.polygon(
        [(86, 156), (426, 156), (386, 468), (126, 468)],
        fill=rgba((106, 129, 153), 238),
        outline=rgba((73, 96, 120), 245),
    )
    draw.rounded_rectangle((74, 126, 438, 200), radius=24, fill=rgba((125, 148, 172), 245), outline=rgba((79, 103, 127), 250), width=6)

    # Entry window center is calculated from bottom-center anchor plus offsetYRatio.
    entry_window_center_x = size * BIN_ENTRY_WINDOW_CENTER_X_RATIO
    entry_window_center_y = size * (1 + BIN_ENTRY_WINDOW_OFFSET_Y_RATIO)
    entry_window_width = size * BIN_ENTRY_WINDOW_WIDTH_RATIO
    entry_window_height = size * BIN_ENTRY_WINDOW_HEIGHT_RATIO

    entry_window_outer = (
      int(round(entry_window_center_x - entry_window_width / 2)),
      int(round(entry_window_center_y - entry_window_height / 2)),
      int(round(entry_window_center_x + entry_window_width / 2)),
      int(round(entry_window_center_y + entry_window_height / 2)),
    )
    draw.ellipse(entry_window_outer, fill=rgba((44, 56, 70), 255))

    inner_inset_x = max(10, int(round(entry_window_width * 0.05)))
    inner_inset_top = max(12, int(round(entry_window_height * 0.2)))
    inner_inset_bottom = max(6, int(round(entry_window_height * 0.08)))
    entry_window_inner = (
      entry_window_outer[0] + inner_inset_x,
      entry_window_outer[1] + inner_inset_top,
      entry_window_outer[2] - inner_inset_x,
      entry_window_outer[3] - inner_inset_bottom,
    )
    draw.ellipse(entry_window_inner, fill=rgba((34, 44, 58), 230))

    draw.ellipse((124, 148, 388, 212), fill=rgba((170, 196, 218), 112))
    return image


def build_desk_fan() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw_soft_shadow(image, (126, 412, 386, 500), 14, 95)
    draw.rounded_rectangle((192, 370, 320, 426), radius=20, fill=rgba((95, 117, 139), 238), outline=rgba((67, 88, 110), 245), width=4)
    draw.rectangle((244, 260, 268, 374), fill=rgba((83, 105, 129), 242))
    draw.ellipse((122, 102, 392, 370), fill=rgba((126, 149, 172), 228), outline=rgba((75, 96, 119), 245), width=8)
    draw.ellipse((168, 148, 346, 326), fill=rgba((204, 220, 236), 195), outline=rgba((98, 120, 144), 208), width=4)
    for blade in (
        [(256, 180), (312, 238), (264, 252)],
        [(256, 180), (198, 248), (248, 258)],
        [(256, 280), (210, 206), (262, 214)],
    ):
        draw.polygon(blade, fill=rgba((106, 129, 153), 210))
    draw.ellipse((228, 202, 284, 258), fill=rgba((76, 98, 122), 245))
    return image


def build_coffee_cup() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw_soft_shadow(image, (132, 392, 382, 486), 16, 90)
    draw.rounded_rectangle((150, 156, 362, 420), radius=56, fill=rgba((197, 215, 236), 240), outline=rgba((96, 118, 141), 235), width=6)
    draw.ellipse((174, 128, 338, 194), fill=rgba((236, 244, 252), 230), outline=rgba((110, 132, 155), 228), width=4)
    draw.rounded_rectangle((340, 196, 422, 326), radius=36, outline=rgba((108, 130, 152), 230), width=10)
    return image


def build_pencil_holder() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw_soft_shadow(image, (152, 392, 366, 490), 14, 95)
    draw.rounded_rectangle((166, 186, 346, 424), radius=30, fill=rgba((142, 165, 190), 235), outline=rgba((86, 109, 133), 245), width=5)
    draw.ellipse((182, 166, 330, 216), fill=rgba((173, 198, 222), 215), outline=rgba((102, 126, 152), 225), width=4)
    pencils = [
        ((218, 82), (238, 222), (230, 246), (214, 246), (236, 82), rgba((241, 201, 98), 245)),
        ((256, 66), (274, 220), (266, 248), (248, 248), (266, 66), rgba((231, 120, 95), 245)),
        ((292, 88), (308, 226), (302, 246), (286, 246), (302, 88), rgba((127, 175, 128), 245)),
    ]
    for tip, top1, top2, top3, top4, color in pencils:
        draw.polygon([top1, top2, top3, top4], fill=color, outline=rgba((72, 82, 96), 220))
        draw.polygon([(tip[0], tip[1]), (tip[0] - 6, tip[1] + 18), (tip[0] + 6, tip[1] + 18)], fill=rgba((229, 203, 171), 240))
    return image


def build_obstacle_center_block() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((98, 98, 414, 414), radius=34, fill=rgba((117, 141, 165), 240), outline=rgba((73, 95, 120), 245), width=8)
    draw.polygon([(98, 98), (414, 98), (364, 62), (152, 62)], fill=rgba((149, 173, 197), 228))
    draw.polygon([(414, 98), (414, 414), (364, 384), (364, 62)], fill=rgba((88, 109, 132), 228))
    return image


def build_obstacle_dual_block_left() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((84, 84, 298, 436), radius=26, fill=rgba((111, 135, 158), 238), outline=rgba((67, 89, 113), 245), width=7)
    draw.rounded_rectangle((240, 120, 418, 410), radius=22, fill=rgba((131, 156, 180), 234), outline=rgba((80, 102, 126), 240), width=6)
    return image


def build_obstacle_dual_block_right() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((94, 120, 272, 410), radius=22, fill=rgba((131, 156, 180), 234), outline=rgba((80, 102, 126), 240), width=6)
    draw.rounded_rectangle((214, 84, 428, 436), radius=26, fill=rgba((111, 135, 158), 238), outline=rgba((67, 89, 113), 245), width=7)
    return image


def build_obstacle_moving_cart() -> Image.Image:
    width, height = 640, 400
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((64, 120, 576, 280), radius=26, fill=rgba((115, 140, 164), 242), outline=rgba((72, 95, 119), 245), width=7)
    draw.rectangle((94, 86, 546, 128), fill=rgba((152, 178, 203), 228))
    draw.rectangle((126, 284, 148, 350), fill=rgba((72, 94, 118), 235))
    draw.rectangle((492, 284, 514, 350), fill=rgba((72, 94, 118), 235))
    draw.ellipse((90, 326, 176, 392), fill=rgba((53, 68, 87), 245))
    draw.ellipse((464, 326, 550, 392), fill=rgba((53, 68, 87), 245))
    return image


def build_obstacle_swing_panel() -> Image.Image:
    width, height = 320, 720
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rectangle((144, 0, 176, 104), fill=rgba((96, 118, 141), 240))
    draw.ellipse((130, 90, 190, 150), fill=rgba((72, 94, 118), 245))
    draw.rounded_rectangle((116, 122, 204, 666), radius=20, fill=rgba((132, 157, 182), 238), outline=rgba((83, 105, 129), 246), width=6)
    draw.rectangle((124, 200, 196, 594), fill=rgba((110, 134, 157), 210))
    return image


def build_obstacle_narrow_gate() -> Image.Image:
    width, height = 320, 720
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((120, 44, 200, 676), radius=18, fill=rgba((117, 141, 165), 238), outline=rgba((72, 95, 119), 245), width=6)
    draw.rounded_rectangle((94, 22, 226, 90), radius=14, fill=rgba((141, 166, 191), 230), outline=rgba((83, 106, 130), 235), width=4)
    draw.ellipse((128, 306, 192, 370), fill=rgba((86, 109, 133), 245))
    return image


def build_fx_success_burst() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    for points in (
        [(256, 48), (302, 196), (468, 196), (332, 292), (382, 448), (256, 350), (130, 448), (180, 292), (44, 196), (210, 196)],
        [(256, 86), (292, 210), (426, 210), (314, 286), (354, 410), (256, 334), (158, 410), (198, 286), (86, 210), (220, 210)],
    ):
        draw.polygon(points, fill=rgba((255, 226, 120), 225), outline=rgba((249, 168, 67), 240))
    glow = image.filter(ImageFilter.GaussianBlur(8))
    glow_draw = ImageDraw.Draw(glow, "RGBA")
    glow_draw.ellipse((176, 176, 336, 336), fill=rgba((255, 248, 178), 185))
    glow.alpha_composite(image)
    return glow


def build_fx_wind_streak() -> Image.Image:
    width, height = 512, 256
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.polygon([(26, 138), (286, 86), (494, 106), (286, 136)], fill=rgba((188, 225, 255), 156))
    draw.polygon([(12, 168), (266, 120), (496, 132), (266, 164)], fill=rgba((117, 190, 244), 126))
    draw.ellipse((266, 84, 336, 154), fill=rgba((216, 241, 255), 170))
    return image.filter(ImageFilter.GaussianBlur(2))


def build_fx_rim_hit_flash() -> Image.Image:
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((102, 98, 410, 406), outline=rgba((255, 229, 152), 236), width=20)
    draw.ellipse((142, 138, 370, 366), outline=rgba((255, 248, 213), 220), width=12)
    for angle in range(0, 360, 36):
        draw.pieslice((56, 52, 456, 452), start=angle, end=angle + 10, fill=rgba((255, 196, 96), 146))
    return image.filter(ImageFilter.GaussianBlur(1.6))


def build_asset_specs() -> list[AssetSpec]:
    return [
        AssetSpec(ASSET_ROOT / "background" / "office-backplate-main.webp", build_background_backplate, "WEBP"),
        AssetSpec(ASSET_ROOT / "background" / "office-midground-desk-cluster.png", build_background_midground_desk_cluster, "PNG"),
        AssetSpec(ASSET_ROOT / "background" / "office-side-cubicle-left.png", build_background_side_cubicle_left, "PNG"),
        AssetSpec(ASSET_ROOT / "background" / "office-side-cubicle-right.png", build_background_side_cubicle_right, "PNG"),
        AssetSpec(ASSET_ROOT / "background" / "office-foreground-desk-edge.png", build_background_foreground_desk_edge, "PNG"),
        AssetSpec(ASSET_ROOT / "paper" / "paper-ball-main.png", build_paper_ball, "PNG"),
        AssetSpec(ASSET_ROOT / "bin" / "trash-bin-main.png", build_trash_bin, "PNG"),
        AssetSpec(ASSET_ROOT / "fan" / "desk-fan-main.png", build_desk_fan, "PNG"),
        AssetSpec(ASSET_ROOT / "props" / "coffee-cup.png", build_coffee_cup, "PNG"),
        AssetSpec(ASSET_ROOT / "props" / "pencil-holder.png", build_pencil_holder, "PNG"),
        AssetSpec(ASSET_ROOT / "obstacles" / "obstacle-center-block.png", build_obstacle_center_block, "PNG"),
        AssetSpec(ASSET_ROOT / "obstacles" / "obstacle-dual-block-left.png", build_obstacle_dual_block_left, "PNG"),
        AssetSpec(ASSET_ROOT / "obstacles" / "obstacle-dual-block-right.png", build_obstacle_dual_block_right, "PNG"),
        AssetSpec(ASSET_ROOT / "obstacles" / "obstacle-moving-cart.png", build_obstacle_moving_cart, "PNG"),
        AssetSpec(ASSET_ROOT / "obstacles" / "obstacle-swing-panel.png", build_obstacle_swing_panel, "PNG"),
        AssetSpec(ASSET_ROOT / "obstacles" / "obstacle-narrow-gate.png", build_obstacle_narrow_gate, "PNG"),
        AssetSpec(ASSET_ROOT / "fx" / "wind-streak.png", build_fx_wind_streak, "PNG"),
        AssetSpec(ASSET_ROOT / "fx" / "rim-hit-flash.png", build_fx_rim_hit_flash, "PNG"),
        AssetSpec(ASSET_ROOT / "fx" / "success-burst.png", build_fx_success_burst, "PNG"),
    ]


def write_asset(spec: AssetSpec) -> None:
    image = spec.build()
    spec.path.parent.mkdir(parents=True, exist_ok=True)
    if spec.format == "WEBP":
        image.save(spec.path, format="WEBP", quality=88, method=6)
    else:
        image.save(spec.path, format="PNG", optimize=True)


def main() -> None:
    specs = build_asset_specs()
    for spec in specs:
        write_asset(spec)
    print(f"Generated {len(specs)} office raster assets.")


if __name__ == "__main__":
    main()
