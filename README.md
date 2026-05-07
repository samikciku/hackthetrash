# Trash, Please

A weekend hackathon at Prishtina Hackerspace, May 9-10, 2026.
We're not going to fix Pristina's trash system. We're going to model it.

## The idea

Pristina's waste system is a multi-layer system: city operations, recycling
streams, informal scavengers, EU compliance reporting. Every layer thinks
it's the main story. None of them are. The whole thing is the story.

Complex systems are easier to play than read. So this weekend we build a
small open-source simulation of how Pristina's trash actually works.

Think SimCity for the part of the city nobody thinks about.

## Part 1: Research

First we learn the system. Where does the trash go, who pays for it, who
profits from it, who fights about it. Public sources only. If we can't
link to it, it doesn't go in.

## Part 2: Make a Map

Turn the research into a map. Nodes are actors. Edges are influence,
money, dependency. Goal: when someone asks "who has power here?", the
map answers.

## Part 3: Make it a Game

Based on how it all works, choose a "player" within that system to model how it works. When A changes, what likely happens to B, C, and D, and what secondary effects might that have?


## The format

Saturday morning we meet and talk trash. Then research. Then maybe build some little prototypes.
Sunday we finish and work on integration and game building.

### Likely break into teams for research. Might look like:

- **City Government** - the mayor's office and sanitation department; sets fees, contracts, and policy
- **Collection Company** - Pastrimi and the parallel collectors; trucks, routes, billing, the registry dispute
- **Landfill Operations** - KLMC and the regional landfill; where it ends up, who pays, what compliance means downstream
- **National Politics** - Ministry of Environment, central government, EU accession pressure; the rulebook everyone operates inside

### Research Outputs

- **Standardize** - All four teams output research in the same shape (a
  `team-name/README.md` with the same headers). Makes Part 2 (the map)
  and Part 3 (the game) actually composable.
- **Optimize for LLM** - Structure the research so an LLM agent can read
  and act on it during Part 3. Short paragraphs, named entities, explicit
  relationships, no implicit context.

## What we'll end with

- Real-world dossier: how Pristina's waste system actually operates. Real names, real numbers, real
  disputes. Everything we can learn!
- A map of all trash actors: who interacts with whom, color-coded by tier.
- A demo of of some kind, likely a "slice" or a smaller piece of what might be a larger simulation
