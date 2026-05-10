#!/usr/bin/env python3
"""
Sentinel-2 L2A timelapse over the Pristina landfill complex (Mirash/Bardh):
the KLMC municipal-waste landfill *and* the adjacent Kosovo B power-plant
ash dump are both captured in one frame.

Data: Microsoft Planetary Computer (no signup required).
  STAC search:  https://planetarycomputer.microsoft.com/api/stac/v1/search
  Image render: https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/...

Two products are produced from the same scene list:
  timelapse_truecolor.gif   — what the eye sees (assets=visual)
  timelapse_ndvi.gif        — NDVI, vegetation green / bare-waste pale-yellow
                              (expression on B08 + B04, rdylgn colormap)
"""
from __future__ import annotations
import json, math, os, sys, time
from datetime import date
from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode
import urllib.request, urllib.error
from PIL import Image, ImageDraw, ImageFont

# ---- target ----------------------------------------------------------------
# Midpoint between the two pins so the AOI swallows both:
#   ash dump (Kosovo B):    42.662365, 21.067158
#   municipal landfill:     42.666649, 21.061689   (Google Maps marker)
LAT, LON = 42.664507, 21.064424
HALF_KM   = 1.0          # 2 km × 2 km AOI (separation between dumps is ~650 m)
PX        = 768          # output side in pixels
MAX_CLOUD = 15           # %
START     = "2017-04-01" # Sentinel-2 L2A reliable archive start
END       = date.today().isoformat()
SAMPLE_MONTHS = (5, 8)   # May + August → 2 frames/year

# Pins to draw on every frame for orientation
PINS = [
    ((42.662365, 21.067158), (255, 60, 60),  "ash"),     # ash dump
    ((42.666649, 21.061689), (60, 160, 255), "muni"),    # municipal landfill
]

# ---- bbox in lon/lat -------------------------------------------------------
DEG_LAT_PER_KM = 1.0 / 111.13
DEG_LON_PER_KM = 1.0 / (111.32 * math.cos(math.radians(LAT)))
DLAT = HALF_KM * DEG_LAT_PER_KM
DLON = HALF_KM * DEG_LON_PER_KM
MINX, MINY = LON - DLON, LAT - DLAT
MAXX, MAXY = LON + DLON, LAT + DLAT
BBOX_STR = f"{MINX:.6f},{MINY:.6f},{MAXX:.6f},{MAXY:.6f}"

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
DATA = "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox"

OUT     = Path(__file__).parent
FRAMES  = OUT / "frames"
NDVIDIR = OUT / "frames_ndvi"
FRAMES.mkdir(exist_ok=True)
NDVIDIR.mkdir(exist_ok=True)


# ---- HTTP helpers ----------------------------------------------------------
def http_json(url: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def http_bytes(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=180) as r:
        return r.read()


# ---- STAC search -----------------------------------------------------------
def search_window(d_from: str, d_to: str, limit: int = 8) -> list[dict]:
    body = {
        "collections": ["sentinel-2-l2a"],
        "intersects": {"type": "Point", "coordinates": [LON, LAT]},
        "datetime": f"{d_from}/{d_to}",
        "query": {"eo:cloud_cover": {"lt": MAX_CLOUD}},
        "limit": limit,
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
    }
    return http_json(STAC, body).get("features", [])


def pick_scenes() -> list[dict]:
    scenes, seen = [], set()
    for year in range(int(START[:4]), int(END[:4]) + 1):
        for month in SAMPLE_MONTHS:
            d_from = f"{year}-{month:02d}-01"
            d_to   = f"{year}-{month:02d}-28"
            if d_from < START or d_from > END:
                continue
            try:
                feats = search_window(d_from, d_to)
            except urllib.error.HTTPError as e:
                print(f"  search fail {d_from}: {e}", file=sys.stderr)
                continue
            if not feats:
                continue
            best = feats[0]
            if best["id"] in seen:
                continue
            seen.add(best["id"])
            scenes.append(best)
    return scenes


# ---- crop fetchers ---------------------------------------------------------
def fetch_truecolor(item_id: str) -> bytes:
    qs = urlencode({
        "collection": "sentinel-2-l2a",
        "item":       item_id,
        "assets":     "visual",
    })
    return http_bytes(f"{DATA}/{BBOX_STR}/{PX}x{PX}.png?{qs}")


def fetch_ndvi(item_id: str) -> bytes:
    # NDVI = (NIR - Red) / (NIR + Red), rescaled -1..1, rdylgn colormap.
    # asset_as_band=true lets us name B04/B08 directly in the expression.
    params = [
        ("collection",     "sentinel-2-l2a"),
        ("item",           item_id),
        ("assets",         "B04"),
        ("assets",         "B08"),
        ("expression",     "(B08-B04)/(B08+B04)"),
        ("rescale",        "-1,1"),
        ("colormap_name",  "rdylgn"),
        ("asset_as_band",  "true"),
    ]
    return http_bytes(f"{DATA}/{BBOX_STR}/{PX}x{PX}.png?{urlencode(params)}")


# ---- annotation ------------------------------------------------------------
def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def latlon_to_px(lat: float, lon: float, w: int, h: int) -> tuple[int, int]:
    fx = (lon - MINX) / (MAXX - MINX)
    fy = 1.0 - (lat - MINY) / (MAXY - MINY)
    return int(round(fx * w)), int(round(fy * h))


def annotate(img_bytes: bytes, label: str, sublabel: str | None = None) -> Image.Image:
    im = Image.open(BytesIO(img_bytes)).convert("RGB")
    draw = ImageDraw.Draw(im)
    font = _font(28)
    sub  = _font(18)

    # Header banner with date / cloud %
    pad = 8
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    banner_h = th + 2*pad + (sub.size + 4 if sublabel else 0)
    draw.rectangle([(0, 0), (im.width, banner_h)], fill=(0, 0, 0))
    draw.text((pad, pad - bbox[1]), label, fill=(255, 255, 255), font=font)
    if sublabel:
        draw.text((pad, pad + th + 2), sublabel, fill=(200, 200, 200), font=sub)

    # Pins
    for (lat, lon), color, name in PINS:
        x, y = latlon_to_px(lat, lon, im.width, im.height)
        r = 7
        draw.ellipse([x-r, y-r, x+r, y+r], outline=color, width=3)
        draw.text((x + 10, y - 10), name, fill=color, font=sub)

    # Scale bar (500 m)
    bar_m = 500
    bar_px = int(im.width * bar_m / (HALF_KM * 2 * 1000))
    bx0, by0 = 12, im.height - 28
    draw.rectangle([bx0, by0, bx0 + bar_px, by0 + 6], fill=(255, 255, 255))
    draw.text((bx0, by0 - 18), f"{bar_m} m", fill=(255, 255, 255), font=sub)
    return im


# ---- main ------------------------------------------------------------------
def main():
    print(f"Centre: {LAT}, {LON}   half-side: {HALF_KM} km")
    print(f"BBOX  : {BBOX_STR}")
    print(f"Window: {START} → {END}, months {SAMPLE_MONTHS}, "
          f"max cloud {MAX_CLOUD}%")

    scenes = pick_scenes()
    print(f"Picked {len(scenes)} scenes\n")

    tc_imgs:   list[Image.Image] = []
    ndvi_imgs: list[Image.Image] = []
    manifest = []

    for i, feat in enumerate(scenes, 1):
        item_id = feat["id"]
        dt      = feat["properties"]["datetime"][:10]
        cc      = feat["properties"].get("eo:cloud_cover", 0.0)
        label   = f"{dt}   cloud {cc:.1f}%"

        # true colour
        try:
            tc = fetch_truecolor(item_id)
        except urllib.error.HTTPError as e:
            print(f"  [{i:2d}/{len(scenes)}] {dt}  TC fail  {e}")
            continue
        im_tc = annotate(tc, label, "Sentinel-2 L2A • true colour")
        im_tc.save(FRAMES / f"{dt}__{item_id}.png")

        # ndvi
        try:
            nd = fetch_ndvi(item_id)
        except urllib.error.HTTPError as e:
            print(f"  [{i:2d}/{len(scenes)}] {dt}  NDVI fail  {e}")
            ndvi_ok = False
        else:
            im_nd = annotate(nd, label, "NDVI  green=veg  pale=bare/waste")
            im_nd.save(NDVIDIR / f"{dt}__{item_id}.png")
            ndvi_imgs.append(im_nd)
            ndvi_ok = True

        tc_imgs.append(im_tc)
        manifest.append({"date": dt, "item": item_id, "cloud": cc,
                         "ndvi": ndvi_ok})
        print(f"  [{i:2d}/{len(scenes)}] {dt}  cloud {cc:5.2f}%  "
              f"tc✓ ndvi{'✓' if ndvi_ok else '✗'}")
        time.sleep(0.2)

    if not tc_imgs:
        sys.exit("No frames produced.")

    # GIFs
    tc_imgs[0].save(OUT / "timelapse_truecolor.gif", save_all=True,
                    append_images=tc_imgs[1:], duration=600, loop=0,
                    optimize=True)
    print(f"\nWrote timelapse_truecolor.gif  ({len(tc_imgs)} frames)")
    if ndvi_imgs:
        ndvi_imgs[0].save(OUT / "timelapse_ndvi.gif", save_all=True,
                          append_images=ndvi_imgs[1:], duration=600, loop=0,
                          optimize=True)
        print(f"Wrote timelapse_ndvi.gif       ({len(ndvi_imgs)} frames)")

    (OUT / "manifest.json").write_text(json.dumps({
        "centre": {"lat": LAT, "lon": LON},
        "half_km": HALF_KM,
        "bbox": [MINX, MINY, MAXX, MAXY],
        "px": PX,
        "max_cloud_pct": MAX_CLOUD,
        "window": [START, END],
        "sample_months": list(SAMPLE_MONTHS),
        "pins": [{"name": n, "lat": p[0], "lon": p[1]} for p, _, n in PINS],
        "frames": manifest,
    }, indent=2))
    print("Wrote manifest.json")


if __name__ == "__main__":
    main()
