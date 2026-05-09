import { motion } from 'motion/react'
import { X, ExternalLink } from 'lucide-react'
import { actorsById, ROLE_STYLE, edgesBetween } from '../lib/raci'

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
                Related edges from system map ({relatedEdges.length})
              </div>
              <ul className="space-y-1.5">
                {relatedEdges.slice(0, 8).map((e, i) => (
                  <li key={i} className="text-[11px] text-slate-400 leading-snug">
                    <span className="font-mono text-slate-300">{e.from}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="font-mono text-slate-300">{e.to}</span>
                    <span className="text-amber-300 mx-1.5">{e.type}</span>
                    {e.note && <span className="text-slate-500">— {e.note}</span>}
                  </li>
                ))}
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
