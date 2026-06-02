import { formatCLP } from '../utils/format.js'

export default function DonationTiers({ tiers, parts, onPickTier }) {
  // Solo mostrar tiers que tengan piezas reales en el edificio actual
  const availableTiers = tiers.filter((t) =>
    parts.some((p) => p.tier === t.id && !p.isPreviewOnly)
  )
  const stats = availableTiers.map((tier) => {
    const tierParts = parts.filter(
      (p) => p.tier === tier.id && !p.isPreviewOnly
    )
    const completed = tierParts.filter((p) => p.fundedPercent >= 100).length
    const totalRaised = tierParts.reduce(
      (s, p) => s + Math.min(p.fundedAmount, p.price),
      0
    )
    const totalGoal = tierParts.reduce((s, p) => s + p.price, 0)
    const percent =
      totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0
    return {
      ...tier,
      total: tierParts.length,
      completed,
      percent,
      soldOut: completed === tierParts.length && tierParts.length > 0,
    }
  })

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      {stats.map((tier) => {
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => !tier.soldOut && onPickTier(tier.id)}
            disabled={tier.soldOut}
            className={`group text-left tp-card p-6 transition hover:-translate-y-0.5 hover:shadow-tp-card disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
              tier.soldOut ? '' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-white text-xl shadow-tp-soft ${tier.color}`}
              >
                {tier.badge}
              </span>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  {tier.id}
                </p>
                <h3 className="font-display text-lg font-bold text-tp-blue-dark">
                  {tier.title}
                </h3>
              </div>
            </div>

            <p className="font-display text-2xl font-extrabold text-tp-red mt-4">
              {formatCLP(tier.price)}
            </p>
            <p className="text-[11px] text-slate-500">
              costo total de UNA pieza
            </p>

            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {tier.description}
            </p>

            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                <span>{tier.percent}% completado</span>
                <span>
                  {tier.completed}/{tier.total} piezas
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-tp-red rounded-full transition-all"
                  style={{ width: `${tier.percent}%` }}
                />
              </div>
            </div>

            {!tier.soldOut && (
              <span className="block text-tp-red text-xs font-semibold mt-3 opacity-0 group-hover:opacity-100 transition">
                Aportar →
              </span>
            )}
            {tier.soldOut && (
              <span className="block text-emerald-600 text-xs font-semibold mt-3">
                ✓ Todas completas
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
