# iter 01 — midpoint, 2 km AOI

First pass. Captured both dumps in a single frame.

## Parameters
- **Centre**: 42.664507, 21.064424 — geometric midpoint between the two pins.
- **AOI**: 2 km × 2 km (HALF_KM = 1.0).
- **Cadence**: 2 frames/year (May + August), 2017–2026.
- **Cloud filter**: < 15 %.
- **Output size**: 768 × 768 PNG.
- **No quantification.**

## Frame count
14 cloud-clean Sentinel-2 L2A scenes.

## What the eye sees
- The bright-white **ash plateau** dominates the centre and roughly **doubles
  in footprint** from 2017 to 2026.
- The cyan **slurry pond** at the SE corner of the ash deposit visibly **dries
  out** between 2018 and 2022.
- A new **dark water-filled pit** appears NW of the muni pin from ~2020
  onwards (groundwater filling a disused excavation).
- The **muni mound** itself is small at this zoom — it's the reason iter 02
  exists.

## Limitations
- Only 2 frames/year → growth looks jumpy.
- AOI too wide for the muni mound to be analytically interesting.
- True-colour and NDVI only; no quantitative metric.

## Files
- `timelapse_truecolor.gif` — 2.7 MB, 14 frames @ 600 ms
- `timelapse_ndvi.gif` — 2.4 MB, 14 frames @ 600 ms
- `frames/` — 14 dated PNGs, true colour
- `frames_ndvi/` — 14 dated PNGs, NDVI
- `manifest.json` — bbox, scene IDs, cloud %, pins
- `build_timelapse.py` — script as it ran for this iter
