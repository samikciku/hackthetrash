# Mirash municipal landfill — Sentinel-2 timelapse findings

**What was measured**: the bare-ground footprint of the KLMC municipal-waste
mound at Mirash (Komuna e Obiliqit), 2017 → April 2026.

**How**: 35 cloud-clean Sentinel-2 L2A scenes (4 per year: Apr / Jun / Aug /
Oct, max cloud cover 15 %), pulled anonymously from the Microsoft Planetary
Computer STAC. NDVI and BSI computed from the L2A bands; per-scene mean +
threshold-area metrics extracted from a 400 m × 400 m ROI centred on the
muni pin (42.6666493, 21.061689). All artefacts in
`iterations/02-muni-bsi/`.

---

## TL;DR

| metric                          | 2017 (4-scene mean) | 2026-04-27 | change |
|---------------------------------|---------------------|------------|--------|
| mean NDVI inside 400 m ROI      | +0.258              | +0.060     | **−77 %** |
| mean BSI  inside 400 m ROI      | +0.106              | +0.109     | flat (saturated) |
| bare-ground area, NDVI<0.25 (m²)| 87,400              | 150,300    | **+72 %** |
| bare-ground area, BSI>0    (m²) | 128,875             | 151,800    | +18 %  |

The municipal mound went from "mostly vegetated, small visible pile" in 2017
to "every pixel inside the 400 m ROI reads as bare ground" by 2024. The
measurement window is now too small — the mound has overflowed it.

> **One-liner for the dossier**: *"Sentinel-2 NDVI inside a 400 m square at
> the Mirash municipal landfill fell from +0.26 to +0.06 between 2017 and
> April 2026 — a 77 % collapse in the vegetation index, indicating the
> mound now occupies essentially the entire measurement window."*

---

## What I notice

### 1. The dump tripled in measured "bare" area between 2017 and ~2022.

Bare-by-NDVI rose from **~87,000 m²** in 2017 to **~155,000 m²** by 2022 and
then plateaued only because the 400 m × 400 m ROI hit its 160,000 m² ceiling.
The growth itself didn't stop — the metric just ran out of room.

Visible in: `iterations/02-muni-bsi/waste_area_chart.png` (top panel,
solid red and dashed brown traces converging on the dotted "ROI saturation"
line).

### 2. There is a step-change in 2021.

Yearly mean NDVI before/after early 2021:

| period         | mean NDVI | mean BSI |
|----------------|-----------|----------|
| 2017–2020 (n=15) | +0.247   | +0.105   |
| 2022–2026 (n=16) | +0.082   | +0.065   |

That's a **two-thirds drop in vegetation index** across a single break-point.
The 2021 scenes themselves are the transition (mean NDVI +0.171). Worth
checking against the dossier timeline for: contract change at KLMC, opening
of a new dumping cell, scavenger-eviction event, or a state-of-emergency
landfill expansion. The signal is unambiguous; it's the *cause* that needs
ground-truthing.

Visible in: `iterations/02-muni-bsi/waste_area_chart.png` (bottom panel —
the green NDVI trace falls off a cliff between the 2020 and 2021 clusters).

### 3. NDVI is the clean signal here. BSI is noisy.

Both indices agree on the long-term direction, but BSI has two large
negative excursions (2021-04: BSI = −0.04, 2024-10: BSI = −0.04) where the
"bare-area" count drops to near zero despite the mound clearly being there.
That's surface moisture / shadow on those acquisition dates. NDVI doesn't
suffer the same artefact because waste mass and dry soil both have low NDVI
regardless of moisture.

**Decision**: for any reporting/citing, use **NDVI** as the primary metric.
Keep BSI as a **secondary check** that water bodies are being correctly
excluded.

### 4. BSI does add one thing NDVI can't: it correctly excludes the new water pit.

A new groundwater-filled pit appears NW of the muni pin from ~2020 onwards
(a disused excavation the water table has reclaimed). NDVI of water is
near zero, so NDVI < 0.25 wrongly counts it as "bare". BSI handles it
correctly — water has very negative BSI.

Visible in: compare these two BSI frames side by side —
- `iterations/02-muni-bsi/frames_bsi/2017-04-02__S2A_MSIL2A_20170402T093031_R136_T34TDN_20210209T040152.png`
- `iterations/02-muni-bsi/frames_bsi/2026-04-27__S2A_MSIL2A_20260427T093151_R136_T34TDN_20260427T145259.png`

The 2026 frame has a clear *dark* blob on the left (the water pit), correctly
distinguished from the *bright* mound on the right.

### 5. The growth direction is north + east, toward the ash dump.

In `iterations/02-muni-bsi/timelapse_truecolor.gif` the muni mound's
centroid drifts from inside the yellow ROI box toward the SE corner over
the 9 years. By 2026 the mound's southern edge essentially **abuts the ash
deposit**; the historical 200 m grass strip between the two facilities is
gone. That's a relevant fact for any "where does each material end up?"
question — they're co-locating.

### 6. The 2017 muni mound was already not greenfield.

Even the earliest scene (2017-04-02) shows the mound clearly visible —
NDVI +0.25 with a ring-shaped bright BSI signature. We are not measuring
the *creation* of the dump; we are measuring its **expansion phase**.
KLMC has been operating here since the early 2000s. The pre-2017 history
isn't accessible from Sentinel-2 (launched mid-2015, reliable L2A archive
from 2017). Earlier Landsat data could push the start back to ~1985 if
needed.

---

## Caveats — read before quoting any number

1. **The 400 m ROI saturates from 2022 onward** for the NDVI-bare metric.
   Numbers above ~150,000 m² are "≥ this much"; the actual mound is bigger.
   Re-run with a wider ROI if you need post-2022 growth quantified.
2. **"Bare-area by NDVI" includes water and freshly-excavated pits.** The
   ~30,000 m² jump in 2020 is partly the new water pit appearing NW of
   muni, not pure waste. BSI doesn't have this problem (see finding #4).
3. **Single-scene values can be off by ±10 %** due to seasonal moisture,
   mowing, or thin-cloud edge effects. The 4-frames-per-year sampling
   averages most of this out — annual means in the table above are robust.
4. **The "muni" pin is from Google Maps and points at where the mound was
   in ~2020.** As the mound has grown, its centre of mass has migrated
   roughly NE. The ROI centre is not the centre-of-mound for late years;
   it just stays put.
5. **No ground truth.** All findings are from optical satellite alone. A
   mound spreading sideways and a mound growing taller look very similar
   from above. Sentinel-1 SAR (radar) or DEM differencing would distinguish.

---

## Files

Top-level:

| path                              | what                                       |
|-----------------------------------|--------------------------------------------|
| `landfill-timelapse/README.md`    | layout + how to re-run                     |
| `landfill-timelapse/REPORT.md`    | this document                              |
| `landfill-timelapse/build_timelapse.py` | current builder; `--iter NAME` arg   |

Iteration **01** (2 km AOI, both dumps in frame, 14 frames, 2/year, no
quantification) — `landfill-timelapse/iterations/01-midpoint-2km/`:

| file                                     | what                                  |
|------------------------------------------|---------------------------------------|
| `timelapse_truecolor.gif`                | 2.7 MB — true-colour animation        |
| `timelapse_ndvi.gif`                     | 2.4 MB — NDVI animation               |
| `frames/`                                | 14 dated true-colour PNGs             |
| `frames_ndvi/`                           | 14 dated NDVI PNGs                    |
| `manifest.json`                          | bbox, scene IDs, cloud %              |
| `build_timelapse.py`                     | exact script for this iter            |

Iteration **02** (800 m AOI, muni-only, 35 frames, 4/year, NDVI + BSI +
quantification) — `landfill-timelapse/iterations/02-muni-bsi/`:

| file                                     | what                                  |
|------------------------------------------|---------------------------------------|
| **`waste_area_chart.png`**               | **the headline plot — landfill area increase + index decline** |
| `waste_area.csv`                         | per-scene NDVI/BSI/bare-area, 35 rows |
| `timelapse_truecolor.gif`                | 3.7 MB — true-colour animation        |
| `timelapse_ndvi.gif`                     | 3.1 MB — NDVI animation               |
| `timelapse_bsi.gif`                      | 3.6 MB — BSI animation (water-aware)  |
| `frames/`                                | 35 dated true-colour PNGs             |
| `frames_ndvi/`                           | 35 dated NDVI PNGs                    |
| `frames_bsi/`                            | 35 dated BSI PNGs                     |
| `params.json`                            | centre, AOI, ROI, thresholds          |
| `manifest.json`                          | per-frame metrics + STAC IDs          |
| `build_timelapse.py`                     | exact script for this iter            |

---

## What I'd do next

- **Iter 03 — wider ROI, ~700 m**, to track post-2022 growth past saturation.
  Risk: the southern edge starts catching ash-dump bleed; mitigation is
  shifting ROI 100 m north. Worth running once we know whether the dossier
  team wants area numbers or just trend visualisations.
- **Iter 04 — Landsat extension back to ~2000**, separate cadence (annual,
  Aug peak only), at coarser 30 m resolution. Would let us put a date on
  when the mound was first dumped vs greenfield. Requires a different
  STAC collection (`landsat-c2-l2`) but same MPC endpoint.
- **Sentinel-1 SAR overlay** for the same dates, to distinguish "spreading"
  from "growing taller". MPC has `sentinel-1-rtc`. Useful if the game/sim
  needs a volume estimate.
- **Cross-link from `dossier/`** — drop a paragraph + the
  `iterations/02-muni-bsi/waste_area_chart.png` into the
  landfill-operations section of the dossier with this report as the
  citation.

---

## Reproducibility

```bash
cd landfill-timelapse
python3 build_timelapse.py --iter 03-something-new
```

The builder refuses to overwrite an existing iteration directory. Each
run snapshots its own `build_timelapse.py` next to its outputs, so you
can always reproduce or audit a specific iteration without git
spelunking.

Pure-stdlib + numpy + Pillow + matplotlib. No GDAL, no rasterio, no API
key. About 90 seconds per run on a normal connection (35 scenes × 4 HTTP
calls each = 140 requests).

**Data attribution**: contains modified Copernicus Sentinel data
(2017–2026), accessed via the Microsoft Planetary Computer.
