import { useMemo, useState } from 'react'
import { formatCLP } from '../utils/format.js'

// ────────────────────────────────────────────────────────────────────────────
// DonationForm
// - Elige TIPO (ladrillo / ventana / techo / panel) en vez de pieza específica.
// - Muestra en vivo el % aportado y cuánto falta para completar UNA pieza.
// - Acepta cualquier monto: el sistema asigna a la próxima pieza disponible.
// ────────────────────────────────────────────────────────────────────────────

export default function DonationForm({
  tiers,
  parts,
  selectedTierId,
  preferredPartId,
  onSelectTier,
  onSubmit,
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Solo mostrar tiers que tengan piezas reales en el edificio actual
  const availableTiers = useMemo(
    () =>
      tiers.filter((t) =>
        parts.some((p) => p.tier === t.id && !p.isPreviewOnly)
      ),
    [tiers, parts]
  )

  const tierStats = useMemo(() => {
    const map = new Map()
    availableTiers.forEach((t) => {
      const tierParts = parts.filter(
        (p) => p.tier === t.id && !p.isPreviewOnly
      )
      const next = tierParts.find((p) => p.fundedPercent < 100)
      const completed = tierParts.filter((p) => p.fundedPercent >= 100).length
      map.set(t.id, {
        tier: t,
        total: tierParts.length,
        completed,
        next,
        soldOut: !next,
      })
    })
    return map
  }, [availableTiers, parts])

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || null
  const selectedStats = selectedTier ? tierStats.get(selectedTier.id) : null
  // Si el usuario clickeó una pieza específica (preferredPartId), esa es la
  // pieza target. Si no, la primera disponible del tier.
  const preferredPart = useMemo(() => {
    if (!preferredPartId || !selectedTier) return null
    return parts.find(
      (p) =>
        p.id === preferredPartId &&
        p.tier === selectedTier.id &&
        p.fundedPercent < 100 &&
        !p.isPreviewOnly
    )
  }, [preferredPartId, selectedTier, parts])
  const nextPart = preferredPart || selectedStats?.next || null

  const remainingForPart = nextPart
    ? nextPart.price - nextPart.fundedAmount
    : 0

  // El monto NO se autorrellena — parte en blanco para que el donante lo edite.

  // % en vivo (sobre el costo TOTAL de UNA pieza del tipo)
  const numericAmount = Number(amount) || 0
  // Porcentaje REAL — puede ser > 100% si el aporte supera el costo de una pieza
  const livePercent = selectedTier
    ? Math.round((numericAmount / selectedTier.price) * 100)
    : 0
  // Para la barra visual capeada a 100%
  const barPercent = Math.min(100, livePercent)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!selectedTier || !nextPart) return
    if (numericAmount <= 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        tierId: selectedTier.id,
        name,
        message,
        amount: numericAmount,
      })

      setSuccess({
        name: name || 'Anónimo',
        tierTitle: selectedTier.title,
        partName: nextPart.name,
        percentOfPart: Math.min(
          100,
          Math.round((numericAmount / nextPart.price) * 100)
        ),
      })
      setName('')
      setMessage('')
      setAmount('')
      setTimeout(() => setSuccess(null), 6000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="tp-card p-6 sm:p-8 space-y-6">
      {success && (
        <div className="tp-pop rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4">
          <p className="font-semibold">¡Gracias, {success.name}! 🎉</p>
          <p className="text-sm mt-1">
            Aportaste <strong>{success.percentOfPart}%</strong> de una{' '}
            <strong>{success.tierTitle.toLowerCase()}</strong>. Tu nombre quedó
            en {success.partName} y entra al libro de constructores.
          </p>
        </div>
      )}

      {/* PASO 1 · Tipo */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
          1. ¿Qué quieres aportar?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {availableTiers.map((t) => {
            const stats = tierStats.get(t.id)
            const active = selectedTierId === t.id
            const soldOut = stats?.soldOut
            return (
              <button
                key={t.id}
                type="button"
                disabled={soldOut}
                onClick={() => onSelectTier(t.id)}
                className={`group rounded-xl border p-3 text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  active
                    ? 'border-tp-red bg-tp-red/5 shadow-tp-soft'
                    : 'border-stone-200 bg-white hover:border-tp-blue/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-white text-base ${t.color}`}
                  >
                    {t.badge}
                  </span>
                  <span className="font-display font-bold text-sm text-tp-blue-dark">
                    {t.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {soldOut
                    ? '✓ Todas completas'
                    : `${stats.completed}/${stats.total} listas`}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* PASO 2 · Monto */}
      {selectedTier && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            2. ¿Cuánto quieres aportar?
          </p>

          {nextPart && (
            <div className="rounded-xl bg-tp-cream border border-stone-200 p-4">
              <p className="text-xs text-slate-500">
                Tu aporte irá a{' '}
                <strong className="text-tp-blue-dark">
                  {nextPart.name}
                </strong>
                .
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ya lleva{' '}
                <strong>
                  {Math.round(nextPart.fundedPercent)}% (
                  {formatCLP(Math.min(nextPart.fundedAmount, nextPart.price))})
                </strong>
                . Falta {formatCLP(remainingForPart)} para completarla.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <input
              type="number"
              min={500}
              step={500}
              className="tp-input text-2xl font-bold font-display text-tp-blue-dark"
              placeholder={String(selectedTier.price)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex gap-2 items-center">
              {[0.1, 0.25, 0.5, 1].map((frac) => (
                <button
                  key={frac}
                  type="button"
                  onClick={() =>
                    setAmount(String(Math.round(selectedTier.price * frac)))
                  }
                  className="text-xs px-2.5 py-2 rounded-lg border border-stone-300 bg-white hover:border-tp-blue/50 text-slate-600 font-semibold"
                >
                  {Math.round(frac * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview del % en vivo */}
          <div className="rounded-xl bg-tp-blue/5 border border-tp-blue/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-tp-blue font-semibold uppercase tracking-wider">
                  Tu aporte
                </p>
                <p className="font-display text-3xl font-extrabold text-tp-red mt-1">
                  {livePercent}%{' '}
                  <span className="text-base font-semibold text-tp-blue-dark">
                    de un/a {selectedTier.title.toLowerCase()}
                  </span>
                </p>
                {livePercent > 100 && (
                  <p className="text-xs text-slate-600 mt-1">
                    Cubres{' '}
                    <strong>
                      {Math.floor(numericAmount / selectedTier.price)}{' '}
                      {selectedTier.title.toLowerCase()}
                      {Math.floor(numericAmount / selectedTier.price) === 1
                        ? ''
                        : 'es'}
                    </strong>{' '}
                    {numericAmount % selectedTier.price > 0 && (
                      <>
                        + {Math.round(
                          ((numericAmount % selectedTier.price) /
                            selectedTier.price) *
                            100
                        )}
                        % de la siguiente
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Costo de uno</p>
                <p className="font-display font-bold text-tp-blue-dark text-lg">
                  {formatCLP(selectedTier.price)}
                </p>
              </div>
            </div>
            {/* Barra visual (capeada a 100% para no romper layout) */}
            <div className="mt-3 h-3 w-full rounded-full bg-white overflow-hidden border border-tp-blue/20">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  livePercent > 100
                    ? 'bg-gradient-to-r from-tp-red to-emerald-500'
                    : 'bg-tp-red'
                }`}
                style={{ width: `${barPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PASO 3 · Datos */}
      {selectedTier && (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            3. Tus datos
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="tp-label" htmlFor="donor-name">
                Tu nombre{' '}
                <span className="text-slate-400 font-normal text-xs">
                  (dejar en blanco para anónimo)
                </span>
              </label>
              <input
                id="donor-name"
                type="text"
                className="tp-input"
                placeholder="Ej: María González"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className="tp-label" htmlFor="donor-message">
                Mensaje (opcional)
              </label>
              <input
                id="donor-message"
                type="text"
                className="tp-input"
                placeholder="Una frase para el libro"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={120}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedTier || !nextPart || numericAmount <= 0}
        className="tp-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {submitting
          ? 'Registrando aporte…'
          : !selectedTier
            ? 'Elige qué quieres aportar'
            : !nextPart
              ? 'Todas las piezas de este tipo ya están completas'
              : `Registrar aporte de ${formatCLP(numericAmount || 0)} (${livePercent}%)`}
      </button>

    </form>
  )
}
