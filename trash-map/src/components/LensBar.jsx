import { stages, HORIZONS, LAYERS } from '../lib/raci'

export default function LensBar({
  selectedStages, onToggleStage, onClearStages,
  selectedHorizons, onToggleHorizon,
  selectedLayers, onToggleLayer,
  query, onQueryChange,
  phantomOnly, onTogglePhantom,
}) {
  return (
    <div
      className="border-b px-4 py-3 flex flex-wrap items-center gap-3 text-xs"
      style={{ background: '#0B1220', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search activities…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="px-3 py-1.5 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500/50"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E2E8F0',
          width: 200,
        }}
      />

      <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Horizon */}
      <span className="text-slate-500 text-[10px] uppercase tracking-wider">Horizon</span>
      {HORIZONS.map(h => {
        const active = selectedHorizons.includes(h.id)
        return (
          <Chip key={h.id} active={active} onClick={() => onToggleHorizon(h.id)}>
            {h.label}
          </Chip>
        )
      })}

      <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Layer */}
      <span className="text-slate-500 text-[10px] uppercase tracking-wider">Layer</span>
      {LAYERS.map(l => {
        const active = selectedLayers.includes(l.id)
        return (
          <Chip key={l.id} active={active} onClick={() => onToggleLayer(l.id)}>
            {l.label}
          </Chip>
        )
      })}

      <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Phantom-A toggle */}
      <Chip active={phantomOnly} onClick={onTogglePhantom} accent="amber">
        ⚠ Phantom-A only
      </Chip>

      <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider">Stages</span>
        {stages.map(s => {
          const active = selectedStages.length === 0 || selectedStages.includes(s.id)
          return (
            <Chip
              key={s.id}
              active={selectedStages.includes(s.id)}
              dim={selectedStages.length > 0 && !selectedStages.includes(s.id)}
              onClick={() => onToggleStage(s.id)}
            >
              {s.name}
            </Chip>
          )
        })}
        {selectedStages.length > 0 && (
          <button
            onClick={onClearStages}
            className="text-slate-500 hover:text-slate-300 text-[10px] underline ml-1"
          >
            clear
          </button>
        )}
      </div>
    </div>
  )
}

function Chip({ active, dim, onClick, children, accent }) {
  const baseBg = active
    ? (accent === 'amber' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)')
    : 'rgba(255,255,255,0.03)'
  const baseFg = active
    ? (accent === 'amber' ? '#FCD34D' : '#93C5FD')
    : '#94A3B8'
  const baseBorder = active
    ? (accent === 'amber' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)')
    : 'rgba(255,255,255,0.08)'
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
      style={{
        background: baseBg,
        color: baseFg,
        border: `1px solid ${baseBorder}`,
        opacity: dim ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}
