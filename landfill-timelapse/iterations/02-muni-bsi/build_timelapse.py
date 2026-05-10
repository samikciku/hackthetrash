#!/usr/bin/env python3
"""
Sentinel-2 L2A timelapse + quantification of the *municipal* waste mound
near the Mirash/Bardh complex (Komuna e Obiliqit, Kosovo).

Each run writes into iterations/<NAME>/. Existing iterations are NEVER
overwritten — pass --iter NAME (or accept the auto timestamp) and the script
will refuse to start if the target directory already contains output.

Outputs per run:
  build_timelapse.py        (exact script copy)
  params.json               (centre, AOI, ROI, thresholds, dates)
  manifest.json             (per-frame metrics + STAC IDs)
  frames/                   true-colour PNGs
  frames_ndvi/              NDVI (rdylgn colormap)
  frames_bsi/               BSI  (inferno colormap)
  timelapse_truecolor.gif
  timelapse_ndvi.gif
  timelapse_bsi.gif
  waste_area.csv
  waste_area_chart.png

Data: Microsoft Planetary Computer (no signup).
"""
from __future__ import annotations
import argparse, csv, json, math, os, shutil, sys, time
from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode
import urllib.request, urllib.error
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# ---- target ---------------------------------------------------------------
LAT, LON      = 42.6666493, 21.061689   # Google-Maps "Municipal Waste Dump"
HALF_KM       = 0.4                     # 800 m × 800 m AOI
PX            = 768
NATIVE_PX     = 80                      # 800 m / 10 m S2 native
ROI_HALF_KM   = 0.2                     # 400 m × 400 m ROI for quantification
NDVI_BARE_THR = 0.25
BSI_BARE_THR  = 0.00
MAX_CLOUD     = 15
START         = "2017-04-01"
END           = date.today().isoformat()
SAMPLE_MONTHS = (4, 6, 8, 10)

PINS = [
    ((42.6666493, 21.061689), (60, 160, 255), "muni"),
    ((42.662365,  21.067158), (255, 60, 60),  "ash"),
]

# ---- bbox / ROI -----------------------------------------------------------
DEG_LAT_PER_KM = 1.0 / 111.13
DEG_LON_PER_KM = 1.0 / (111.32 * math.cos(math.radians(LAT)))
DLAT, DLON = HALF_KM * DEG_LAT_PER_KM, HALF_KM * DEG_LON_PER_KM
MINX, MINY = LON - DLON, LAT - DLAT
MAXX, MAXY = LON + DLON, LAT + DLAT
BBOX_STR = f"{MINX:.6f},{MINY:.6f},{MAXX:.6f},{MAXY:.6f}"
ROI_FRAC = ROI_HALF_KM / HALF_KM
roi_lo = int(round(NATIVE_PX * (0.5 - ROI_FRAC/2)))
roi_hi = int(round(NATIVE_PX * (0.5 + ROI_FRAC/2)))
ROI_PIX_AREA = 10.0 * 10.0

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
DATA = "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox"

# ---- HTTP -----------------------------------------------------------------
def http_json(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def http_bytes(url, retries=2):
    last = None
    for _ in range(retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:
                return r.read()
        except urllib.error.URLError as e:
            last = e; time.sleep(1.5)
    raise last

# ---- STAC -----------------------------------------------------------------
def search_window(d_from, d_to, limit=8):
    body = {
        "collections": ["sentinel-2-l2a"],
        "intersects": {"type":"Point","coordinates":[LON,LAT]},
        "datetime": f"{d_from}/{d_to}",
        "query": {"eo:cloud_cover": {"lt": MAX_CLOUD}},
        "limit": limit,
        "sortby": [{"field":"properties.eo:cloud_cover","direction":"asc"}],
    }
    return http_json(STAC, body).get("features", [])

def pick_scenes():
    scenes, seen = [], set()
    for year in range(int(START[:4]), int(END[:4]) + 1):
        for month in SAMPLE_MONTHS:
            d_from = f"{year}-{month:02d}-01"
            d_to   = f"{year}-{month:02d}-28"
            if d_from < START or d_from > END: continue
            try: feats = search_window(d_from, d_to)
            except urllib.error.HTTPError as e:
                print(f"  search fail {d_from}: {e}", file=sys.stderr); continue
            if not feats: continue
            best = feats[0]
            if best["id"] in seen: continue
            seen.add(best["id"]); scenes.append(best)
    return scenes

# ---- crop fetchers --------------------------------------------------------
def fetch_truecolor(item_id):
    return http_bytes(f"{DATA}/{BBOX_STR}/{PX}x{PX}.png?" + urlencode({
        "collection":"sentinel-2-l2a","item":item_id,"assets":"visual"}))

def _ndvi_qs(item_id):
    return [
        ("collection","sentinel-2-l2a"), ("item", item_id),
        ("assets","B04"), ("assets","B08"),
        ("expression","(B08-B04)/(B08+B04)"),
        ("rescale","-1,1"), ("asset_as_band","true"),
    ]

def _bsi_qs(item_id):
    # BSI = (SWIR1 + Red - NIR - Blue) / (SWIR1 + Red + NIR + Blue)
    return [
        ("collection","sentinel-2-l2a"), ("item", item_id),
        ("assets","B02"), ("assets","B04"),
        ("assets","B08"), ("assets","B11"),
        ("expression","(B11+B04-B08-B02)/(B11+B04+B08+B02)"),
        ("rescale","-0.5,0.5"), ("asset_as_band","true"),
    ]

def fetch_index_colored(qs_fn, item_id, colormap):
    qs = qs_fn(item_id) + [("colormap_name", colormap)]
    return http_bytes(f"{DATA}/{BBOX_STR}/{PX}x{PX}.png?{urlencode(qs)}")

def fetch_index_native(qs_fn, item_id, lo, hi):
    raw = http_bytes(f"{DATA}/{BBOX_STR}/{NATIVE_PX}x{NATIVE_PX}.png?"
                     f"{urlencode(qs_fn(item_id))}")
    arr = np.array(Image.open(BytesIO(raw)))
    if arr.ndim == 2:
        band, alpha = arr, np.full_like(arr, 255)
    elif arr.shape[-1] == 2:
        band, alpha = arr[..., 0], arr[..., 1]
    elif arr.shape[-1] == 4:
        band, alpha = arr[..., 0], arr[..., 3]
    else:
        band, alpha = arr[..., 0], np.full(arr.shape[:2], 255, np.uint8)
    val = band.astype(np.float32) / 255.0 * (hi - lo) + lo
    val[alpha == 0] = np.nan
    return val

# ---- annotation -----------------------------------------------------------
def _font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def latlon_to_px(lat, lon, w, h):
    fx = (lon - MINX) / (MAXX - MINX)
    fy = 1.0 - (lat - MINY) / (MAXY - MINY)
    return int(round(fx*w)), int(round(fy*h))

def annotate(img_bytes, label, sublabel=None, show_roi=True):
    im = Image.open(BytesIO(img_bytes)).convert("RGB")
    draw = ImageDraw.Draw(im)
    font, sub = _font(28), _font(18)
    pad = 8
    bb = draw.textbbox((0,0), label, font=font)
    th = bb[3]-bb[1]
    banner_h = th + 2*pad + (sub.size + 4 if sublabel else 0)
    draw.rectangle([(0,0),(im.width,banner_h)], fill=(0,0,0))
    draw.text((pad, pad-bb[1]), label, fill=(255,255,255), font=font)
    if sublabel:
        draw.text((pad, pad+th+2), sublabel, fill=(200,200,200), font=sub)
    if show_roi:
        x0 = int(im.width  * (0.5 - ROI_FRAC/2))
        y0 = int(im.height * (0.5 - ROI_FRAC/2))
        x1 = int(im.width  * (0.5 + ROI_FRAC/2))
        y1 = int(im.height * (0.5 + ROI_FRAC/2))
        draw.rectangle([x0,y0,x1,y1], outline=(255,255,0), width=2)
    for (lat, lon), color, name in PINS:
        if not (MINX < lon < MAXX and MINY < lat < MAXY): continue
        x, y = latlon_to_px(lat, lon, im.width, im.height)
        r = 7
        draw.ellipse([x-r,y-r,x+r,y+r], outline=color, width=3)
        draw.text((x+10, y-10), name, fill=color, font=sub)
    bar_m = 200
    bar_px = int(im.width * bar_m / (HALF_KM*2*1000))
    bx0, by0 = 12, im.height-28
    draw.rectangle([bx0,by0,bx0+bar_px,by0+6], fill=(255,255,255))
    draw.text((bx0, by0-18), f"{bar_m} m", fill=(255,255,255), font=sub)
    return im

# ---- chart ----------------------------------------------------------------
def plot_timeseries(rows, out_dir):
    if not rows: return
    rows = sorted(rows, key=lambda r: r["date"])
    dts  = [datetime.fromisoformat(r["date"]) for r in rows]
    nd_mean   = [r["mean_ndvi"]          for r in rows]
    bsi_mean  = [r["mean_bsi"]           for r in rows]
    bare_ndvi = [r["bare_area_m2_ndvi"]  for r in rows]
    bare_bsi  = [r["bare_area_m2_bsi"]   for r in rows]

    fig, (axA, axB) = plt.subplots(2, 1, figsize=(11, 8), sharex=True,
                                   gridspec_kw={"hspace": 0.10})
    fig.suptitle(
        f"Pristina municipal waste mound (Mirash, "
        f"{LAT:.5f}, {LON:.5f}) — Sentinel-2 growth signal",
        fontsize=13)

    axA.plot(dts, bare_bsi,  "o-",  color="#c44", lw=1.6, ms=5,
             label=f"BSI > {BSI_BARE_THR}  (bare/waste, robust)")
    axA.plot(dts, bare_ndvi, "x--", color="#a86", lw=1.0, ms=5, alpha=0.7,
             label=f"NDVI < {NDVI_BARE_THR}  (bare incl. water)")
    axA.set_ylabel(f"bare area in {ROI_HALF_KM*2*1000:.0f} m ROI  (m²)")
    axA.grid(True, alpha=0.3)
    axA.legend(loc="lower right", fontsize=9)
    axA.axhline(160000, color="grey", lw=0.8, ls=":", alpha=0.6)
    axA.text(dts[0], 161000, "ROI saturation = 160 000 m²",
             color="grey", fontsize=8, va="bottom")

    axB.plot(dts, nd_mean,  "s-",  color="#2a7", lw=1.4, ms=4,
             label="mean NDVI (vegetation strength)")
    axB.plot(dts, bsi_mean, "^--", color="#c44", lw=1.4, ms=4,
             label="mean BSI  (bare-soil strength)")
    axB.axhline(0, color="black", lw=0.5, alpha=0.5)
    axB.set_ylabel("mean index value inside ROI")
    axB.set_xlabel("date")
    axB.grid(True, alpha=0.3)
    axB.legend(loc="center right", fontsize=9)
    axB.xaxis.set_major_locator(mdates.YearLocator())
    axB.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
    fig.savefig(out_dir / "waste_area_chart.png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    print("Wrote waste_area_chart.png")

def write_csv(rows, out_dir):
    with (out_dir / "waste_area.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=[
            "date","item","cloud_pct",
            "mean_ndvi","mean_bsi",
            "bare_pixels_ndvi","bare_area_m2_ndvi",
            "bare_pixels_bsi","bare_area_m2_bsi",
            "roi_pixels"])
        w.writeheader()
        for r in rows: w.writerow(r)
    print("Wrote waste_area.csv")

# ---- output dir handling --------------------------------------------------
def resolve_out_dir(cli_iter: str | None) -> Path:
    base = Path(__file__).resolve().parent / "iterations"
    base.mkdir(exist_ok=True)
    if cli_iter:
        name = cli_iter
    else:
        name = datetime.now().strftime("auto-%Y%m%dT%H%M%S")
    out = base / name
    if out.exists() and any(out.iterdir()):
        sys.exit(f"refusing to overwrite non-empty iteration: {out}")
    out.mkdir(parents=True, exist_ok=True)
    # snapshot the script alongside its outputs
    shutil.copy2(__file__, out / "build_timelapse.py")
    return out

# ---- main -----------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--iter", dest="iter_name", default=None,
                    help="iterations/<NAME>/ subdir; auto-timestamp if omitted")
    args = ap.parse_args()

    out = resolve_out_dir(args.iter_name)
    frames  = (out/"frames");      frames.mkdir()
    ndvidir = (out/"frames_ndvi"); ndvidir.mkdir()
    bsidir  = (out/"frames_bsi");  bsidir.mkdir()

    print(f"→ writing iteration {out}")
    print(f"Centre: {LAT}, {LON}   half-side {HALF_KM} km   ROI "
          f"{ROI_HALF_KM*2*1000:.0f} m square")
    print(f"BBOX:   {BBOX_STR}")
    print(f"Window {START} → {END}, months {SAMPLE_MONTHS}, max cloud {MAX_CLOUD}%")

    scenes = pick_scenes()
    print(f"Picked {len(scenes)} scenes\n")

    tc_imgs, nd_imgs, bs_imgs = [], [], []
    rows, manifest = [], []

    for i, feat in enumerate(scenes, 1):
        item_id = feat["id"]
        dt      = feat["properties"]["datetime"][:10]
        cc      = feat["properties"].get("eo:cloud_cover", 0.0)
        label   = f"{dt}   cloud {cc:.1f}%"

        try: tc = fetch_truecolor(item_id)
        except urllib.error.HTTPError as e:
            print(f"  [{i:2d}/{len(scenes)}] {dt} TC fail {e}"); continue
        im_tc = annotate(tc, label, "Sentinel-2 L2A • true colour • muni focus")
        im_tc.save(frames / f"{dt}__{item_id}.png"); tc_imgs.append(im_tc)

        try:
            nd = fetch_index_colored(_ndvi_qs, item_id, "rdylgn")
            im_nd = annotate(nd, label, "NDVI • green=veg  pale=bare/waste")
            im_nd.save(ndvidir / f"{dt}__{item_id}.png"); nd_imgs.append(im_nd)
        except urllib.error.HTTPError as e:
            print(f"  [{i:2d}/{len(scenes)}] {dt} NDVI viz fail {e}")

        try:
            bs = fetch_index_colored(_bsi_qs, item_id, "inferno")
            im_bs = annotate(bs, label, "BSI • bright=bare/waste  dark=veg/water")
            im_bs.save(bsidir / f"{dt}__{item_id}.png"); bs_imgs.append(im_bs)
        except urllib.error.HTTPError as e:
            print(f"  [{i:2d}/{len(scenes)}] {dt} BSI viz fail {e}")

        ndvi_raw = bsi_raw = None
        try: ndvi_raw = fetch_index_native(_ndvi_qs, item_id, -1.0, 1.0)
        except urllib.error.HTTPError as e: print(f"  NDVI raw fail {e}")
        try: bsi_raw  = fetch_index_native(_bsi_qs,  item_id, -0.5, 0.5)
        except urllib.error.HTTPError as e: print(f"  BSI raw fail {e}")

        if ndvi_raw is not None and bsi_raw is not None:
            roi_n = ndvi_raw[roi_lo:roi_hi, roi_lo:roi_hi]
            roi_b = bsi_raw [roi_lo:roi_hi, roi_lo:roi_hi]
            valid = (~np.isnan(roi_n)) & (~np.isnan(roi_b))
            n_valid = int(valid.sum())
            if n_valid:
                mn = float(np.mean(roi_n[valid]))
                mb = float(np.mean(roi_b[valid]))
                bnd = int(np.sum(roi_n[valid] < NDVI_BARE_THR))
                bbs = int(np.sum(roi_b[valid] > BSI_BARE_THR))
                row = {"date":dt, "item":item_id,
                       "cloud_pct":round(cc,3),
                       "mean_ndvi":round(mn,4), "mean_bsi":round(mb,4),
                       "bare_pixels_ndvi":bnd,
                       "bare_area_m2_ndvi":int(bnd*ROI_PIX_AREA),
                       "bare_pixels_bsi":bbs,
                       "bare_area_m2_bsi":int(bbs*ROI_PIX_AREA),
                       "roi_pixels":n_valid}
                rows.append(row); manifest.append(row)
                print(f"  [{i:2d}/{len(scenes)}] {dt} c{cc:5.2f}%  "
                      f"NDVI {mn:+.3f}  BSI {mb:+.3f}  "
                      f"bare(BSI) {bbs*ROI_PIX_AREA/1e3:5.1f}ka")
        time.sleep(0.15)

    if not tc_imgs: sys.exit("No frames produced.")

    tc_imgs[0].save(out/"timelapse_truecolor.gif", save_all=True,
                    append_images=tc_imgs[1:], duration=350, loop=0, optimize=True)
    print(f"\nWrote timelapse_truecolor.gif ({len(tc_imgs)} frames)")
    if nd_imgs:
        nd_imgs[0].save(out/"timelapse_ndvi.gif", save_all=True,
                        append_images=nd_imgs[1:], duration=350, loop=0, optimize=True)
        print(f"Wrote timelapse_ndvi.gif      ({len(nd_imgs)} frames)")
    if bs_imgs:
        bs_imgs[0].save(out/"timelapse_bsi.gif", save_all=True,
                        append_images=bs_imgs[1:], duration=350, loop=0, optimize=True)
        print(f"Wrote timelapse_bsi.gif       ({len(bs_imgs)} frames)")

    write_csv(rows, out)
    plot_timeseries(rows, out)

    (out/"params.json").write_text(json.dumps({
        "centre": {"lat":LAT,"lon":LON},
        "half_km":HALF_KM, "px":PX, "native_px":NATIVE_PX,
        "roi_half_km":ROI_HALF_KM,
        "ndvi_bare_threshold":NDVI_BARE_THR,
        "bsi_bare_threshold":BSI_BARE_THR,
        "bbox":[MINX,MINY,MAXX,MAXY],
        "max_cloud_pct":MAX_CLOUD,
        "window":[START,END],
        "sample_months":list(SAMPLE_MONTHS),
        "pins":[{"name":n,"lat":p[0],"lon":p[1]} for p,_,n in PINS],
        "data_source": "Microsoft Planetary Computer · sentinel-2-l2a",
    }, indent=2))
    (out/"manifest.json").write_text(json.dumps(
        {"frames": manifest}, indent=2))
    print("Wrote params.json + manifest.json")

if __name__ == "__main__":
    main()
