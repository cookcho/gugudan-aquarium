# 캐릭터 그림을 게임용으로 다듬어요. 원본은 art-source/characters 에 보관해요.
# 1) 배경이 투명하지 않으면(흰 배경, AI가 그려 넣은 회색 체크무늬) 가장자리와 이어진 밝은 회색을 지워요.
# 2) 512px로 줄여요.
# 사용법: 그림을 public/characters 에 넣은 뒤  python scripts/optimize-characters.py
from collections import deque
from pathlib import Path
import shutil

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GAME_DIR = ROOT / 'public' / 'characters'
SOURCE_DIR = ROOT / 'art-source' / 'characters'
SIZE = 512


def is_background(rgb):
    # 흰색이나 밝은 회색(체크무늬)처럼 색이 거의 없는 밝은 점
    r, g, b = rgb
    return min(r, g, b) > 205 and max(r, g, b) - min(r, g, b) < 14


def clear_background(im):
    """가장자리에서 시작해 이어진 밝은 회색 배경을 투명하게 만들어요. 캐릭터의 진한 테두리에서 멈춰요."""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not is_background(px[x, y][:3]):
            continue
        px[x, y] = (255, 255, 255, 0)
        if x > 0: queue.append((x - 1, y))
        if x < w - 1: queue.append((x + 1, y))
        if y > 0: queue.append((x, y - 1))
        if y < h - 1: queue.append((x, y + 1))
    return im


def defringe(im, passes=3):
    """배경과 맞닿은 테두리의 밝은 회색·흰색 점(배경이 번진 자국)을 지워요. 진한 외곽선은 그대로 둬요."""
    w, h = im.size
    for _ in range(passes):
        px = im.load()
        edge = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0 or min(r, g, b) < 150 or max(r, g, b) - min(r, g, b) > 40:
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1), (x - 1, y - 1), (x + 1, y + 1), (x - 1, y + 1), (x + 1, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        edge.append((x, y))
                        break
        if not edge:
            break
        for x, y in edge:
            px[x, y] = (255, 255, 255, 0)
    return im


def remove_specks(im, min_ratio=0.002):
    """배경을 지우고 남은 자잘한 부스러기(본 그림과 떨어진 작은 점)를 지워요."""
    w, h = im.size
    alpha = im.getchannel('A').load()
    px = im.load()
    seen = bytearray(w * h)
    min_size = int(w * h * min_ratio)
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or alpha[sx, sy] == 0:
                continue
            group = []
            queue = deque([(sx, sy)])
            seen[i] = 1
            while queue:
                x, y = queue.popleft()
                group.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and alpha[nx, ny] > 0:
                            seen[j] = 1
                            queue.append((nx, ny))
            if len(group) < min_size:
                for x, y in group:
                    px[x, y] = (255, 255, 255, 0)
    return im


SOURCE_DIR.mkdir(parents=True, exist_ok=True)
for png in sorted(GAME_DIR.glob('*.png')):
    im = Image.open(png).convert('RGBA')
    opaque = im.getchannel('A').getextrema()[0] == 255
    if max(im.size) <= SIZE and not opaque:
        continue
    shutil.copy2(png, SOURCE_DIR / png.name)
    before = png.stat().st_size
    notes = []
    if opaque:
        im = remove_specks(defringe(clear_background(im)))
        notes.append('배경 지움')
    if max(im.size) > SIZE:
        im = im.resize((SIZE, SIZE), Image.LANCZOS)
        notes.append('512px로 줄임')
    im.save(png, optimize=True)
    print(f'{png.name}: {", ".join(notes)} ({before // 1024}KB -> {png.stat().st_size // 1024}KB, 원본은 art-source/characters)')
