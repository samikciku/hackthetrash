# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A working directory for **Trash, Please** — a weekend hackathon at Prishtina Hackerspace (May 9–10, 2026) about modeling Pristina's municipal waste system. As of now this repo contains only research/reference material (Markdown + photos); no code has been added yet. Background framing lives at https://quarterly.systems/trash/.

There is no build, test, lint, or runtime tooling. The only operations that make sense are: read the docs, edit Markdown, add new files, commit, push.

## Repository layout

- `README.md` — hackathon framing and the three-part plan (Research → Map → Game).
- `dossier/how-trash-works-pristina.md` — the long-form, source-linked dossier on the Pristina waste system. **AI-generated draft**, ~660 lines, organized as: physical system → actors → mechanisms → disputes → structural pathologies → references. Treat every claim as unverified until checked against its inline link.
- `civic-tech-precedents.md` — survey of comparable civic-tech projects/hackathon formats, grouped into 4 tiers (direct precedents → hackathon formats → output shapes → regional/Balkan). Used to namecheck prior art and avoid known failure modes.
- `prishtina-trash-images/` — field photos (JPEGs) of trash containers from Sunny Hill and UCK street in Prishtina. Multi-MB files; do not embed inline in Markdown without resizing.

## How the hackathon plans to grow this repo

The README defines a structure that future contributions should follow:

- **Per-team research subdirectories** (`city-government/`, `collection-company/`, `landfill-operations/`, `national-politics/`), each with a `team-name/README.md` using the **same headers across all four** so that downstream Map (Part 2) and Game (Part 3) work is composable. When creating or editing team folders, mirror the schema across teams rather than improvising new sections.
- **LLM-readable research prose**: short paragraphs, named entities, explicit relationships, no implicit context. The dossier is the existing example of this style.
- A later **map** artifact (nodes = actors, edges = influence/money/dependency) and a **simulation/game** slice. Neither exists yet; when scaffolding either, treat the dossier as the source of truth for actors and relationships.

## Editing conventions visible in existing material

- **Sources are mandatory and inline.** The README states "if we can't link to it, it doesn't go in." Both `civic-tech-precedents.md` and the dossier use inline Markdown links for every factual claim, plus a draft-warning admonition at the top. Preserve that pattern when editing or adding research files; do not strip the "verify before use" warnings.
- **Albanian-language sources** (KOHA, Telegrafi, Kallxo) appear throughout the dossier and are flagged as more current than English coverage; expect translation errors in any quoted material.
- The dossier explicitly names actors with role + voice notes (e.g. CEO Petrit Reçica, union president Ardian Krasniqi). Keep that "named entity + how they talk" granularity when extending it — it's structured that way deliberately so an LLM agent can use it during the Part 3 game.

## Anti-patterns called out in the repo itself

From `civic-tech-precedents.md` "Patterns" and "What this suggests" sections — these are framing constraints for the work, not just trivia:

- **Don't pitch as a "platform."** The dossier + map + small game is the agreed scope; resist scope creep into reporting apps or general platforms.
- **Boring composability beats ambitious infrastructure.** Pick one small thing and let the data/structure do the heavy lifting.
- **Identify a post-Sunday maintainer before the demo**, not after.
