import { motion } from 'motion/react'
import { X, ExternalLink, Quote } from 'lucide-react'
import { actorsById, ROLE_STYLE, EDGE_CATEGORY_COLORS, edgesBetween } from '../lib/raci'

export default function CellDetailPanel({ activity, actorId, onClose }) {
  if (!activity || !actorId) return null
  const actor = actorsById[actorId]
  const cell = activity.raci[actorId]
  const roles = (cell?.role ?? '').split(',').filter(Boolean)
  const sourceUrl = `https://github.com/flosskosova/trash/blob/main/${activity.source.split('#')[0]}`

  // Edges this actor has with other actors that also have a role on this activity
  const otherActors = Object.keys(activity.raci).filter(id => id !== actorId)
  const relatedEdges = otherActors.flatMap(otherId =>
    edgesBetween(actorId, otherId).map(e => ({ ...e, otherId }))
  )

  return (
    <motion.aside
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="border-l flex flex-col overflow-hidden shrink-0"
      style={{
        width: 360,
        background: '#0B1220',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="text-[10px] uppercase tracking-widest text-slate-500">
          {activity.layer} · row {activity.sourceRow}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300"
        >
          <X size={14} />
        </button>
      </div>

      <div className="overflow-auto flex-1">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Activity</div>
            <h2 className="text-white font-semibold text-sm leading-snug">
              {activity.name}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
              <Tag>stage: {activity.stage}</Tag>
              <Tag>{activity.horizon}</Tag>
            </div>
          </div>

          {/* Cell */}
          <div className="p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider">Role of</span>
              <span className="text-white font-mono text-xs font-bold">{actorId}</span>
            </div>
            <div className="text-slate-300 text-xs mb-2">{actor?.name ?? actorId}</div>
            <div className="flex flex-wrap gap-1.5">
              {roles.length === 0 && cell?.disputed && (
                <RoleChip role="⚠" label="Disputed — no clean role" />
              )}
              {roles.length === 0 && cell?.unknown && (
                <RoleChip role="?" label="Unknown" />
              )}
              {roles.map(r => (
                <RoleChip key={r} role={r} label={ROLE_STYLE[r]?.label ?? r} disputed={cell.disputed} />
              ))}
            </div>
            {cell?.note && (
              <div className="mt-2 text-[11px] text-slate-400 italic">"{cell.note}"</div>
            )}
          </div>

          {/* Rich actor metadata (only if available — i.e. graph actors) */}
          {actor?.rich && (
            <details className="rounded-md overflow-hidden" open>
              <summary
                className="cursor-pointer text-slate-500 text-[10px] uppercase tracking-wider px-3 py-2 hover:text-slate-300 select-none"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                About {actor.rich.label || actor.name}
                {actor.rich.keyPerson && (
                  <span className="text-slate-600 normal-case tracking-normal ml-2">
                    · {actor.rich.keyPerson.name}
                  </span>
                )}
              </summary>
              <div className="p-3 space-y-2.5 text-[11px] leading-relaxed">
                {actor.rich.role && (
                  <p className="text-slate-300">{actor.rich.role}</p>
                )}
                {!!actor.rich.leverage?.length && (
                  <RichList title="Leverage" items={actor.rich.leverage} color="#86EFAC" />
                )}
                {!!actor.rich.dependencies?.length && (
                  <RichList title="Dependencies" items={actor.rich.dependencies} color="#93C5FD" />
                )}
                {!!actor.rich.fears?.length && (
                  <RichList title="Fears" items={actor.rich.fears} color="#FCA5A5" />
                )}
                {!!actor.rich.stats?.length && (
                  <div>
                    <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Stats</div>
                    <ul className="space-y-0.5">
                      {actor.rich.stats.map((s, i) => (
                        <li key={i} className="text-slate-400">
                          <span className="text-slate-500">{s.label}:</span>{' '}
                          <span className="text-slate-200 font-medium">{s.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {actor.rich.quote && (
                  <div className="border-l-2 pl-2.5 py-1" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                    <Quote size={10} className="inline text-slate-600 mr-1" />
                    <span className="text-slate-300 italic">{actor.rich.quote}</span>
                    {actor.rich.quoteSource && (
                      <div className="text-slate-600 text-[10px] mt-1">
                        — {actor.rich.quoteSource}
                        {actor.rich.quoteUrl && (
                          <a href={actor.rich.quoteUrl} target="_blank" rel="noreferrer"
                            className="ml-1 text-slate-500 hover:text-blue-400">
                            <ExternalLink size={9} className="inline" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Row note */}
          {activity.note && (
            <div>
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Row note</div>
              <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                {activity.note}
              </p>
            </div>
          )}

          {/* Edges between this actor and other actors on the same activity */}
          {relatedEdges.length > 0 && (
            <div>
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">
                Edges that implement this ({relatedEdges.length})
              </div>
              <ul className="space-y-2">
                {relatedEdges.slice(0, 10).map((e, i) => {
                  const color = EDGE_CATEGORY_COLORS[e.category] || '#64748B'
                  const label = e.graph?.label || e.type
                  const note  = e.graph?.narrativeNote || e.systemNote
                  return (
                    <li key={i} className="text-[11px] leading-snug">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold"
                          style={{ background: `${color}1F`, color, border: `1px solid ${color}40` }}
                        >
                          {e.category}
                        </span>
                        <span className="font-mono text-slate-300 text-[10px]">{e.from}</span>
                        <span className="text-slate-500">→</span>
                        <span className="font-mono text-slate-300 text-[10px]">{e.to}</span>
                      </div>
                      <div className="text-slate-300 mt-0.5">{label}</div>
                      {note && <div className="text-slate-500 text-[10px] mt-0.5">{note}</div>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* All actors on this activity */}
          <div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">
              All actors on this activity
            </div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(activity.raci).map(([id, c]) => {
                const r = (c.role ?? '').split(',').filter(Boolean)
                return (
                  <div key={id} className="text-[10px] flex items-center gap-1.5 leading-tight">
                    <span className="font-mono text-slate-400 w-12 truncate">{id}</span>
                    {c.disputed && <span style={{ color: '#F59E0B' }}>⚠</span>}
                    {r.map(rr => (
                      <span key={rr}
                        className="font-bold"
                        style={{ color: ROLE_STYLE[rr]?.fg }}
                      >{rr}</span>
                    ))}
                    {!r.length && c.unknown && <span style={{ color: '#94A3B8' }}>?</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Source */}
          <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1"
            >
              {activity.source}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

function Tag({ children }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded font-mono uppercase tracking-wide"
      style={{
        background: 'rgba(255,255,255,0.04)',
        color: '#94A3B8',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </span>
  )
}

function RoleChip({ role, label, disputed }) {
  const style = ROLE_STYLE[role] || { bg: 'rgba(245,158,11,0.18)', fg: '#FCD34D', border: '#F59E0B' }
  return (
    <span
      className="px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1.5"
      style={{ background: style.bg, color: style.fg, border: `1px solid ${disputed ? '#F59E0B' : style.border}` }}
    >
      <span className="font-mono">{role}</span>
      <span className="font-medium opacity-80">{label}</span>
    </span>
  )
}

function RichList({ title, items, color }) {
  return (
    <div>
      <div className="text-slate-500 text-[9px] uppercase tracking-wider mb-1" style={{ color }}>
        {title}
      </div>
      <ul className="space-y-0.5 list-disc pl-4">
        {items.map((it, i) => (
          <li key={i} className="text-slate-300">{it}</li>
        ))}
      </ul>
    </div>
  )
}
