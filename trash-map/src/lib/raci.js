// Selectors and helpers over dossier.json
// dossier.json is the single source of truth for both views:
//   - matrix view reads `activities` (RACI shape)
//   - graph view reads `actors` (where graph.show) + `edges` (where graph.show)
//   - both share `levers`, which reference activity/actor/edge IDs

import dossier from '../data/dossier.json'

export const dossierData = dossier

// ── Role visualisation ──────────────────────────────────────────────────
export const ROLE_STYLE = {
  A:   { bg: 'rgba(239, 68, 68, 0.18)',  fg: '#FCA5A5', border: '#EF4444', label: 'Accountable' },
  R:   { bg: 'rgba(59, 130, 246, 0.18)', fg: '#93C5FD', border: '#3B82F6', label: 'Responsible' },
  C:   { bg: 'rgba(148, 163, 184, 0.15)', fg: '#CBD5E1', border: '#94A3B8', label: 'Consulted' },
  I:   { bg: 'rgba(148, 163, 184, 0.08)', fg: '#94A3B8', border: '#64748B', label: 'Informed' },
}

// Edge categories used by the graph view
export const EDGE_CATEGORY_COLORS = {
  money:       '#F59E0B',
  authority:   '#8B5CF6',
  operational: '#64748B',
  political:   '#EC4899',
  oversight:   '#10B981',
}

export const HORIZONS = [
  { id: 'current',       label: 'Current (2024–2026)' },
  { id: 'post_new_law',  label: 'Post-new-law (2027+)' },
]

export const LAYERS = [
  { id: 'operational', label: 'Operational' },
  { id: 'policy',      label: 'Policy' },
  { id: 'enforcement', label: 'Enforcement' },
]

// ── Lookups ─────────────────────────────────────────────────────────────
export const stages    = dossier.lifecycle_stages
export const stagesById = Object.fromEntries(stages.map(s => [s.id, s]))

export const actors    = dossier.actors
export const actorsById = Object.fromEntries(actors.map(a => [a.id, a]))

export const activities  = dossier.activities      // core matrix activities (no recommendations, no speculative)
export const proposals   = dossier.proposals       // 21 INDEP/KAS + DYVÓ recs (separate "policy levers" view)
export const signals     = dossier.signals         // 1 speculative entry (Green Police)

export const edges       = dossier.edges
export const edgesById   = Object.fromEntries(edges.map(e => [e.id, e]))

export const levers      = dossier.levers
export const policies    = dossier.policies
export const transitions = dossier.transitions

// ── Filters ─────────────────────────────────────────────────────────────
export function filterActivities({ stages: stageIds, horizons, layers, query, actorId, roles, hideMinorActors }) {
  return activities.filter(a => {
    if (stageIds && stageIds.length && !stageIds.includes(a.stage)) return false
    if (horizons && horizons.length && !horizons.includes(a.horizon)) return false
    if (layers && layers.length && !layers.includes(a.layer)) return false
    if (query) {
      const q = query.toLowerCase()
      if (!a.name.toLowerCase().includes(q) &&
          !(a.note ?? '').toLowerCase().includes(q)) return false
    }
    if (actorId) {
      const cell = a.raci[actorId]
      if (!cell) return false
      if (roles && roles.length) {
        const cellRoles = (cell.role ?? '').split(',').filter(Boolean)
        if (!cellRoles.some(r => roles.includes(r))) return false
      }
    }
    return true
  })
}

export function activitiesByStage(filtered) {
  const out = {}
  for (const s of stages) out[s.id] = []
  for (const a of filtered) {
    if (!out[a.stage]) out[a.stage] = []
    out[a.stage].push(a)
  }
  return out
}

export function involvedActorIds(filteredActivities) {
  const s = new Set()
  for (const a of filteredActivities) {
    for (const id of Object.keys(a.raci)) s.add(id)
  }
  return [...s]
}

const TIER_ORDER = { international: 0, national: 1, regional: 2, municipal: 3 }
export function orderedActors(ids, { hideMinorActors = false, minActivityCount = 2 } = {}) {
  return ids
    .map(id => actorsById[id] ?? { id, name: id, tier: 'unknown', type: 'unknown', activityCount: 0 })
    .filter(a => !hideMinorActors || (a.activityCount ?? 0) >= minActivityCount)
    .sort((a, b) => {
      const t = (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)
      if (t) return t
      return a.id.localeCompare(b.id)
    })
}

// ── "Phantom A" detection ──────────────────────────────────────────────
export function phantomAccountabilityActivities(filtered = activities) {
  return filtered.filter(a => {
    let hasA = false, hasR = false, anyDisputed = false
    for (const cell of Object.values(a.raci)) {
      const roles = (cell.role ?? '').split(',').filter(Boolean)
      if (roles.includes('A')) hasA = true
      if (roles.includes('R') && !cell.disputed) hasR = true
      if (cell.disputed) anyDisputed = true
    }
    return (hasA && !hasR) || anyDisputed
  })
}

// ── Edges connecting two actors ─────────────────────────────────────────
export function edgesBetween(aId, bId) {
  return edges.filter(e =>
    (e.from === aId && e.to === bId) || (e.from === bId && e.to === aId)
  )
}

export function activitiesForActor(actorId) {
  return activities.filter(a => actorId in a.raci)
}

// ── Edges that "implement" a given activity (heuristic: edges between
//    actors whose RACI contains both R and A or R and any role) ─────────
export function edgesImplementingActivity(activityId) {
  const a = activities.find(x => x.id === activityId)
  if (!a) return []
  const ids = Object.keys(a.raci)
  return edges.filter(e => ids.includes(e.from) && ids.includes(e.to))
}

// ── Activities that an edge "supports" (heuristic inverse) ─────────────
export function activitiesSupportedByEdge(edgeId) {
  const e = edges.find(x => x.id === edgeId)
  if (!e) return []
  return activities.filter(a => a.raci[e.from] && a.raci[e.to])
}
