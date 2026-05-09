// Derives graph-shaped data (nodes / edges / levers) from dossier.json.
// dossier.json is the single source of truth. This file just reshapes
// it for React Flow + the existing ActorNode component.

import dossier from '../data/dossier.json'

export const TIER_COLORS = {
  operational: '#F59E0B',
  municipal:   '#3B82F6',
  national:    '#8B5CF6',
  citizens:    '#10B981',
  informal:    '#94A3B8',
  external:    '#0EA5E9',
  endpoint:    '#78716C',
  blocked:     '#EF4444',
}

export const EDGE_COLORS = {
  money:       '#F59E0B',
  authority:   '#8B5CF6',
  operational: '#64748B',
  political:   '#EC4899',
  oversight:   '#10B981',
}

// React Flow nodes — only actors flagged graph.show
export const initialNodes = dossier.actors
  .filter(a => a.graph?.show)
  .map(a => ({
    id: a.id,                                // dossier uppercase id (e.g. 'PAS')
    type: 'actorNode',
    position: a.graph.position,
    data: {
      label:       a.graph.displayName || a.name,
      fullName:    a.rich?.fullName || a.name,
      tier:        a.graph.tier,             // 'operational' | 'municipal' | …
      role:        a.rich?.role || a.systemNote || '',
      keyPerson:   a.rich?.keyPerson || null,
      leverage:    a.rich?.leverage || [],
      dependencies: a.rich?.dependencies || [],
      fears:       a.rich?.fears || [],
      stats:       a.rich?.stats || [],
      quote:       a.rich?.quote || null,
      quoteSource: a.rich?.quoteSource || null,
      quoteUrl:    a.rich?.quoteUrl || null,
    },
  }))

// React Flow edges — only edges flagged graph.show
export const initialEdges = dossier.edges
  .filter(e => e.graph?.show)
  .map(e => ({
    id: e.id,                                // dossier composite id
    source: e.from,
    target: e.to,
    data: {
      relationshipType: e.graph.relationshipType || e.category,
      label:  e.graph.label || e.type,
      status: (e.graph.statusLabel || e.status || 'active').toLowerCase(),
      note:   e.graph.narrativeNote || e.systemNote || '',
    },
  }))

// Levers — already in dossier shape, with affectedActorIds / affectedEdgeIds
// using dossier IDs (matching node + edge IDs above).
export const levers = dossier.levers
