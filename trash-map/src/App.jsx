import { useState, useCallback } from 'react'
import GraphCanvas from './components/GraphCanvas'
import ActorSidebar from './components/ActorSidebar'
import LeverPanel from './components/LeverPanel'
import Legend from './components/Legend'
import { useActiveLever } from './hooks/useActiveLever'

export default function App() {
  const [selectedNode, setSelectedNode] = useState(null)
  const { activeLever, activeLeverId, affectedNodeIds, affectedEdgeIds, toggleLever } =
    useActiveLever()

  const handleNodeClick = useCallback((node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  const handleClosesidebar = useCallback(() => setSelectedNode(null), [])

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center gap-3 z-50">
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">
            Pristina Trash System
          </h1>
          <p className="text-slate-500 text-[11px]">
            Actor map — Trash, Please hackathon · May 2026
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {activeLever && (
            <span className="bg-white text-slate-900 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {activeLever.emoji} {activeLever.title}
            </span>
          )}
          <a
            href="https://github.com/Aldikrasniqi/trash"
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-slate-300 text-xs"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Main canvas */}
      <div className="flex-1 relative overflow-hidden">
        <GraphCanvas
          selectedNodeId={selectedNode?.id}
          onNodeClick={handleNodeClick}
          affectedNodeIds={affectedNodeIds}
          affectedEdgeIds={affectedEdgeIds}
          activeLever={activeLever}
        />
        <Legend />
      </div>

      {/* Actor sidebar */}
      <ActorSidebar
        node={selectedNode}
        activeLever={activeLever}
        onClose={handleClosesidebar}
      />

      {/* Lever panel (bottom) */}
      <LeverPanel activeLeverId={activeLeverId} onToggle={toggleLever} />
    </div>
  )
}
