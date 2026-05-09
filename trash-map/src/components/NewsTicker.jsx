// NewsTicker — scrolling breaking-news strip that appears when a lever is active.
// Historical levers get amber "REPLAY" styling; others get red "BREAKING".

export default function NewsTicker({ lever }) {
  if (!lever) return null

  const isHistorical = !!lever.historical
  // Duplicate headlines for a seamless CSS loop (translateX -50% = one full set)
  const doubled = [...lever.headlines, ...lever.headlines]

  return (
    <div
      className="ticker-container shrink-0 overflow-hidden flex items-stretch"
      style={{
        height: 28,
        background: isHistorical ? '#451a03' : '#991b1b',
        borderBottom: `1px solid ${isHistorical ? '#78350f' : '#7f1d1d'}`,
      }}
    >
      {/* Left label */}
      <div
        className="shrink-0 flex items-center px-3 select-none"
        style={{ background: isHistorical ? '#78350f' : '#7f1d1d' }}
      >
        <span className="text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
          {isHistorical ? '📼 REPLAY' : '🔴 BREAKING'}
        </span>
      </div>

      {/* Scrolling track — overflow hidden is on the parent */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="ticker-track flex items-center gap-0 whitespace-nowrap">
          {doubled.map((headline, i) => (
            <span
              key={i}
              className="text-[11px] font-medium px-5 shrink-0"
              style={{ color: isHistorical ? '#fde68a' : '#fff1f2' }}
            >
              {headline}
              <span
                className="mx-4 opacity-40 text-[9px]"
                style={{ color: isHistorical ? '#f59e0b' : '#fca5a5' }}
              >
                ◆
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
