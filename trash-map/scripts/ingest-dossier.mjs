// Ingest dossier RACI markdown + system-map.json + nodes.js / edges.js / levers.js
// into a single dossier.json that is the source of truth for BOTH the matrix
// view (RACI shape) and the graph view (typed-relationship shape).
//
// Run: node scripts/ingest-dossier.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'dossier-source')
const OUT = path.join(ROOT, 'src/data/dossier.json')

// ────────────────────────────────────────────────────────────────────────
// 1. Markdown table parser

function readMd(name) {
  return fs.readFileSync(path.join(SRC_DIR, name), 'utf8')
}

function findRaciTables(md) {
  const lines = md.split('\n')
  const tables = []
  let i = 0
  while (i < lines.length) {
    const ln = lines[i]
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
  return ln.replace(/^\||\|$/g, '').split('|').map(s => s.trim())
}

function parseCell(raw) {
  const empty = { roles: [], disputed: false, unknown: false, note: null, raw }
  if (!raw || raw === '—' || raw === '-' || raw === '') return empty
  let s = raw
  let note = null
  const noteMatch = s.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/)
  if (noteMatch) {
    note = noteMatch[1].trim()
    s = s.slice(0, noteMatch.index).trim()
  }
  s = s.replace(/\*\*/g, '').trim()
  const disputed = /⚠/.test(s)
  const unknown = /\?/.test(s)
  const roleMatches = s.match(/[RACI]/g) || []
  const roles = [...new Set(roleMatches)]
  if (!note) {
    const cleaned = s.replace(/[RACI⚠?,\s]/g, '').trim()
    if (cleaned) note = cleaned
  }
  return { roles, disputed, unknown, note, raw }
}

function cleanActivityName(s) {
  return s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}

function extractRowNotes(md) {
  const lines = md.split('\n')
  const notes = {}
  let inSection = false
  let currentRow = null
  let buffer = []
  const flush = () => {
    if (currentRow !== null) notes[currentRow] = buffer.join('\n').trim()
    buffer = []
  }
  for (const ln of lines) {
    if (/^##\s+Row notes/i.test(ln)) { inSection = true; continue }
    if (inSection && /^##\s+/.test(ln)) { flush(); break }
    if (!inSection) continue
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
// 2. Layer + stage config

const LAYERS = [
  { file: 'operational.md', layer: 'operational', stageHint: 'collection' },
  { file: 'policy.md',      layer: 'policy',      stageHint: 'regulation' },
  { file: 'enforcement.md', layer: 'enforcement', stageHint: 'enforcement' },
  { file: 'recommendations.md', layer: 'recommendations', stageHint: 'regulation' },
]

// Lifecycle spine — only stages that have ≥1 activity in core matrix get exported.
const LIFECYCLE_STAGES = [
  { id: 'separation',  order: 1, name: 'Source separation',
    blurb: 'Sorting at the point of origin (currently mostly absent in Pristina).' },
  { id: 'collection',  order: 2, name: 'Collection',
    blurb: 'Pastrimi trucks (and informal collectors) gather waste from bins.' },
  { id: 'treatment',   order: 3, name: 'Sorting / MRF / treatment',
    blurb: 'Materials Recovery Facilities — none currently exist in Kosovo.' },
  { id: 'recovery',    order: 4, name: 'Recovery & EPR / DRS',
    blurb: 'Recycling, deposit-refund, EPR producer responsibility schemes.' },
  { id: 'disposal',    order: 5, name: 'Final disposal',
    blurb: 'Mirash landfill and 458–1,572 illegal dumpsites.' },
  { id: 'billing',     order: 6, name: 'Billing & financing',
    blurb: 'Tariffs, tipping fees, EU funding, donor grants, landfill tax.' },
  { id: 'governance',  order: 7, name: 'Governance & corporate',
    blurb: 'Shareholder, board, CEO appointments — internal company governance.' },
  { id: 'regulation',  order: 8, name: 'Regulation & policy',
    blurb: 'Strategy, laws, EU acquis, ministerial decisions.' },
  { id: 'enforcement', order: 9, name: 'Enforcement & data',
    blurb: 'Inspection, sanctions, illegal-dumping tracking, audit.' },
]

// First match wins. Hyphens normalised to spaces in matching.
const STAGE_KEYWORDS = [
  // governance category — narrow corporate items
  ['appoint pastrimi',         'governance'],
  ['appoint',                  'governance'],
  // separation
  ['source separat',           'separation'],
  ['mandate source separation','separation'],
  // collection
  ['collection trucks',        'collection'],
  ['business collection',      'collection'],
  ['household collection',     'collection'],
  ['operate collection',       'collection'],
  ['civic amenity',            'collection'],
  // treatment
  ['materials recovery',       'treatment'],
  ['mrf',                      'treatment'],
  ['sorting',                  'treatment'],
  ['composting',               'treatment'],
  ['bioeconomy',               'treatment'],
  // recovery
  ['epr ',                     'recovery'],
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
  // disposal
  ['build replacement landfill','disposal'],
  ['operate mirash',           'disposal'],
  ['landfill',                 'disposal'],
  ['mirash',                   'disposal'],
  ['illegal dump',             'disposal'],
  // billing
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
  // regulation
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
  ['resolve regulation',       'regulation'],
  ['resolve waste-service',    'regulation'],
  // enforcement
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
  ['green police',             'enforcement'],
  ['business waste',           'enforcement'],
  ['waste plans',              'enforcement'],
  ['ai on prevention',         'recovery'],
  ['single-use plastics',      'recovery'],
]

function inferStage(activityName, fallback) {
  const lc = activityName.toLowerCase().replace(/-/g, ' ')
  for (const [kw, stage] of STAGE_KEYWORDS) {
    if (lc.includes(kw.toLowerCase().replace(/-/g, ' '))) return stage
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
// 3. Parse all 4 RACI markdown layers

function parseLayer({ file, layer, stageHint }) {
  const md = readMd(file)
  const tables = findRaciTables(md)
  const rowNotes = extractRowNotes(md)
  const activities = []
  for (const t of tables) {
    const actorIds = t.header.slice(2)
    for (const r of t.rows) {
      if (r.length < 3) continue
      const num = parseInt(r[0], 10)
      if (isNaN(num)) continue
      const rawName = r[1]
      const name = cleanActivityName(rawName)
      if (!name) continue
      const horizon = inferHorizon(rawName)
      const stage = inferStage(name, stageHint)
      const id = `${layer}-${num}-${slugify(name)}`
      const raci = {}
      for (let k = 0; k < actorIds.length; k++) {
        const actorCode = actorIds[k]
        if (!actorCode) continue
        const cell = r[k + 2] ?? ''
        const parsed = parseCell(cell)
        if (parsed.roles.length || parsed.disputed || parsed.unknown) {
          raci[actorCode] = {
            role: parsed.roles.join(','),
            disputed: parsed.disputed,
            unknown: parsed.unknown,
            note: parsed.note,
          }
        }
      }
      activities.push({
        id, layer, sourceRow: num, stage, horizon, name, rawName,
        raci,
        note: rowNotes[num] ?? null,
        source: `dossier/raci/${file}#row-${num}`,
      })
    }
  }
  return activities
}

// ────────────────────────────────────────────────────────────────────────
// 4. Load existing nodes.js / edges.js / levers.js as data (Function eval)

function loadJsModule(relPath, returnNames) {
  const txt = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
  const transformed = txt
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+default\s+/g, 'const __default__ = ')
    + `\nreturn { ${returnNames.join(', ')} };`
  // eslint-disable-next-line no-new-func
  const fn = new Function(transformed)
  return fn()
}

// ────────────────────────────────────────────────────────────────────────
// 5. Mapping tables: graph-side IDs ↔ dossier IDs

// nodes.js id (lowercase) → dossier actor id (uppercase code).
// system-map has JICA/GIZ/WB as separate donor nodes; we map the
// graph's aggregated `donors` node onto JICA (most prominent — 10
// trucks to Pastrimi, €4.83M regional grant).
const NODES_JS_TO_DOSSIER = {
  eu:                  'EU',
  donors:              'JICA',
  courts:              'SUP_COURT',
  mmphi:               'MMPHI',
  ammk:                'AMMK',
  ombudsperson:        'OMB',
  municipality:        'KOM',
  assembly:            'ASMB',
  workers:             'PAS_UNION',
  pastrimi:            'PAS',
  klmc:                'KLM',
  private_operators:   'PRV',
  citizens:            'CIT',
  informal_collectors: 'INFORMAL',
  mirash:              'MIRASH',
}
const DOSSIER_TO_NODES_JS = Object.fromEntries(
  Object.entries(NODES_JS_TO_DOSSIER).map(([k, v]) => [v, k])
)

// RACI markdown actor codes that need normalising → dossier actor IDs
const RACI_ACTOR_ALIASES = {
  KOMUNA: 'KOM', PASTRIMI: 'PAS', KLMC: 'KLM',
  PROs: 'PRO', CITIZENS: 'CIT', COURTS: 'COURT',
  CON: 'IND_CON', IND: 'IND_CON', 'IND/CON': 'IND_CON',
  HReg: 'HREG', HREG: 'HREG', OPERATORS: 'OPERATORS',
  'PAS/operators': 'PAS', ASMB_NEW: 'ASMB',
}
const canonRaciActor = (code) => {
  const k = (code || '').replace(/\*/g, '').trim()
  return RACI_ACTOR_ALIASES[k] || k
}

// Map RACI markdown's COURT (single column) onto SUP_COURT in dossier
const RACI_TO_SYSTEM_MAP = { COURT: 'SUP_COURT', }

// Edge type → category for the graph view
const EDGE_TYPE_TO_CATEGORY = {
  shareholder: 'authority',
  appoints:    'authority',
  regulates:   'authority',
  licenses:    'authority',
  advises:     'authority',
  contracts:   'operational',
  collects_from: 'operational',
  separates_for: 'operational',
  reports_to:  'operational',
  inspects:    'oversight',
  pays:        'money',
  owes:        'money',
  taxes:       'money',
  funds:       'money',
  donates:     'money',
  fines:       'oversight',
  disputes:    'political',
}

// ────────────────────────────────────────────────────────────────────────
// 6. Build catalog + matrix + graph

function loadSystemMap() {
  const j = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'system-map.json'), 'utf8'))
  return {
    nodes: j.states.current.nodes,
    futureNodes: j.states.post_new_law_2027?.added_nodes ?? [],
    edges: j.states.current.edges,
    futureEdges: j.states.post_new_law_2027?.added_edges ?? [],
    policies: j.policies ?? [],
    transitions: j.transitions ?? [],
    openQuestions: j.open_questions ?? [],
    snapshotDate: j.snapshot_date,
  }
}

function buildActors(systemMap, nodesJs) {
  const allNodes = [...systemMap.nodes, ...systemMap.futureNodes]
  const richByDossierId = {}
  for (const n of nodesJs) {
    const dossierId = NODES_JS_TO_DOSSIER[n.id]
    if (!dossierId) continue
    richByDossierId[dossierId] = n
  }
  return allNodes.map(n => {
    const richNode = richByDossierId[n.id]
    const future = systemMap.futureNodes.some(x => x.id === n.id)
    return {
      id: n.id,
      name: n.name,
      type: n.type,
      tier: n.tier,
      subtype: n.subtype ?? null,
      parent: n.parent ?? null,
      future,
      ...(n.note ? { systemNote: n.note } : {}),
      ...(n.employees ? { employees: n.employees } : {}),
      ...(n.trucks_household ? { trucks_household: n.trucks_household } : {}),
      ...(n.clients_self_count ? { clients_self_count: n.clients_self_count } : {}),
      ...(n.clients_kom_count ? { clients_kom_count: n.clients_kom_count } : {}),
      // Rich narrative metadata (only present where graph maps to nodes.js)
      rich: richNode ? {
        label:       richNode.data.label,
        fullName:    richNode.data.fullName,
        role:        richNode.data.role,
        keyPerson:   richNode.data.keyPerson,
        leverage:    richNode.data.leverage,
        dependencies: richNode.data.dependencies,
        fears:       richNode.data.fears,
        stats:       richNode.data.stats,
        quote:       richNode.data.quote,
        quoteSource: richNode.data.quoteSource,
        quoteUrl:    richNode.data.quoteUrl,
      } : null,
      // Graph-display metadata
      graph: richNode ? {
        show: true,
        legacyId: richNode.id,                // 'pastrimi'
        position: richNode.position,
        displayName: richNode.data.label,
        tier: richNode.data.tier,             // 'operational'|'municipal'|...
      } : { show: false },
    }
  })
}

function makeEdgeId(e) {
  // deterministic id; safe for cross-reference. (system-map can have dupes
  // for the same pair with different types — type included.)
  return `${e.from}-${(e.type || 'rel').replace(/_/g, '-')}-${e.to}`
}

function buildEdges(systemMap, edgesJs) {
  // Build a pool of edges.js candidates. Each candidate can be claimed by
  // AT MOST ONE dossier edge.
  const pool = []
  for (const ge of edgesJs) {
    const fromD = NODES_JS_TO_DOSSIER[ge.source]
    const toD   = NODES_JS_TO_DOSSIER[ge.target]
    if (!fromD || !toD) continue
    pool.push({
      ge,
      fromD, toD,
      category: ge.data.relationshipType,
      claimed: false,
    })
  }

  // Score how well a system-map edge matches an edges.js candidate.
  // Higher = better. Returns -1 if disqualified.
  function score(sysEdge, cand, sysCategory) {
    if (cand.claimed) return -1
    if (cand.fromD !== sysEdge.from || cand.toD !== sysEdge.to) return -1
    let s = 0
    // Strong: category match
    if (cand.category === sysCategory) s += 100
    // Bonus: type-specific narrative cue (e.g. "owes" should prefer the debt edge)
    const label = (cand.ge.data.label || '').toLowerCase()
    if (sysEdge.type === 'owes' && /owe|debt|arrears/.test(label)) s += 50
    if (sysEdge.type === 'pays' && /€\s*\d|\b6\.20|month/.test(label)) s += 20
    if (sysEdge.type === 'donates' && /grant|truck|jica|donate/.test(label)) s += 50
    if (sysEdge.type === 'funds' && /fund|landfill|construction/.test(label)) s += 30
    if (sysEdge.type === 'inspects' && /inspect|monitor|investigat|criticiz/.test(label)) s += 30
    if (sysEdge.type === 'shareholder' && /shareholder|adversarial/.test(label)) s += 50
    if (sysEdge.type === 'licenses' && /licens/.test(label)) s += 50
    if (sysEdge.type === 'advises' && /strike|union|labor/.test(label)) s += 30
    return s
  }

  const out = []
  for (const e of [...systemMap.edges, ...systemMap.futureEdges]) {
    const id = makeEdgeId(e)
    const future = systemMap.futureEdges.includes(e)
    const category = EDGE_TYPE_TO_CATEGORY[e.type] || 'operational'

    // Greedy: pick the best unclaimed candidate matching this pair+category.
    let best = null, bestScore = -1
    for (const cand of pool) {
      const s = score(e, cand, category)
      if (s > bestScore) { bestScore = s; best = cand }
    }
    let match = null
    if (best && bestScore >= 100) {
      best.claimed = true
      match = best.ge
    }

    out.push({
      id,
      from: e.from,
      to: e.to,
      type: e.type,
      type_detail: e.type_detail ?? null,
      category,
      value_eur: e.value_eur ?? null,
      value_eur_per_month: e.value_eur_per_month ?? null,
      status: e.status ?? null,
      systemNote: e.note ?? null,
      future,
      graph: match ? {
        show: true,
        legacyId: match.id,
        label: match.data.label,
        relationshipType: match.data.relationshipType,
        statusLabel: match.data.status,
        narrativeNote: match.data.note,
      } : { show: false },
    })
  }

  // Any unclaimed edges.js entries become synthetic dossier edges.
  const synth = []
  for (const cand of pool) {
    if (cand.claimed) continue
    const ge = cand.ge
    const cat = ge.data.relationshipType || 'operational'
    const synthType = cat === 'money' ? 'pays'
                    : cat === 'authority' ? 'regulates'
                    : cat === 'oversight' ? 'inspects'
                    : cat === 'political' ? 'disputes'
                    : 'contracts'
    synth.push({
      id: `graph-${ge.id}`,
      from: cand.fromD, to: cand.toD,
      type: synthType,
      type_detail: null,
      category: cat,
      value_eur: null,
      value_eur_per_month: null,
      status: ge.data.status ?? null,
      systemNote: null,
      future: false,
      synthetic: true,
      graph: {
        show: true,
        legacyId: ge.id,
        label: ge.data.label,
        relationshipType: cat,
        statusLabel: ge.data.status,
        narrativeNote: ge.data.note,
      },
    })
  }
  return [...out, ...synth]
}

function buildLevers(leversJs, edges) {
  // Map edges.js legacyId → dossier edge id
  const edgesByLegacyId = {}
  for (const e of edges) {
    if (e.graph?.legacyId) edgesByLegacyId[e.graph.legacyId] = e.id
  }
  return leversJs.map(l => ({
    id: l.id,
    iconName: l.iconName,
    title: l.title,
    description: l.description,
    context: l.context,
    headlines: l.headlines,
    historical: !!l.historical,
    historicalDate: l.historicalDate ?? null,
    affectedActorIds: (l.affectedNodeIds || []).map(id => NODES_JS_TO_DOSSIER[id]).filter(Boolean),
    affectedEdgeIds: (l.affectedEdgeIds || []).map(id => edgesByLegacyId[id]).filter(Boolean),
    affectedActivityIds: [], // populated post-hoc below
    revealOrder: (l.revealOrder || []).map(wave =>
      wave.map(id => NODES_JS_TO_DOSSIER[id] || id).filter(Boolean)
    ),
    actorEffects: Object.fromEntries(
      Object.entries(l.nodeEffects || {})
        .map(([k, v]) => [NODES_JS_TO_DOSSIER[k] || k, v])
        .filter(([k]) => !!k)
    ),
  }))
}

// Each lever's affectedActivityIds = activities whose stage matches the
// lever's theme AND whose RACI involves any affected actor. (Heuristic; can
// be tightened by hand later.)
function attachActivitiesToLevers(levers, coreActivities) {
  for (const lever of levers) {
    const actorSet = new Set(lever.affectedActorIds)
    const ids = []
    for (const a of coreActivities) {
      const involvedHere = Object.keys(a.raci).some(id => actorSet.has(id))
      if (involvedHere) ids.push(a.id)
    }
    lever.affectedActivityIds = ids
  }
}

// ────────────────────────────────────────────────────────────────────────
// Main

function main() {
  console.log('▸ Loading system-map.json …')
  const systemMap = loadSystemMap()

  console.log('▸ Loading legacy graph snapshots (dossier-source/legacy-graph/) …')
  const { initialNodes }  = loadJsModule('dossier-source/legacy-graph/nodes.js',  ['initialNodes'])
  const { initialEdges }  = loadJsModule('dossier-source/legacy-graph/edges.js',  ['initialEdges'])
  const { levers: leversJs } = loadJsModule('dossier-source/legacy-graph/levers.js', ['levers'])
  console.log(`  nodes.js: ${initialNodes.length} actors`)
  console.log(`  edges.js: ${initialEdges.length} edges`)
  console.log(`  levers.js: ${leversJs.length} levers`)

  console.log('▸ Parsing RACI markdown …')
  let allActivities = []
  for (const cfg of LAYERS) {
    const acts = parseLayer(cfg)
    console.log(`  ${cfg.file}: ${acts.length} activities`)
    allActivities.push(...acts)
  }

  // Normalise actor codes in raci cells
  for (const a of allActivities) {
    const norm = {}
    for (const [code, cell] of Object.entries(a.raci)) {
      const c = canonRaciActor(code)
      const id = RACI_TO_SYSTEM_MAP[c] || c
      norm[id] = cell
    }
    a.raci = norm
  }

  // Split into core / proposals / signals
  const proposals = allActivities.filter(a => a.layer === 'recommendations')
  const signals   = allActivities.filter(a => a.layer !== 'recommendations' && a.horizon === 'speculative')
  const core      = allActivities.filter(a => a.layer !== 'recommendations' && a.horizon !== 'speculative')

  // Drop empty stages from core
  const usedStages = new Set(core.map(a => a.stage))
  const lifecycleStages = LIFECYCLE_STAGES.filter(s => usedStages.has(s.id))

  console.log('▸ Building actors (with graph metadata) …')
  const actors = buildActors(systemMap, initialNodes)
  // Per-actor activity count (for minor-actor filter in matrix UI)
  for (const a of actors) {
    a.activityCount = core.filter(act => act.raci[a.id]).length
  }
  console.log(`  ${actors.length} actors (${actors.filter(a => a.graph?.show).length} shown in graph)`)

  console.log('▸ Building edges (typed + narrative) …')
  const edges = buildEdges(systemMap, initialEdges)
  const graphEdges = edges.filter(e => e.graph?.show)
  console.log(`  ${edges.length} edges (${graphEdges.length} shown in graph)`)
  const synthCount = edges.filter(e => e.synthetic).length
  if (synthCount) console.log(`  ↳ ${synthCount} synthesised purely from edges.js (no system-map counterpart)`)

  console.log('▸ Migrating levers …')
  const levers = buildLevers(leversJs, edges)
  attachActivitiesToLevers(levers, core)
  for (const l of levers) {
    console.log(`  ${l.id}: ${l.affectedActorIds.length} actors, ${l.affectedEdgeIds.length} edges, ${l.affectedActivityIds.length} activities`)
  }

  // Stage histogram
  const stageHist = {}
  for (const a of core) stageHist[a.stage] = (stageHist[a.stage] || 0) + 1
  console.log('▸ Stage histogram (core):', stageHist)
  console.log(`▸ Core activities: ${core.length} | Proposals: ${proposals.length} | Signals: ${signals.length}`)

  const out = {
    version: '2.0',
    snapshotDate: systemMap.snapshotDate,
    generatedAt: new Date().toISOString(),
    lifecycle_stages: lifecycleStages,
    actors,
    activities: core,
    proposals,
    signals,
    edges,
    levers,
    policies: systemMap.policies,
    transitions: systemMap.transitions,
    openQuestions: systemMap.openQuestions,
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`✔ Wrote ${OUT}`)
  console.log(`  ${actors.length} actors · ${core.length} activities · ${proposals.length} proposals · ${signals.length} signals · ${edges.length} edges · ${levers.length} levers`)
}

main()
