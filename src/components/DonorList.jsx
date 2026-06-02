import { formatCLP } from '../utils/format.js'

export default function DonorList({ donors, parts, limit = 10 }) {
  const sorted = [...donors].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )
  const shown = sorted.slice(0, limit)
  const partsById = new Map(parts.map((p) => [p.id, p]))

  if (!shown.length) {
    return (
      <div className="tp-card p-6 text-center text-slate-500">
        Todavía no hay donantes. ¡Sé el primero en aportar!
      </div>
    )
  }

  return (
    <ul className="tp-card divide-y divide-stone-200 overflow-hidden">
      {shown.map((d) => {
        const part = partsById.get(d.partId)
        const pct = part
          ? Math.min(100, Math.round((d.amount / part.price) * 100))
          : 0
        return (
          <li key={d.id} className="p-4 flex items-start gap-4">
            <Avatar name={d.name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="font-semibold text-tp-blue-dark truncate">
                  {d.name}
                </p>
                <p className="text-xs text-slate-500">
                  aportó {formatCLP(d.amount)}
                </p>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                <span className="text-tp-red font-semibold">{pct}%</span>{' '}
                de{' '}
                <span className="text-tp-blue-dark font-semibold">
                  {part?.name || d.partId}
                </span>
              </p>
              {d.message && (
                <p className="text-sm text-slate-500 italic mt-1.5 border-l-2 border-tp-blue/30 pl-2">
                  "{d.message}"
                </p>
              )}
            </div>
            <time
              className="text-xs text-slate-400 whitespace-nowrap"
              dateTime={d.timestamp}
            >
              {formatRelative(d.timestamp)}
            </time>
          </li>
        )
      })}
      {sorted.length > limit && (
        <li className="p-3 text-center text-xs text-slate-500 bg-tp-cream">
          + {sorted.length - limit} aportes más en el libro de constructores
        </li>
      )}
    </ul>
  )
}

function Avatar({ name }) {
  const initials = (name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
  const palette = [
    'bg-tp-red',
    'bg-tp-blue',
    'bg-tp-wood-dark',
    'bg-tp-earth-dark',
    'bg-tp-blue-dark',
    'bg-tp-zinc-dark',
  ]
  const hash = [...(name || 'A')].reduce((s, c) => s + c.charCodeAt(0), 0)
  const color = palette[hash % palette.length]
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0 ${color}`}
    >
      {initials || '🙌'}
    </span>
  )
}

function formatRelative(iso) {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const d = Math.floor(hr / 24)
  if (d < 30) return `hace ${d} d`
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
  })
}
