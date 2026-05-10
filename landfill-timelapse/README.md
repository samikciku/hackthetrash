# Landfill timelapse

Sentinel-2 time-series of the Mirash/Bardh waste-disposal complex
(Komuna e Obiliqit, Kosovo). Two adjacent dumps share this corner of land:

| pin    | what it is                                  | lat / lon              |
|--------|---------------------------------------------|------------------------|
| `muni` | KLMC municipal-waste landfill (Google Maps "Municipal Waste Dump") | 42.6666493, 21.061689 |
| `ash`  | Kosovo B power plant fly-ash deposit + slurry pond | 42.662365, 21.067158 |

The two pins are ~650 m apart and visually merge in any wide view.

## Data source

**Microsoft Planetary Computer** — public, anonymous proxy onto the same
Sentinel-2 L2A archive Copernicus distributes. No API key.
- STAC search:  `https://planetarycomputer.microsoft.com/api/stac/v1/search`
- Image render: `https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{minx},{miny},{maxx},{maxy}/{w}x{h}.png?...`

Same pixels as Copernicus Data Space, just without the OAuth dance.
If you ever want to switch, register at <https://dataspace.copernicus.eu>
and swap the two endpoint URLs.

## Layout

```
landfill-timelapse/
├── README.md                          ← this file
├── REPORT.md                          ← findings across iterations
├── build_timelapse.py                 ← current builder; takes --iter NAME
└── iterations/
    ├── 01-midpoint-2km/               ← v1: 2 km AOI, midpoint, 14 frames
    └── 02-muni-bsi/                   ← v2: 800 m AOI muni-focused, 35 frames,
                                          NDVI + BSI + chart + CSV
```

Each iteration directory is **frozen**. Don't overwrite — make a new one.

## Re-running

```bash
# default: writes into iterations/<auto-timestamp>/
python3 build_timelapse.py

# explicit name:
python3 build_timelapse.py --iter 03-larger-roi
```

The builder refuses to overwrite an existing iteration directory.

## What's in each iteration

Every iteration directory contains the same set of artefacts:

| file                          | what                                     |
|-------------------------------|------------------------------------------|
| `build_timelapse.py`          | exact script that produced this iter     |
| `params.json`                 | centre, AOI, ROI, thresholds             |
| `manifest.json`               | per-frame STAC IDs, cloud %, metrics     |
| `frames/`                     | true-colour PNGs, one per date           |
| `frames_ndvi/`                | NDVI PNGs (rdylgn colormap)              |
| `frames_bsi/`                 | BSI PNGs (inferno colormap) — iter ≥ 02  |
| `timelapse_truecolor.gif`     | animated true colour                     |
| `timelapse_ndvi.gif`          | animated NDVI                            |
| `timelapse_bsi.gif`           | animated BSI — iter ≥ 02                 |
| `waste_area.csv`              | per-scene metrics — iter ≥ 02            |
| `waste_area_chart.png`        | time-series plot — iter ≥ 02             |
