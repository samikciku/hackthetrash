// Ingest dossier RACI markdown + system-map.json + nodes.js metadata
// into a single dossier.json the trash-map app consumes.
//
// Run: node scripts/ingest-dossier.mjs
// Reads: trash-map/dossier-source/*.md, *.json
//        trash-map/src/data/nodes.js (for rich metadata)
// Writes: trash-map/src/data/dossier.json

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'dossier-source')
const OUT = path.join(ROOT, 'src/data/dossier.json')

// ────────────────────────────────────────────────────────────────────────
// Markdown table parser

function readMd(name) {
  return fs.readFileSync(path.join(SRC_DIR, name), 'utf8')
}

// Find every Markdown table that begins with a header row containing "| # |"
// Returns: Array<{ header: string[], rows: string[][], offset: number }>
function findRaciTables(md) {
  const lines = md.split('\n')
  const tables = []
  let i = 0
  while (i < lines.length) {
    const ln = lines[i]
    // header row starts with "| # |"
    if (/^\|\s*#\s*\|/.test(ln) && lines[i+1] && /^\|[\s\-|]+\|/.test(lines[i+1])) {
      const header = splitRow(ln)
      const rows = []
      let j = i + 2
      while (j < lines.length && lines[j].startsWith('|')) {
        rows.push(splitRow(lines[j]))
        j++
      }
      tables.push({ header, rows, offset: i })
      i = j
    } else {
      i++
    }
  }
  return tables
}

function splitRow(ln) {
  // strip leading/trailing pipe, split, trim
  return ln.replace(/^\||\|$/g, '').split('|').map(s => s.trim())
}

// Cell value parser. Markers we recognise (per RACI README):
//   R, A, C, I, ⚠, ?  — possibly bolded with ** **, possibly combined "A,R", possibly with "(note)"
// Returns { roles: ['R','A',...], disputed: bool, unknown: bool, note: string|null, raw: string }
function parseCell(raw) {
  const empty = { roles: [], disputed: false, unknown: false, note: null, raw }
  if (!raw || raw === '—' || raw === '-' || raw === '') return empty

  let s = raw
  // pull out parenthetical note (greedy last paren block)
  let note = null
  const noteMatch = s.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/)
  if (noteMatch) {
    note = noteMatch[1].trim()
    s = s.slice(0, noteMatch.index).trim()
  }
  // remove bold markers
  s = s.replace(/\*\*/g, '').trim()
  // detect markers
  const disputed = /⚠/.test(s)
  const unknown = /\?/.test(s)
  // Pull role letters (R, A, C, I) — order preserved, dedupe
  const roleMatches = s.match(/[RACI]/g) || []
  const roles = [...new Set(roleMatches)]

  // Capture leftover text as inline note if no parenthetical
  if (!note) {
    const cleaned = s.replace(/[RACI⚠?,\s]/g, '').trim()
    if (cleaned) note = cleaned // e.g. "pre-Jun-2025" / "post-Jun-2025"
  }

  return { roles, disputed, unknown, note, raw }
}

// Strip markdown formatting from activity name
function cleanActivityName(s) {
  // preserve (new-law), (post-2024-extraction) tags; strip ** markers; strip italics
  return s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}

// Extract the row notes section: "## Row notes" → next "## " header
function extractRowNotes(md) {
  const lines = md.split('\n')
  const notes = {}
  let inSection = false
  let currentRow = null
  let buffer = []
  const flush = () => {
    if (currentRow !== null) {
      notes[currentRow] = buffer.join('\n').trim()
    }
    buffer = []
  }
  for (const ln of lines) {
    if (/^##\s+Row notes/i.test(ln)) { inSection = true; continue }
    if (inSection && /^##\s+/.test(ln)) { flush(); break }
    if (!inSection) continue

    // **Row N — title.** body
    const m = ln.match(/^\s*\*\*Row\s+(\d+)\s*[—–-]/i)
    if (m) {
      flush()
      currentRow = parseInt(m[1], 10)
      buffer = [ln.replace(/^\s*\*\*Row\s+\d+\s*[—–-][^*]*\*\*\s*\.?\s*/i, '').trim()]
    } else if (currentRow !== null) {
      buffer.push(ln)
    }
  }
  flush()
  return notes
}

// ────────────────────────────────────────────────────────────────────────
// Layer-specific config

const LAYERS = [
  { file: 'operational.md', layer: 'operational',
    actorCol: 'Activity', stageHint: 'collection' },
  { file: 'policy.md', layer: 'policy',
    actorCol: 'Activity', stageHint: 'regulation' },
  { file: 'enforcement.md', layer: 'enforcement',
    actorCol: 'Activity', stageHint: 'enforcement' },
  { file: 'recommendations.md', layer: 'recommendations',
    actorCol: 'Recommendation (short)', stageHint: 'regulation' },
]

// Lifecycle stages — the spine of the matrix
const LIFECYCLE_STAGES = [
  { id: 'generation',  order: 1,  name: 'Waste generation',
    blurb: 'Households, businesses, industry, and construction sites produce waste.' },
  { id: 'separation',  order: 2,  name: 'Source separation',
    blurb: 'Sorting at the point of origin (currently mostly absent in Pristina).' },
  { id: 'collection',  order: 3,  name: 'Collection',
    blurb: 'Pastrimi trucks (and informal collectors) gather waste from bins.' },
  { id: 'transport',   order: 4,  name: 'Transport',
    blurb: 'Movement from collection points to landfill or treatment facilities.' },
  { id: 'treatment',   order: 5,  name: 'Sorting / MRF / treatment',
    blurb: 'Materials Recovery Facilities — none currently exist in Kosovo.' },
  { id: 'recovery',    order: 6,  name: 'Recovery & EPR / DRS',
    blurb: 'Recycling, deposit-refund, EPR producer responsibility schemes.' },
  { id: 'disposal',    order: 7,  name: 'Final disposal',
    blurb: 'Mirash landfill and 458–1,572 illegal dumpsites.' },
  { id: 'billing',     order: 8,  name: 'Billing & financing',
    blurb: 'Tariffs, tipping fees, EU funding, donor grants, landfill tax.' },
  { id: 'regulation',  order: 9,  name: 'Regulation & policy',
    blurb: 'Strategy, laws, EU acquis, ministerial decisions.' },
  { id: 'enforcement', order: 10, name: 'Enforcement & data',
    blurb: 'Inspection, sanctions, illegal-dumping tracking, audit.' },
]

// Activity → stage mapping. Key: a substring of the activity name (case-insensitive).
// First match wins. Default falls back to the layer's stageHint.
const STAGE_KEYWORDS = [
  ['source separat',           'separation'],
  ['mandate source separation','separation'],
  ['collection trucks',        'collection'],
  ['business collection',      'collection'],
  ['household collection',     'collection'],
  ['operate collection',       'collection'],
  ['civic amenity',            'collection'],
  ['transport',                'transport'],
  ['materials recovery',       'treatment'],
  ['mrf',                      'treatment'],
  ['sorting',                  'treatment'],
  ['composting',               'treatment'],
  ['bioeconomy',               'treatment'],
  ['epr ',                     'recovery'],
  ['epr—',                     'recovery'],
  ['epr/drs',                  'recovery'],
  ['drs ',                     'recovery'],
  ['deposit',                  'recovery'],
  ['drs national',             'recovery'],
  ['recycling',                'recovery'],
  ['reuse',                    'recovery'],
  ['repair center',            'recovery'],
  ['c&d waste',                'recovery'],
  ['cdw',                      'recovery'],
  ['industrial symbiosis',     'recovery'],
  ['build replacement landfill','disposal'],
  ['operate mirash',           'disposal'],
  ['landfill',                 'disposal'],
  ['mirash',                   'disposal'],
  ['illegal dump',             'disposal'],
  ['tariff',                   'billing'],
  ['bill citizens',            'billing'],
  ['tipping fee',              'billing'],
  ['payt',                     'billing'],
  ['pay-as-you-throw',         'billing'],
  ['client registry',          'billing'],
  ['landfill tax',             'billing'],
  ['budget',                   'billing'],
  ['investment program',       'billing'],
  ['performance-based',        'billing'],
  ['financial scheme',         'billing'],
  ['fncc',                     'billing'],
  ['plastic producer',         'billing'],
  ['rigorous taxation',        'billing'],
  ['national waste strategy',  'regulation'],
  ['eu acquis',                'regulation'],
  ['inter-ministerial',        'regulation'],
  ['cross-sector coordination','regulation'],
  ['pass municipal waste regulation','regulation'],
  ['develop new law',          'regulation'],
  ['approve new law',          'regulation'],
  ['law on integrated',        'regulation'],
  ['establish five waste',     'regulation'],
  ['coordinate within five',   'regulation'],
  ['green public procurement', 'regulation'],
  ['gpp',                      'regulation'],
  ['awareness',                'regulation'],
  ['national education',       'regulation'],
  ['inspect',                  'enforcement'],
  ['fine ',                    'enforcement'],
  ['sanction',                 'enforcement'],
  ['license',                  'enforcement'],
  ['operating licenses',       'enforcement'],
  ['adjudicate',               'enforcement'],
  ['environmental health',     'enforcement'],
  ['investigate',              'enforcement'],
  ['watchdog',                 'enforcement'],
  ['accountability journalism','enforcement'],
  ['citizen complaints',       'enforcement'],
  ['citizen reports',          'enforcement'],
  ['nwis',                     'enforcement'],
  ['national waste information','enforcement'],
  ['data system',              'enforcement'],
  ['waste-flow data',          'enforcement'],
  ['material flow',            'enforcement'],
  ['dumpsite register',        'enforcement'],
  ['bin tourism',              'enforcement'],
  ['cross-municipal',          'enforcement'],
  ['cross-neighborhood',       'enforcement'],
  ['climate',                  'enforcement'],
  ['climate × waste',          'enforcement'],
  ['green police',             'enforcement'],
  ['business waste',           'enforcement'],
  ['waste plans',              'enforcement'],
  ['ai on prevention',         'recovery'],
  ['single-use plastics',      'recovery'],
  ['appoint pastrimi',         'regulation'],
  ['receive citizen',          'enforcement'],
  ['resolve regulation',       'regulation'],
  ['resolve waste-service',    'regulation'],
  ['investigate service',      'enforcement'],
]

function inferStage(activityName, fallback) {
  // normalise: lowercase, hyphen→space so "source-separation" matches "source separat"
  const lc = activityName.toLowerCase().replace(/-/g, ' ')
  for (const [kw, stage] of STAGE_KEYWORDS) {
    const k = kw.toLowerCase().replace(/-/g, ' ')
    if (lc.includes(k)) return stage
  }
  return fallback
}

function inferHorizon(activityName) {
  if (/\(new-law\)/i.test(activityName)) return 'post_new_law'
  if (/\(post-2024-extraction\)/i.test(activityName)) return 'speculative'
  if (/green police/i.test(activityName)) return 'speculative'
  return 'current'
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/\(new-law\)/g, '')
    .replace(/\(post-2024-extraction\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// ────────────────────────────────────────────────────────────────────────
// Parse a single RACI markdown layer

function parseLayer({ file, layer, actorCol, stageHint }) {
  const md = readMd(file)
  const tables = findRaciTables(md)
  const rowNotes = extractRowNotes(md)

  const activities = []
  for (const t of tables) {
    // header is: ['#', 'Activity', actorA, actorB, ...]
    const actorIds = t.header.slice(2)
    for (const r of t.rows) {
      if (r.length < 3) continue
      const num = parseInt(r[0], 10)
      if (isNaN(num)) continue
      const rawName = r[1]
      // skip purely-speculative single-cell rows (e.g. row 19 "Green Police")
      const name = cleanActivityName(rawName)
      if (!name) continue
      const horizon = inferHorizon(rawName)
      const stage = inferStage(name, stageHint || layer)
      const id = `${layer}-${num}-${slugify(name)}`

      const raci = {}
      for (let k = 0; k < actorIds.length; k++) {
        const actorId = actorIds[k]
        if (!actorId) continue
        const cell = r[k + 2] ?? ''
        const parsed = parseCell(cell)
        if (parsed.roles.length || parsed.disputed || parsed.unknown) {
          raci[actorId] = {
            role: parsed.roles.join(','),
            disputed: parsed.disputed,
            unknown: parsed.unknown,
            note: parsed.note,
          }
        }
      }

      activities.push({
        id,
        layer,
        sourceRow: num,
        stage,
        horizon,
        name,
        rawName,
        raci,
        note: rowNotes[num] ?? null,
        source: `dossier/raci/${file}#row-${num}`,
      })
    }
  }
  return activities
}

// ────────────────────────────────────────────────────────────────────────
// Actor catalogue: union of system-map.json + acronyms + nodes.js

function loadSystemMap() {
  const j = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'system-map.json'), 'utf8'))
  const cur = j.states.current
  const fut = j.states.post_new_law_2027
  return {
    nodes: cur.nodes,
    futureNodes: fut.added_nodes ?? [],
    edges: cur.edges,
    futureEdges: fut.added_edges ?? [],
    policies: j.policies ?? [],
    transitions: j.transitions ?? [],
    openQuestions: j.open_questions ?? [],
    snapshotDate: j.snapshot_date,
  }
}

// Map RACI codes → system-map node ids (some don't match 1:1).
const ACTOR_ALIASES = {
  KOM: 'KOM',
  KOMUNA: 'KOM',
  ASMB: 'ASMB',
  PAS: 'PAS',
  PASTRIMI: 'PAS',
  PRV: 'PRV',
  KLM: 'KLM',
  KLMC: 'KLM',
  MoEcon: 'MoEcon',
  MoFin: 'MoFin',
  MoEd: 'MoEd',
  MoAg: 'MoAg',
  MMPHI: 'MMPHI',
  AMMK: 'AMMK',
  MINT: 'MINT',
  CG: 'CG',
  EU: 'EU',
  DON: 'DON',
  PRO: 'PRO',
  PROs: 'PRO',
  CIT: 'CIT',
  CITIZENS: 'CIT',
  COMM: 'COMM',
  CON: 'IND_CON',
  IND: 'IND_CON',
  'IND/CON': 'IND_CON',
  INSP: 'INSP',
  POL: 'POL',
  COURT: 'COURT',
  COURTS: 'COURT',
  OMB: 'OMB',
  OPERATORS: 'OPERATORS',
  'PAS/operators': 'PAS',
  PRESS: 'PRESS',
  NGO: 'NGO',
  WMZ: 'WMZ',
  HReg: 'HREG',
  HREG: 'HREG',
  ASMB_NEW: 'ASMB',
  REC: 'REC',
  SCV: 'SCV',
}

function canonActor(code) {
  const k = code.replace(/\*/g,'').trim()
  return ACTOR_ALIASES[k] || k
}

// Read the node metadata that already lives in nodes.js (rich descriptions).
// Quick-and-dirty: load the file as text and pull out by id.
function loadNodesJsRichMeta() {
  const txt = fs.readFileSync(path.join(ROOT, 'src/data/nodes.js'), 'utf8')
  // Use Function constructor to evaluate the export. nodes.js imports nothing
  // dangerous and only declares `export const initialNodes = [...]` arrays.
  // We strip exports + run as CJS-ish.
  const transformed = txt
    .replace(/export\s+const\s+/g, 'const ')
    + '\nreturn { initialNodes, TIER_COLORS };'
  // eslint-disable-next-line no-new-func
  const fn = new Function(transformed)
  const { initialNodes } = fn()
  const map = {}
  for (const n of initialNodes) {
    // map by uppercased id and label
    const upper = n.id.toUpperCase()
    map[upper] = n
    map[n.id] = n
  }
  return map
}

const RACI_TO_NODES_JS = {
  KOM: 'municipality',
  ASMB: 'assembly',
  PAS: 'pastrimi',
  PRV: 'private_operators',
  KLM: 'klmc',
  MMPHI: 'mmphi',
  EU: 'eu',
  DON: 'donors',
  CIT: 'citizens',
  IND_CON: null,
  INSP: null,
  COURT: 'courts',
  OMB: 'ombudsperson',
  AMMK: 'ammk',
  MINT: null,
  MoEcon: null,
  MoFin: null,
  MoEd: null,
  MoAg: null,
  CG: null,
  PRO: null,
  COMM: null,
  PRESS: null,
  NGO: null,
  WMZ: null,
  HREG: null,
  POL: null,
}

function buildActors(systemMap, nodesJsMeta) {
  const all = [...systemMap.nodes, ...systemMap.futureNodes]
  const out = []
  const seen = new Set()
  for (const n of all) {
    const id = n.id
    if (seen.has(id)) continue
    seen.add(id)
    const richKey = RACI_TO_NODES_JS[id]
    const rich = richKey ? nodesJsMeta[richKey] || nodesJsMeta[richKey?.toUpperCase()] : null
    out.push({
      id,
      name: n.name,
      type: n.type,
      tier: n.tier,
      subtype: n.subtype ?? null,
      parent: n.parent ?? null,
      note: n.note ?? null,
      // forward-only fields
      future: systemMap.futureNodes.some(x => x.id === id),
      // status fields from system-map (employees, trucks, etc.)
      ...(n.employees ? { employees: n.employees } : {}),
      ...(n.trucks_household ? { trucks_household: n.trucks_household } : {}),
      ...(n.clients_self_count ? { clients_self_count: n.clients_self_count } : {}),
      ...(n.clients_kom_count ? { clients_kom_count: n.clients_kom_count } : {}),
      // rich metadata from nodes.js (where we have it)
      rich: rich ? {
        label: rich.data.label,
        fullName: rich.data.fullName,
        role: rich.data.role,
        keyPerson: rich.data.keyPerson,
        leverage: rich.data.leverage,
        dependencies: rich.data.dependencies,
        fears: rich.data.fears,
        stats: rich.data.stats,
        quote: rich.data.quote,
        quoteSource: rich.data.quoteSource,
        quoteUrl: rich.data.quoteUrl,
      } : null,
    })
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────
// Main

function main() {
  console.log('▸ Loading system-map.json …')
  const systemMap = loadSystemMap()
  console.log(`  ${systemMap.nodes.length} current nodes, ${systemMap.futureNodes.length} future nodes`)
  console.log(`  ${systemMap.edges.length} current edges, ${systemMap.futureEdges.length} future edges`)

  console.log('▸ Loading nodes.js rich metadata …')
  const nodesJsMeta = loadNodesJsRichMeta()
  console.log(`  ${Object.keys(nodesJsMeta).length / 2} keys`)

  console.log('▸ Parsing RACI markdown layers …')
  const allActivities = []
  for (const cfg of LAYERS) {
    const acts = parseLayer(cfg)
    console.log(`  ${cfg.file}: ${acts.length} activities`)
    allActivities.push(...acts)
  }

  // Normalise actor ids in raci cells
  for (const a of allActivities) {
    const norm = {}
    for (const [code, cell] of Object.entries(a.raci)) {
      const id = canonActor(code)
      norm[id] = cell
    }
    a.raci = norm
  }

  console.log('▸ Building actor catalogue …')
  const actors = buildActors(systemMap, nodesJsMeta)
  console.log(`  ${actors.length} actors`)

  // Stage histogram
  const stageHist = {}
  for (const a of allActivities) stageHist[a.stage] = (stageHist[a.stage] || 0) + 1
  console.log('▸ Stage histogram:', stageHist)

  // Horizon histogram
  const horHist = {}
  for (const a of allActivities) horHist[a.horizon] = (horHist[a.horizon] || 0) + 1
  console.log('▸ Horizon histogram:', horHist)

  const out = {
    version: '1.0',
    snapshotDate: systemMap.snapshotDate,
    generatedAt: new Date().toISOString(),
    lifecycle_stages: LIFECYCLE_STAGES,
    actors,
    activities: allActivities,
    edges: [
      ...systemMap.edges.map(e => ({ ...e, horizon: 'current' })),
      ...systemMap.futureEdges.map(e => ({ ...e, horizon: 'post_new_law' })),
    ],
    policies: systemMap.policies,
    transitions: systemMap.transitions,
    openQuestions: systemMap.openQuestions,
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`✔ Wrote ${OUT}`)
  console.log(`  ${out.actors.length} actors, ${out.activities.length} activities, ${out.edges.length} edges`)
}

main()
