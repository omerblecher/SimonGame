from PIL import Image, ImageDraw
import os

BACKGROUND = '#0f172a'
COLORS = {'TL': '#4ade80', 'TR': '#f87171', 'BL': '#fbbf24', 'BR': '#60a5fa'}
MIPMAP_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
RES_DIR = 'android/app/src/main/res'
ASSETS_DIR = 'assets/icons'


def make_simon_icon(size):
    img = Image.new('RGBA', (size, size), BACKGROUND)
    draw = ImageDraw.Draw(img)
    gap = max(2, size // 48)
    half = size // 2
    draw.rectangle([gap, gap, half - gap, half - gap], fill=COLORS['TL'])
    draw.rectangle([half + gap, gap, size - gap, half - gap], fill=COLORS['TR'])
    draw.rectangle([gap, half + gap, half - gap, size - gap], fill=COLORS['BL'])
    draw.rectangle([half + gap, half + gap, size - gap, size - gap], fill=COLORS['BR'])
    return img


def make_round_icon(size):
    img = make_simon_icon(size)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    img.putalpha(mask)
    return img


os.makedirs(ASSETS_DIR, exist_ok=True)

make_simon_icon(512).convert('RGB').save(f'{ASSETS_DIR}/simon-icon-512.png')

fg = Image.new('RGB', (1024, 500), BACKGROUND)
draw = ImageDraw.Draw(fg)
gap = 10
half_w, half_h = 512, 250
draw.rectangle([gap, gap, half_w - gap, half_h - gap], fill=COLORS['TL'])
draw.rectangle([half_w + gap, gap, 1024 - gap, half_h - gap], fill=COLORS['TR'])
draw.rectangle([gap, half_h + gap, half_w - gap, 500 - gap], fill=COLORS['BL'])
draw.rectangle([half_w + gap, half_h + gap, 1024 - gap, 500 - gap], fill=COLORS['BR'])
fg.save(f'{ASSETS_DIR}/feature-graphic.png')

for mipmap_dir, size in MIPMAP_SIZES.items():
    out_dir = f'{RES_DIR}/{mipmap_dir}'
    os.makedirs(out_dir, exist_ok=True)
    make_simon_icon(size).convert('RGB').save(f'{out_dir}/ic_launcher.png')
    make_round_icon(size).save(f'{out_dir}/ic_launcher_round.png')

print('Icon generation complete.')
