// Auto-layout for graph modes that include actors without hand-authored
// positions. Hand-placed core nodes keep their coordinates; everything else
// gets a computed position from dagre so the "current" and "full mess" views
// don't pile every extra node at the origin.

import dagre from '@dagrejs/dagre'

const NODE_W = 160
const NODE_H = 72

// Returns a new node array with dagre-computed positions.
// rankdir 'TB' = top-to-bottom flow, which reads well for the
// money / authority / oversight direction of the dossier edges.
export function layoutGraph(nodes, edges, { rankdir = 'TB', ranksep = 110, nodesep = 55 } = {}) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir, ranksep, nodesep, marginx: 40, marginy: 40 })

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target)
  })

  dagre.layout(g)

  return nodes.map((n) => {
    const p = g.node(n.id)
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } }
  })
}
