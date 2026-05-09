import { useState } from 'react'
import { levers } from '../data/levers'
import { TIER_COLORS } from '../data/nodes'
import { EDGE_COLORS } from '../data/edges'

const TIERS = [
  { key: 'operational', label: 'Operational' },
  { key: 'municipal',   label: 'Municipal'   },
  { key: 'national',    label: 'National'    },
  { key: 'citizens',    label: 'Citizens'    },
  { key: 'informal',    label: 'Informal'    },
  { key: 'external',    label: 'External'    },
  { key: 'endpoint',    label: 'Physical'    },
  { key: 'blocked',     label: 'Blocked'     },
]

const EDGE_LEGEND = [
  { key: 'money',       label: 'Money flow',  dash: null    },
  { key: 'authority',   label: 'Authority',    dash: '6 3'   },
  { key: 'political',   label: 'Political',    dash: '3 3'   },
  { key: 'oversight',   label: 'Oversight',    dash: '8 4'   },
  { key: 'operational', label: 'Operational',  dash: null    },
]

export default function LeftSidebar({ open, activeLeverId, activeLever, onToggle }) {
  const [legendOpen, setLegendOpen] = useState(false)

  return (
    /* Outer shell — width animates open/closed */
    <aside
      className="shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
      style={{
        width: open ? 288 : 0,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        background: '#0A0D16',
      }}
    >
      {/* Inner wrapper — fixed 288px so content doesn't reflow during animation */}
      <div className="flex flex-col h-full overflow-hidden" style={{ minWidth: 288, width: 288 }}>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">

          {/* ── LEGEND ────────────────────────────────────────────────────── */}
          <section className="px-4 pt-5">
            <button
              className="w-full flex items-center justify-between group mb-0.5"
              onClick={() => setLegendOpen((v) => !v)}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 group-hover:text-slate-400 transition-colors">
                Legend
              </span>
              <span
                className="text-slate-700 text-[10px] transition-transform duration-150"
                style={{ transform: legendOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▾
              </span>
            </button>

            <div
              className="overflow-hidden transition-[max-height,opacity] duration-200"
              style={{ maxHeight: legendOpen ? 400 : 0, opacity: legendOpen ? 1 : 0 }}
            >
              <div className="pt-3 pb-4 space-y-4">
                {/* Node tiers grid */}
                <div>
                  <p className="text-[9px] uppercase tracking-[0.1em] text-slate-700 mb-2.5">Node tiers</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {TIERS.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: TIER_COLORS[key] }}
                        />
                        <span className="text-slate-400 text-[11px]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edge types */}
                <div>
                  <p className="text-[9px] uppercase tracking-[0.1em] text-slate-700 mb-2.5">Edge types</p>
                  <div className="space-y-2">
                    {EDGE_LEGEND.map(({ key, label, dash }) => (
                      <div key={key} className="flex items-center gap-2">
                        <svg width="20" height="8" className="shrink-0">
                          <line
                            x1="0" y1="4" x2="20" y2="4"
                            stroke={EDGE_COLORS[key] ?? '#64748B'}
                            strokeWidth="1.5"
                            strokeDasharray={dash ?? undefined}
                          />
                        </svg>
                        <span className="text-slate-400 text-[11px]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="mx-4 mt-1 mb-0" style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

          {/* ── SCENARIOS ─────────────────────────────────────────────────── */}
          <section className="px-4 pt-4 pb-6">
            <div className="mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 mb-2">
                Scenarios
              </h2>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Activate a scenario to see how the system responds to each pressure point.
              </p>
            </div>

            <div className="space-y-2">
              {levers.map((lever) => {
                const isActive  = activeLeverId === lever.id
                const isHistory = !!lever.historical

                /* ── per-card border/background ── */
                const cardStyle = isActive
                  ? isHistory
                    ? {
                        background:   'rgba(245,158,11,0.07)',
                        borderColor:  'rgba(245,158,11,0.35)',
                        borderLeftColor: '#F59E0B',
                        borderLeftWidth: 2,
                      }
                    : {
                        background:   'rgba(255,255,255,0.06)',
                        borderColor:  'rgba(255,255,255,0.18)',
                        borderLeftColor: '#94A3B8',
                        borderLeftWidth: 2,
                      }
                  : {
                      background:   'rgba(255,255,255,0.02)',
                      borderColor:  'rgba(255,255,255,0.05)',
                    }

                return (
                  <button
                    key={lever.id}
                    onClick={() => onToggle(lever.id)}
                    className="w-full text-left rounded-xl border transition-all duration-150 hover:border-white/10 hover:bg-white/[0.04]"
                    style={cardStyle}
                  >
                    {/* Card header */}
                    <div className="px-3.5 pt-3 pb-2">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[15px] leading-none shrink-0">{lever.emoji}</span>
                          <span
                            className={`text-[12px] font-semibold leading-snug ${
                              isActive ? 'text-white' : 'text-slate-300'
                            }`}
                          >
                            {lever.title}
                          </span>
                        </div>

                        {isHistory && (
                          <span
                            className="shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm mt-0.5"
                            style={{
                              background: isActive
                                ? 'rgba(245,158,11,0.25)'
                                : 'rgba(245,158,11,0.1)',
                              color: '#FDE68A',
                            }}
                          >
                            REPLAY
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-[11px] leading-relaxed line-clamp-2 ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {lever.description}
                      </p>
                    </div>

                    {/* Expanded context when active */}
                    {isActive && (
                      <div
                        className="px-3.5 pb-3 pt-2.5 border-t"
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                      >
                        {isHistory && (
                          <p
                            className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: '#F59E0B' }}
                          >
                            📼 {lever.historicalDate}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 leading-relaxed">{lever.context}</p>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggle(lever.id)
                          }}
                          className="mt-3 text-[10px] text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2"
                        >
                          Clear scenario
                        </button>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tap-to-deselect hint when nothing is active */}
            {!activeLeverId && (
              <p className="mt-4 text-center text-[10px] text-slate-700">
                Click a node on the map to inspect it
              </p>
            )}
          </section>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-4 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-[10px] text-slate-700">Trash, Please hackathon</p>
          <p className="text-[10px] text-slate-700">May 2026</p>
        </div>
      </div>
    </aside>
  )
}
