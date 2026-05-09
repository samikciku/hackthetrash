import { TIER_COLORS } from '../data/nodes'

const TIER_LABELS = {
  operational: 'Operational',
  municipal:   'Municipal',
  national:    'National',
  citizens:    'Citizens',
  informal:    'Informal',
  external:    'External',
  endpoint:    'Physical endpoint',
  blocked:     'Blocked / Contested',
}

export default function ActorSidebar({ node, activeLever, onClose }) {
  if (!node) return null
  const d     = node.data
  const color = TIER_COLORS[d.tier] ?? '#94A3B8'

  // If a lever is active, pull the narrative for this node
  const leverEffect = activeLever?.nodeEffects?.[node.id] ?? null

  return (
    <aside
      className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 overflow-y-auto z-50 flex flex-col"
      style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-2 sticky top-0 z-10"
        style={{ background: `${color}18`, borderBottom: `2px solid ${color}` }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: color }} />
            <h2 className="text-white font-bold text-base leading-tight">{d.label}</h2>
          </div>
          <p className="text-slate-400 text-xs pl-4">{d.fullName}</p>
          {d.keyPerson && (
            <p className="text-slate-400 text-xs pl-4 mt-0.5 italic">{d.keyPerson}</p>
          )}
          <span
            className="inline-block mt-1.5 ml-4 text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: `${color}25`, color }}
          >
            {TIER_LABELS[d.tier] ?? d.tier}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white text-lg leading-none mt-0.5 shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Active lever narrative for this node */}
        {leverEffect && (
          <div
            className={`rounded-lg px-3 py-2.5 border
              ${leverEffect.stressLevel === 'high'   ? 'bg-red-950/60 border-red-700 text-red-200'       : ''}
              ${leverEffect.stressLevel === 'medium' ? 'bg-orange-950/60 border-orange-700 text-orange-200' : ''}
              ${leverEffect.stressLevel === 'low'    ? 'bg-yellow-950/60 border-yellow-700 text-yellow-200' : ''}
              ${leverEffect.stressLevel === 'none'   ? 'bg-slate-800 border-slate-600 text-slate-300'       : ''}
            `}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
              {activeLever.emoji} Lever effect
            </p>
            <p className="text-sm leading-relaxed">{leverEffect.narrative}</p>
          </div>
        )}

        {/* Role */}
        <Section title="Role">
          <p className="text-slate-300 text-sm leading-relaxed">{d.role}</p>
        </Section>

        {/* Leverage */}
        {d.leverage?.length > 0 && (
          <Section title="What they control">
            <ul className="space-y-1">
              {d.leverage.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Dependencies */}
        {d.dependencies?.length > 0 && (
          <Section title="What they need">
            <ul className="space-y-1">
              {d.dependencies.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Fears */}
        {d.fears?.length > 0 && (
          <Section title="What they fear">
            <ul className="space-y-1">
              {d.fears.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-red-400 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Stats */}
        {d.stats?.length > 0 && (
          <Section title="Key numbers">
            <div className="space-y-1.5">
              {d.stats.map((s, i) => (
                <div key={i} className="flex justify-between gap-2 text-sm border-b border-slate-800 pb-1.5">
                  <span className="text-slate-500 shrink-0">{s.label}</span>
                  <span className="text-slate-200 text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Quote */}
        {d.quote && (
          <div className="border-l-2 border-slate-600 pl-3">
            <p className="text-slate-300 text-sm leading-relaxed italic">{d.quote}</p>
            {d.quoteSource && (
              <p className="text-slate-500 text-xs mt-1.5">
                — {d.quoteSource}
                {d.quoteUrl && (
                  <>
                    {' '}
                    <a
                      href={d.quoteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300 underline"
                    >
                      ↗
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}
