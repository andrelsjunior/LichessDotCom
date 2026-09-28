"""Chess.com's boards and piece sets, bundled in public/img/boards and public/img/pieces.

Reads the lists in src/content/boards/catalog.json (boards, pieceSets),
downloads each one from its CDN and writes it as WebP:

  public/img/boards/<id>.webp        the board, 1200px (150px squares)
  public/img/boards/<id>-tile.webp   its two top-left squares, 160x80, for the menu
  public/img/pieces/<set>/<wp…>.webp each piece, PIECE_PX square

An entry's "host" says which CDN has it: "themes" for the newer ones
(assets-themes.chess.com, a board there in its "format"), otherwise the older
images.chesscomfiles.com.

Run it again when a board or a set is added to the catalog. Existing files
are kept unless --force. Needs Pillow (with WebP).

  python3 tools/boards/fetch.py [--force]
"""

import io
import json
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FILES = 'https://images.chesscomfiles.com/chess-themes'
THEMES = 'https://assets-themes.chess.com/image'
PIECES = [color + role for color in 'wb' for role in 'pnbrqk']
BOARD_PX = 1200
TILE_SQ = 80
PIECE_PX = 300  # sharp on a big board at 2x; the CDN serves up to 300


def lists():
    with open(ROOT / 'src/content/boards/catalog.json', encoding='utf-8') as file:
        catalog = json.load(file)
    return catalog['boards'], catalog['pieceSets']


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 Chrome/140'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return Image.open(io.BytesIO(response.read()))
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1)


def save(image, path, **options):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, 'WEBP', method=6, **options)


def on_themes_host(entry):
    return entry.get('host') == 'themes'


def board_url(board):
    # The newer host serves 200px squares; the older one 150px as well.
    if on_themes_host(board):
        return f"{THEMES}/{board['id']}/200.{board.get('format', 'png')}"
    return f"{FILES}/boards/{board['id']}/150.png"


def piece_url(piece_set, piece):
    if on_themes_host(piece_set):
        return f"{THEMES}/{piece_set['id']}/{PIECE_PX}/{piece}.png"
    return f"{FILES}/pieces/{piece_set['id']}/{PIECE_PX}/{piece}.png"


def fetch_board(board, out, force):
    board_id = board['id']
    image_path, tile_path = out / f'boards/{board_id}.webp', out / f'boards/{board_id}-tile.webp'
    if image_path.exists() and tile_path.exists() and not force:
        return
    image = get(board_url(board)).convert('RGB')
    image = image.resize((BOARD_PX, BOARD_PX), Image.LANCZOS) if image.width != BOARD_PX else image
    save(image, image_path, quality=86)
    square = BOARD_PX // 8
    tile = image.crop((0, 0, 2 * square, square)).resize((2 * TILE_SQ, TILE_SQ), Image.LANCZOS)
    save(tile, tile_path, quality=86)
    print('board', board_id)


def fetch_piece_set(piece_set, out, force):
    for piece in PIECES:
        path = out / f"pieces/{piece_set['id']}/{piece}.webp"
        if path.exists() and not force:
            continue
        image = get(piece_url(piece_set, piece)).convert('RGBA')
        if image.width != PIECE_PX:
            image = image.resize((PIECE_PX, PIECE_PX), Image.LANCZOS)
        save(image, path, quality=88, alpha_quality=100)
    print('pieces', piece_set['id'])


def main(force):
    boards, piece_sets = lists()
    out = ROOT / 'public/img'
    for board in boards:
        fetch_board(board, out, force)
    for piece_set in piece_sets:
        fetch_piece_set(piece_set, out, force)


if __name__ == '__main__':
    main('--force' in sys.argv)
