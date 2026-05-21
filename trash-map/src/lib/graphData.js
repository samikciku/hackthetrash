// Derives graph-shaped data (nodes / edges / levers) from dossier.json.
// dossier.json is the single source of truth. This file reshapes it for
// React Flow + the existing ActorNode component.
//
// The graph supports three density modes:
//   'core'    — the 15 hand-placed actors flagged graph.show (the legible view)
//   'current' — all present-day actors (future === false) → 35 nodes
//   'full'    — the full mess: every actor incl. the 2027 horizon → 60 nodes
// Only the core set has hand-authored positions/tiers; the rest get a derived
// tier color and an auto-computed position (see layout.js).

import dossier from '../data/dossier.json'
import { layoutGraph } from './layout'

export const TIER_COLORS = {
  operational: '#F59E0B',
  municipal:   '#3B82F6',
  national:    '#8B5CF6',
  citizens:    '#10B981',
  informal:    '#94A3B8',
  external:    '#0EA5E9',
  endpoint:    '#78716C',
  blocked:     '#EF4444',
  policy:      '#C084FC',
}

export const EDGE_COLORS = {
  money:       '#F59E0B',
  authority:   '#8B5CF6',
  operational: '#64748B',
  political:   '#EC4899',
  oversight:   '#10B981',
}

// Map an actor's dossier type/tier onto a TIER_COLORS key when the actor has
// no hand-authored graph.tier (i.e. it was never placed on the curated graph).
function deriveTier(a) {
  if (a.graph?.tier) return a.graph.tier
  switch (a.type) {
    case 'operator':                return 'operational'
    case 'municipality':            return 'municipal'
    case 'ministry':
    case 'court':
    case 'regulator':               return 'national'
    case 'agency':                  return a.tier === 'municipal' ? 'municipal' : 'national'
    case 'donor':
    case 'civil_society':           return 'external'
    case 'citizen_class':           return 'citizens'
    case 'infrastructure':          return 'endpoint'
    case 'policy':
    case 'fund':                    return 'policy'
    case 'organization':            return 'operational'
    default:                        return 'informal'
  }
}

function nodeFromActor(a) {
  return {
    id: a.id,
    type: 'actorNode',
    position: a.graph?.position || { x: 0, y: 0 },
    data: {
      label:        a.graph?.displayName || a.rich?.label || a.name,
      fullName:     a.rich?.fullName || a.name,
      tier:         deriveTier(a),
      future:       !!a.future,
      role:         a.rich?.role || a.systemNote || '',
      keyPerson:    a.rich?.keyPerson || null,
      leverage:     a.rich?.leverage || [],
      dependencies: a.rich?.dependencies || [],
      fears:        a.rich?.fears || [],
      stats:        a.rich?.stats || [],
      quote:        a.rich?.quote || null,
      quoteSource:  a.rich?.quoteSource || null,
      quoteUrl:     a.rich?.quoteUrl || null,
    },
  }
}

function edgeFromDossier(e) {
  return {
    id: e.id,
    source: e.from,
    target: e.to,
    data: {
      relationshipType: e.graph?.relationshipType || e.category,
      label:  e.graph?.label || e.type,
      status: (e.graph?.statusLabel || e.status || 'active').toLowerCase(),
      note:   e.graph?.narrativeNote || e.systemNote || '',
      future: !!e.future,
    },
  }
}

// Build {nodes, edges} for a density mode.
export function buildGraph(mode = 'full') {
  const actors =
    mode === 'core'    ? dossier.actors.filter((a) => a.graph?.show) :
    mode === 'current' ? dossier.actors.filter((a) => !a.future) :
                         dossier.actors

  const visibleIds = new Set(actors.map((a) => a.id))

  const edgeSource =
    mode === 'core'
      ? dossier.edges.filter((e) => e.graph?.show)
      : dossier.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to))

  // Dossier can carry duplicate edge ids (same from/to/type); React Flow
  // requires unique ids, so suffix repeats.
  const seen = new Map()
  const edges = edgeSource.map(edgeFromDossier).map((e) => {
    const n = (seen.get(e.id) || 0) + 1
    seen.set(e.id, n)
    return n === 1 ? e : { ...e, id: `${e.id}#${n}` }
  })

  let nodes = actors.map(nodeFromActor)

  // Core nodes are hand-placed; every other mode is auto-laid-out.
  if (mode !== 'core') nodes = layoutGraph(nodes, edges)

  return { nodes, edges }
}

export const GRAPH_MODES = [
  { id: 'full',    label: 'Full mess', count: dossier.actors.length },
  { id: 'current', label: 'Current',   count: dossier.actors.filter((a) => !a.future).length },
  { id: 'core',    label: 'Core',      count: dossier.actors.filter((a) => a.graph?.show).length },
]

// Back-compat exports (core view).
const core = buildGraph('core')
export const initialNodes = core.nodes
export const initialEdges = core.edges

export const levers = dossier.levers
