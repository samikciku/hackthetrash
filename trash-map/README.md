# Pristina Trash Actor Map

Interactive web app built at the **Trash, Please** hackathon — Prishtina Hackerspace, May 9–10, 2026.

Nodes are actors in Pristina's waste system. Edges are money flows, authority relationships, operational dependencies, and political alignments. Levers let you ask "what if?" and see which actors get stressed.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stack

- React + Vite
- [@xyflow/react](https://reactflow.dev) — graph canvas
- Tailwind CSS v4

## Data sources

All actor data drawn from the research dossier at `../dossier/how-trash-works-pristina.md`.
Primary sources: KOHA, Telegrafi, Prishtina Insight, BIRN, Ombudsperson Institution, RFE/RL.

⚠️ AI-generated dossier — verify claims against inline source links before publishing.
