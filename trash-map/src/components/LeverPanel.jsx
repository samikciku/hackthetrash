import { levers } from '../data/levers'

export default function LeverPanel({ activeLeverId, onToggle }) {
  const activeLever = levers.find((l) => l.id === activeLeverId)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur border-t border-slate-700">
      {/* Active lever context */}
      {activeLever && (
        <div className="px-4 pt-3 pb-1 border-b border-slate-800">
          <div className="max-w-3xl">
            <p className="text-slate-400 text-xs leading-relaxed">
              <span className="text-white font-semibold">{activeLever.emoji} {activeLever.title}:</span>
              {' '}{activeLever.context}
            </p>
          </div>
        </div>
      )}

      {/* Lever buttons */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest shrink-0 mr-1">
          What if →
        </span>
        {levers.map((lever) => {
          const isActive = activeLeverId === lever.id
          return (
            <button
              key={lever.id}
              onClick={() => onToggle(lever.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${isActive
                  ? 'bg-white text-slate-900 border-white'
                  : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400 hover:text-white'
                }`}
            >
              <span>{lever.emoji}</span>
              <span>{lever.title}</span>
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
