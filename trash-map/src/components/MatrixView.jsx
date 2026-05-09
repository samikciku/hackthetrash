import { useState, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import {
  stages, stagesById,
  filterActivities, activitiesByStage,
  involvedActorIds, orderedActors,
  phantomAccountabilityActivities,
} from '../lib/raci'
import LensBar from './LensBar'
import MatrixCell from './MatrixCell'
import CellDetailPanel from './CellDetailPanel'

export default function MatrixView() {
  // Filter state
  const [selectedStages, setSelectedStages] = useState([])
  const [selectedHorizons, setSelectedHorizons] = useState(['current', 'post_new_law'])
  const [selectedLayers, setSelectedLayers] = useState(['operational', 'policy', 'enforcement', 'recommendations'])
  const [query, setQuery] = useState('')
  const [phantomOnly, setPhantomOnly] = useState(false)

  // Selected cell
  const [selected, setSelected] = useState(null)  // { activity, actorId }
  const [hoveredCol, setHoveredCol] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)

  // ── Derived data ──
  const filtered = useMemo(() => {
    let acts = filterActivities({
      stages: selectedStages,
      horizons: selectedHorizons,
      layers: selectedLayers,
      query,
    })
    if (phantomOnly) acts = phantomAccountabilityActivities(acts)
    return acts
  }, [selectedStages, selectedHorizons, selectedLayers, query, phantomOnly])

  const grouped = useMemo(() => activitiesByStage(filtered), [filtered])
  const visibleStages = useMemo(
    () => stages.filter(s => grouped[s.id]?.length),
    [grouped]
  )
  const columnActors = useMemo(
    () => orderedActors(involvedActorIds(filtered)),
    [filtered]
  )

  // ── Toggle helpers ──
  const toggleIn = (list, id) =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id]
  const toggleStage = id => setSelectedStages(prev => toggleIn(prev, id))
  const toggleHorizon = id => setSelectedHorizons(prev => toggleIn(prev, id))
  const toggleLayer = id => setSelectedLayers(prev => toggleIn(prev, id))

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: '#07090F' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <LensBar
          selectedStages={selectedStages}
          onToggleStage={toggleStage}
          onClearStages={() => setSelectedStages([])}
          selectedHorizons={selectedHorizons}
          onToggleHorizon={toggleHorizon}
          selectedLayers={selectedLayers}
          onToggleLayer={toggleLayer}
          query={query}
          onQueryChange={setQuery}
          phantomOnly={phantomOnly}
          onTogglePhantom={() => setPhantomOnly(v => !v)}
        />

        {/* Stat strip */}
        <div className="px-4 py-2 flex items-center gap-4 text-[10px] text-slate-500 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span><b className="text-slate-300">{filtered.length}</b> activities</span>
          <span><b className="text-slate-300">{columnActors.length}</b> actors involved</span>
          <span><b className="text-slate-300">{visibleStages.length}</b> stages</span>
          <span className="ml-auto text-slate-600">
            R = Responsible · A = Accountable · C = Consulted · I = Informed · ⚠ disputed · ? unverified
          </span>
        </div>

        {/* The matrix */}
        <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-slate-500 text-sm">
              No activities match the current filters.
            </div>
          ) : (
            <table className="text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    className="text-left px-3 py-2 font-medium text-slate-400 sticky top-0 left-0 z-30"
                    style={{
                      background: '#0B1220',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      borderRight: '1px solid rgba(255,255,255,0.08)',
                      minWidth: 320,
                      width: 320,
                    }}
                  >
                    Activity
                  </th>
                  {columnActors.map((a, i) => (
                    <th
                      key={a.id}
                      title={a.name}
                      onMouseEnter={() => setHoveredCol(i)}
                      onMouseLeave={() => setHoveredCol(null)}
                      className="font-mono font-semibold text-[10px] sticky top-0 z-20 px-1.5 py-2"
                      style={{
                        background: hoveredCol === i ? '#13203a' : '#0B1220',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                        color: '#CBD5E1',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        height: 130,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleStages.map(stage => (
                  <StageBlock
                    key={stage.id}
                    stage={stage}
                    activities={grouped[stage.id]}
                    columnActors={columnActors}
                    onCellClick={(activity, actorId) => setSelected({ activity, actorId })}
                    selected={selected}
                    hoveredCol={hoveredCol}
                    setHoveredCol={setHoveredCol}
                    hoveredRow={hoveredRow}
                    setHoveredRow={setHoveredRow}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <CellDetailPanel
            key={selected.activity.id + ':' + selected.actorId}
            activity={selected.activity}
            actorId={selected.actorId}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StageBlock({
  stage, activities, columnActors,
  onCellClick, selected,
  hoveredCol, setHoveredCol, hoveredRow, setHoveredRow,
}) {
  return (
    <>
      <tr>
        <td
          colSpan={columnActors.length + 1}
          className="text-[10px] uppercase tracking-widest font-semibold sticky left-0 z-10"
          style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.10), transparent)',
            color: '#93C5FD',
            padding: '8px 12px',
            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
          }}
        >
          {stage.name}{' '}
          <span className="text-slate-500 font-normal normal-case tracking-normal ml-2">
            {stage.blurb}
          </span>
          <span className="ml-2 text-slate-600">({activities.length})</span>
        </td>
      </tr>
      {activities.map((activity, rowIdx) => (
        <tr
          key={activity.id}
          onMouseEnter={() => setHoveredRow(activity.id)}
          onMouseLeave={() => setHoveredRow(null)}
          style={{
            background: hoveredRow === activity.id ? 'rgba(255,255,255,0.025)' : 'transparent',
          }}
        >
          <td
            className="px-3 py-1.5 text-slate-300 sticky left-0 z-10"
            style={{
              background: hoveredRow === activity.id ? '#0F1729' : '#0B1220',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              width: 320,
              minWidth: 320,
              maxWidth: 320,
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-slate-600 font-mono text-[9px] mt-0.5 shrink-0">
                {activity.layer.slice(0, 3)}{activity.sourceRow}
              </span>
              <span className="text-[11px] leading-snug">{activity.name}</span>
            </div>
            <div className="flex gap-1 mt-1">
              {activity.horizon === 'post_new_law' && (
                <MiniTag color="#A78BFA">new law</MiniTag>
              )}
              {activity.horizon === 'speculative' && (
                <MiniTag color="#F472B6">speculative</MiniTag>
              )}
            </div>
          </td>
          {columnActors.map((a, colIdx) => {
            const cell = activity.raci[a.id]
            const isSelected = selected
              && selected.activity.id === activity.id
              && selected.actorId === a.id
            return (
              <MatrixCell
                key={a.id}
                cell={cell}
                onClick={() => cell && onCellClick(activity, a.id)}
                isHovered={hoveredCol === colIdx || hoveredRow === activity.id}
                isSelected={isSelected}
              />
            )
          })}
        </tr>
      ))}
    </>
  )
}

function MiniTag({ children, color }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold"
      style={{
        background: `${color}1A`,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  )
}
