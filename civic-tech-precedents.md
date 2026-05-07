# Civic Tech Precedents — survey for Trash, Please

A survey of civic tech projects and civic-hackathon formats relevant to
the Trash, Please weekend (Pristina, May 9–10 2026). Grouped by how
directly each precedent maps to what we're trying to do — model
Pristina's waste system, then turn the model into a map and a small
simulation game.

Use this to: (a) namecheck real prior art in the room and the vlog,
(b) borrow design choices that worked, (c) avoid known failure modes,
(d) decide who picks the project up after Sunday.

Every entry has a primary link or a press reference. AI-assisted
draft — verify any claim against its source before quoting.

---

## Tier 1 — Direct precedents (trash + civic + open data)

### OpenLitterMap
- **Link:** https://openlittermap.com
- **Code:** https://github.com/OpenLitterMap/openlittermap-web (Laravel)
- **What it is:** Open-source citizen-science platform for geo-tagging
  litter. Photos go into a public OSM-aligned dataset. ~500K+ items
  tagged across 100+ countries.
- **Why it maps:** Closest philosophical match to FLOSSK — open data,
  FLOSS stack, volunteer corps, no commercial dataset capture. Founder
  Seán Lynch published the data/methodology paper in *Geo: Geography
  and Environment* (2018).
- **Lesson for us:** A schema for "what is a piece of trash, where, and
  what type" already exists. Don't reinvent the taxonomy if our game
  ever needs one.

### TrashOut
- **Link:** https://www.trashout.ngo
- **What it is:** Slovak NGO + app, founded 2012. Maps illegal dumps
  across Central/Eastern Europe; partners with municipalities for
  cleanup. Operates in 100+ countries, but Czech/Slovak base is the
  living core.
- **Why it maps:** *Most directly relevant precedent in our region.*
  Same problem (wild dumping on roadsides, not bin-density), same
  cultural context (post-socialist municipal weakness), same FLOSS
  posture, same EU-accession pressure backdrop.
- **Lesson for us:** They got municipalities to integrate the data by
  making it *easier* to act on a TrashOut report than to ignore it
  (route-planning + auto-routing to the responsible department). The
  integration UX is the actual product.

### Marine Debris Tracker
- **Link:** https://debristracker.org
- **What it is:** NOAA + University of Georgia citizen science app for
  shoreline / waterway debris. Live since 2010.
- **Why it maps:** Survival-via-institutional-host model — the project
  outlasts its founders because NOAA hosts it.
- **Lesson for us:** *Who hosts the dataset after Sunday* is the
  defining question. If FLOSSK or ICK or a municipality doesn't
  commit, the work is a demo, not a project.

### Litterati
- **Link:** https://www.litterati.org
- **Press:** https://www.npr.org/2018/06/08/618138664/-pickitupchallenge-uses-instagram-to-fight-litter
- **What it is:** Closed-source US counterpart to OpenLitterMap. Same
  problem, commercial path. Sold datasets to Tulsa, San Francisco.
- **Why it maps:** The road not taken. Worth knowing as the alternative
  ethics of the same product space.

---

## Tier 2 — Civic hackathon formats (the event shape itself)

### Random Hacks of Kindness
- **Link:** https://en.wikipedia.org/wiki/Random_Hacks_of_Kindness
  (project's own site is dead; Wikipedia preserves history)
- **What it was:** 2009 weekend-hackathon-for-public-good model, seeded
  by Google, NASA, Microsoft, World Bank. Spread to 30+ cities.
- **Lesson:** The format spread. Most projects died. The original
  template for "weekend civic hackathon."

### National Day of Civic Hacking (Code for America)
- **Link:** https://www.codeforamerica.org
- **Press:** https://en.wikipedia.org/wiki/National_Day_of_Civic_Hacking
- **What it was:** Coordinated nation-wide civic hackathons, 2013–2019.
  Effectively dead now — Code for America pivoted to ongoing programs.
- **Lesson:** Hackathons without a *brigade* (ongoing local chapter)
  produce demos, not products. The brigade was always the unit of
  delivery; the hackathon was just recruitment.

### GovHack (Australia / NZ)
- **Link:** https://www.govhack.org
- **What it is:** Annual hackathon against published government
  datasets, running since 2009.
- **Distinguishing move:** Mandatory open-data publishing by govt
  agencies *before* the event. Without that, civic hackathons become
  "build a thing with whatever you can scrape."
- **Lesson for us:** Our equivalent of pre-published data is the
  dossier. The dossier *is* the open dataset for the weekend.

### Hack4Good (ETH Zurich)
- **Link:** https://hack4good.ai (current ETH Analytics Club program)
- **What it is:** Academic-led, NGO-paired hackathons. Each team
  matched with a real org that pre-committed to using the output.
- **Lesson:** Higher project survival rate because the maintainer is
  identified before the hackathon, not after.

### MIT Hacking Medicine
- **Link:** https://hackingmedicine.mit.edu
- **What it is:** Sustained hackathon-as-research-method program.
  Spawned several real companies (PillPack acquired by Amazon among
  the success cases).
- **Lesson for us:** A hackathon can be a *recruiting funnel for
  founders* if the problem is real and the room is right. Worth
  watching for whether anyone in the FLOSSK room treats the project
  as a startable thing.

---

## Tier 3 — Civic tech *output shapes* (what could come out of this)

### FixMyStreet (mySociety, UK)
- **Link:** https://www.fixmystreet.com
- **Code:** https://github.com/mysociety/fixmystreet (open source,
  Perl/Catalyst)
- **What it is:** Report potholes/trash/etc. to the right council.
  Live since 2007. Replicated in 30+ countries via the FixMyStreet
  Platform.
- **Why it maps:** Probably the canonical "what could this become?"
  reference if we ever wanted a reporting layer on top of the
  simulation.
- **Lesson for us:** mySociety as an org is the canonical "what does a
  sustainable civic-tech organization look like." UK charity, ~25
  staff, project portfolio outliving any individual hackathon.

### SeeClickFix
- **Link:** https://seeclickfix.com
- **Press:** https://en.wikipedia.org/wiki/SeeClickFix
- **What it is:** Same problem space as FixMyStreet, commercial path.
  Acquired by CivicPlus 2019.
- **Lesson:** The "what if it works commercially?" reference. Worth
  knowing the ethical fork.

### Ushahidi
- **Link:** https://www.ushahidi.com
- **Code:** https://github.com/ushahidi/platform
- **What it is:** Crisis-mapping platform born from a single weekend
  hack during the 2008 Kenyan election violence. Open source, used
  for elections, disasters, crowdsourced reporting in 160+ countries.
- **Why it maps:** *The civic-tech origin myth most relevant to our
  vibe.* One frustrated person, one weekend, became a global tool.
  Generic-enough platform that it gets repurposed for problems
  unrelated to its original brief.
- **Lesson for us:** A weekend hack can become durable infrastructure.
  Rare, but real.

---

## Tier 4 — Regional / Balkan precedents

### Open Data Kosovo
- **Link:** https://opendatakosovo.org
- **Project:** https://kallxo.com (corruption-reporting platform, joint
  with BIRN)
- **What it is:** Pristina-based civic-tech NGO since 2014. Built
  Kallxo and various open-budget / open-procurement tools.
- **Why it maps:** *Right in FLOSSK's neighborhood.* Possibly already
  in the room, definitely in the network.
- **Lesson for us:** ODK is the "how do we keep this alive after
  Sunday" conversation partner. If anyone from ODK shows up,
  identify them early.

### Code for Romania
- **Link:** https://code4.ro/en
- **Notable build:** Stăm Acasă (COVID-tracking platform, 2020)
- **What it is:** Largest functioning Balkan-region civic-tech volunteer
  corps. Several thousand volunteers, ~10 staff.
- **Lesson for us:** The brigade model adapted to a post-socialist
  context. Worth studying how they sustain volunteer engagement.

### Innovation Centre Kosovo (ICK) / former K-Lab
- **Link:** https://ickosovo.com
- **What it is:** Pristina's institutional innovation hub. Absorbed the
  earlier K-Lab civic-tech space.
- **Lesson for us:** Institutional memory. ICK has hosted civic-tech
  programming before; knowing what they tried and what stuck is
  cheap context.

### BIRN (Balkan Investigative Reporting Network)
- **Link:** https://birn.eu.com
- **What it is:** Investigative journalism network across the Balkans.
  Joint operator of Kallxo with ODK.
- **Why it maps:** The investigative-journalism + civic-tech overlap
  is a real thing in this region. The Pristina trash story has BIRN
  reporting in it already (illegal dumping, contract disputes).

---

## Patterns across the survey

A few things show up in almost every successful precedent:

- **Pre-published dataset.** GovHack, Hack4Good, mySociety, OpenLitterMap.
  Without it, the weekend is "whatever you can scrape."
- **Identified maintainer before the event.** Hack4Good, Marine Debris
  Tracker. Without it, the project is a demo.
- **Open-source code under a real license.** Ushahidi, FixMyStreet,
  OpenLitterMap. The ones that survived all published their code
  under a real license, not just "we'll figure it out later."
- **Boring composability.** All the survivors picked one small thing
  (report a pothole, tag a piece of litter, map an incident) and let
  the *infrastructure* be the ambitious part. Big ambitions in the
  weekend product space mostly didn't ship.

And one anti-pattern worth naming:

- **The "platform" trap.** Most dead civic-tech projects pitched
  themselves as a platform, not a product. RHoK's archive is full of
  dead platforms. The survivors all started as a single, specific,
  embarrassingly-small product and accreted platform-ness later.

---

## What this suggests for Trash, Please

Three concrete recommendations, in priority order:

1. **Spend 20 minutes on TrashOut before Saturday.** Closest analog
   in problem, region, and posture. https://www.trashout.ngo
2. **Identify the post-Sunday maintainer before the demo.** ODK,
   ICK, FLOSSK itself, or "park it on GitHub and walk away" are all
   honest answers — but the question should be answered Sunday, not
   in three weeks.
3. **Resist the platform framing.** The dossier + map + small game
   is already the right scope. If anyone in the room pitches "we
   should also build a reporting app" mid-weekend, that's the moment
   to hold the line.

---

## Provenance

Compiled by Seshat (The Librarian agent) on 2026-05-08, on Mike's
request, ahead of the FLOSSK Trash, Please hackathon May 9–10 2026.
Survey based on Seshat's training-data knowledge of the civic-tech
space + verification passes against project sites. No new web fetch
was performed for this draft; before quoting any specific number or
date in published material, re-verify against the linked source.
