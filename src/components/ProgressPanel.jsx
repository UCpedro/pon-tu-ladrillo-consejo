import { formatCLP, formatNumber } from '../utils/format.js'

export default function ProgressPanel({ stats, buildingType = 'salon' }) {
  const isCapilla = buildingType === 'capilla'
  const cards = [
    {
      label: isCapilla ? 'Capilla completada' : 'Salón completado',
      value: `${stats.percent}%`,
      sub: `${stats.donatedParts} de ${stats.totalParts} piezas`,
      accent: 'text-tp-red',
    },
    {
      label: 'Constructores',
      value: formatNumber(stats.donorsCount),
      sub: 'Personas que ya aportaron',
      accent: 'text-tp-blue',
    },
  ]

  return (
    <div className="tp-card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="tp-eyebrow">Progreso de la campaña</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-tp-blue-dark mt-2">
            Vamos en {stats.percent}% {isCapilla ? 'de la capilla' : 'del salón'}
          </h2>
        </div>
        <p className="text-sm text-slate-500 max-w-sm">
          Cada peso aportado mueve esta barra y enciende una pieza del modelo
          3D.
        </p>
      </div>

      <div className="mt-6">
        <div className="tp-progress-track">
          <div
            className="tp-progress-bar"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{formatCLP(stats.raised)}</span>
          <span>Meta: {formatCLP(stats.goal)}</span>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl bg-tp-cream p-4 border border-stone-200 min-w-0"
          >
            <dt className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              {c.label}
            </dt>
            <dd
              className={`font-display font-bold text-lg sm:text-xl lg:text-2xl mt-1 tracking-tight tabular-nums leading-tight break-all ${c.accent}`}
            >
              {c.value}
            </dd>
            <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </dl>
    </div>
  )
}
