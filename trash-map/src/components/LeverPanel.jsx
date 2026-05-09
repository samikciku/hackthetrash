import { levers } from '../data/levers'

export default function LeverPanel({ activeLeverId, onToggle }) {
  const activeLever = levers.find((l) => l.id === activeLeverId)
  const isHistorical = activeLever?.historical

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur border-t border-slate-700">
      {/* Active lever context strip */}
      {activeLever && (
        isHistorical ? (
          /* ── Historical / Replay mode — amber archive aesthetic ── */
          <div
            className="px-4 pt-3 pb-2 border-b"
            style={{ background: 'rgba(69, 26, 3, 0.5)', borderColor: '#78350f' }}
          >
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1"
                style={{ color: '#f59e0b' }}>
                📼 Based on true events · {activeLever.historicalDate}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#fde68a99' }}>
                <span className="font-semibold" style={{ color: '#fde68a' }}>
                  {activeLever.emoji} {activeLever.title}:
                </span>
                {' '}{activeLever.context}
              </p>
            </div>
          </div>
        ) : (
          /* ── Regular hypothetical lever ── */
          <div className="px-4 pt-3 pb-1 border-b border-slate-800">
            <div className="max-w-3xl">
              <p className="text-slate-400 text-xs leading-relaxed">
                <span className="text-white font-semibold">
                  {activeLever.emoji} {activeLever.title}:
                </span>
                {' '}{activeLever.context}
              </p>
            </div>
          </div>
        )
      )}

      {/* Lever buttons */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest shrink-0 mr-1">
          What if →
        </span>

        {levers.map((lever) => {
          const isActive = activeLeverId === lever.id
          const historical = lever.historical

          // Compute button style based on active + historical state
          let btnClass = 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all '
          if (isActive && historical) {
            btnClass += 'border-amber-400 text-amber-900 bg-amber-200'
          } else if (isActive) {
            btnClass += 'bg-white text-slate-900 border-white'
          } else if (historical) {
            btnClass += 'bg-amber-950/40 text-amber-400 border-amber-800 hover:border-amber-500 hover:text-amber-200'
          } else {
            btnClass += 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400 hover:text-white'
          }

          return (
            <button
              key={lever.id}
              onClick={() => onToggle(lever.id)}
              className={btnClass}
            >
              <span>{lever.emoji}</span>
              <span>{lever.title}</span>
              {historical && (
                <span
                  className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded leading-none ${
                    isActive
                      ? 'bg-amber-700/40 text-amber-800'
                      : 'bg-amber-900/60 text-amber-500'
                  }`}
                >
                  REPLAY
                </span>
              )}
            </button>
          )
        })}

        {activeLeverId && (
          <button
            onClick={() => onToggle(activeLeverId)}
            className="shrink-0 ml-auto text-slate-500 hover:text-white text-xs underline"
          >
            clear
          </button>
        )}
      </div>
    </div>
  )
}
