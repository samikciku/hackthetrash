import { ROLE_STYLE } from '../lib/raci'

// One R/A/C/I cell in the matrix.
// cell shape: { role: "A,R", disputed: bool, unknown: bool, note: string|null }
export default function MatrixCell({ cell, onClick, isHovered, isSelected }) {
  if (!cell) {
    return (
      <td
        onClick={onClick}
        className="text-center align-middle border-r border-slate-800/60"
        style={{ minWidth: 36, height: 28, color: '#334155', cursor: 'pointer' }}
      >
        <span className="text-[10px]">·</span>
      </td>
    )
  }

  const roles = (cell.role ?? '').split(',').filter(Boolean)
  const primary = roles[0] || (cell.disputed ? 'A' : (cell.unknown ? 'C' : 'C'))
  const style = ROLE_STYLE[primary] || ROLE_STYLE.C
  const isDual = roles.length > 1

  return (
    <td
      onClick={onClick}
      title={cell.note || roles.join(',')}
      className="text-center align-middle border-r border-slate-800/60 transition-colors"
      style={{
        minWidth: 36,
        height: 28,
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(255,255,255,0.08)'
          : isHovered
            ? 'rgba(255,255,255,0.03)'
            : 'transparent',
      }}
    >
      <span
        className="inline-flex items-center justify-center font-bold text-[10px] tracking-wider"
        style={{
          minWidth: 22, padding: '2px 5px', borderRadius: 4,
          background: style.bg,
          color: style.fg,
          border: `1px solid ${cell.disputed ? '#F59E0B' : (cell.unknown ? '#94A3B8' : style.border)}`,
          borderStyle: cell.unknown ? 'dashed' : 'solid',
          boxShadow: cell.disputed ? 'inset 0 0 0 1px rgba(245, 158, 11, 0.4)' : 'none',
        }}
      >
        {cell.disputed && <span style={{ color: '#F59E0B', marginRight: 2 }}>⚠</span>}
        {roles.length ? roles.join(',') : (cell.disputed ? '·' : '?')}
        {cell.unknown && !cell.disputed && roles.length === 0 ? '?' : ''}
        {isDual && false /* the comma separator already shows it */}
      </span>
    </td>
  )
}
