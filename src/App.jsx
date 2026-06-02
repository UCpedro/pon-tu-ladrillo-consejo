import { useEffect, useMemo, useRef, useState } from 'react'
import { donationPartsByBuilding, tiers } from './data/donationParts.js'
import { zones } from './data/zones.js'
import {
  fetchDonations,
  insertDonation,
  uploadReceipt,
  subscribeNewDonations,
} from './lib/donations.js'
import Hero from './components/Hero.jsx'
import ProgressPanel from './components/ProgressPanel.jsx'
import DonationTiers from './components/DonationTiers.jsx'
import DonorList from './components/DonorList.jsx'
import DonationForm from './components/DonationForm.jsx'
import TransferModal from './components/TransferModal.jsx'

export default function App() {
  // Versión Consejo: una sola capilla, sin zonas.
  const selectedZone = zones[0]
  const buildingType = selectedZone.building

  const [donors, setDonors] = useState([])
  const [selectedTierId, setSelectedTierId] = useState(null)
  const [preferredPartId, setPreferredPartId] = useState(null)
  const [flashPartId, setFlashPartId] = useState(null)
  const [pendingDonation, setPendingDonation] = useState(null)
  const formRef = useRef(null)

  const donationParts = useMemo(
    () =>
      donationPartsByBuilding[buildingType] ||
      donationPartsByBuilding.salon,
    [buildingType]
  )

  // Valor total de una capilla = suma de precios de todas las piezas reales.
  // Cuando las donaciones acumuladas llegan a este monto → capilla completa,
  // se "abre" una nueva que parte desde 0.
  const capillaValue = useMemo(
    () =>
      donationParts
        .filter((p) => !p.isPreviewOnly)
        .reduce((s, p) => s + (p.price || 0), 0),
    [donationParts]
  )

  // Cargar donaciones desde Supabase + suscribirse a nuevas en vivo
  useEffect(() => {
    let cancelled = false
    fetchDonations(selectedZone.id).then((data) => {
      if (!cancelled) setDonors(data)
    })
    const unsubscribe = subscribeNewDonations(selectedZone.id, (newDonor) => {
      setDonors((prev) =>
        prev.some((d) => d.id === newDonor.id) ? prev : [newDonor, ...prev]
      )
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [selectedZone.id])

  // Agrupa las donaciones por "capilla". Una capilla se considera completa
  // cuando la suma de sus donaciones llega a capillaValue. La siguiente
  // donación abre una nueva capilla que parte desde 0.
  const capillaState = useMemo(() => {
    const sorted = [...donors].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    const byCapilla = new Map([[0, []]])
    const sumByCapilla = new Map([[0, 0]])
    let currentIdx = 0
    for (const d of sorted) {
      if (
        capillaValue > 0 &&
        (sumByCapilla.get(currentIdx) || 0) >= capillaValue
      ) {
        currentIdx++
        byCapilla.set(currentIdx, [])
        sumByCapilla.set(currentIdx, 0)
      }
      byCapilla.get(currentIdx).push(d)
      sumByCapilla.set(
        currentIdx,
        (sumByCapilla.get(currentIdx) || 0) + (d.amount || 0)
      )
    }
    let completed = 0
    sumByCapilla.forEach((sum) => {
      if (capillaValue > 0 && sum >= capillaValue) completed++
    })
    // Si la última capilla está completa, la "en progreso" es la siguiente
    // (sin donaciones aún). Si no, es la última con donaciones.
    const lastSum = sumByCapilla.get(currentIdx) || 0
    const inProgressIdx =
      capillaValue > 0 && lastSum >= capillaValue ? currentIdx + 1 : currentIdx
    const currentDonors = byCapilla.get(inProgressIdx) || []
    const currentRaised = sumByCapilla.get(inProgressIdx) || 0
    const totalRaised = Array.from(sumByCapilla.values()).reduce(
      (s, v) => s + v,
      0
    )
    return {
      completedCapillas: completed,
      currentDonors,
      currentRaised,
      totalRaised,
      inProgressIdx,
    }
  }, [donors, capillaValue])

  const partsWithStatus = useMemo(() => {
    const donationsByPart = new Map()
    capillaState.currentDonors.forEach((d) => {
      if (!donationsByPart.has(d.partId)) donationsByPart.set(d.partId, [])
      donationsByPart.get(d.partId).push(d)
    })
    return donationParts.map((part) => {
      if (part.isPreviewOnly) {
        return {
          ...part,
          donations: [],
          donor: null,
          fundedAmount: part.price,
          cappedAmount: 0,
          fundedPercent: 100,
          donated: true,
        }
      }
      const partDonations = donationsByPart.get(part.id) || []
      const fundedAmount = partDonations.reduce(
        (s, d) => s + (d.amount || 0),
        0
      )
      const cappedAmount = Math.min(part.price, fundedAmount)
      const fundedPercent =
        part.price > 0 ? Math.min(100, (fundedAmount / part.price) * 100) : 0
      return {
        ...part,
        donations: partDonations,
        donor: partDonations[0] || null,
        fundedAmount,
        cappedAmount,
        fundedPercent,
        donated: fundedAmount >= part.price,
      }
    })
  }, [capillaState, donationParts])

  const stats = useMemo(() => {
    const realParts = partsWithStatus.filter((p) => !p.isPreviewOnly)
    const donatedParts = realParts.filter((p) => p.donated).length
    return {
      raised: capillaState.currentRaised,
      raisedTotal: capillaState.totalRaised,
      goal: capillaValue,
      donorsCount: donors.length,
      donatedParts,
      totalParts: realParts.length,
      percent:
        capillaValue > 0
          ? Math.min(
              100,
              Math.round((capillaState.currentRaised / capillaValue) * 100)
            )
          : 0,
      completedCapillas: capillaState.completedCapillas,
    }
  }, [donors, partsWithStatus, capillaState, capillaValue])

  const handleSelectTier = (tierId, opts = {}) => {
    setSelectedTierId(tierId)
    if (opts.scroll && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const findStartingPart = (
    tierId,
    { isCompany = false, preferredId = null } = {}
  ) => {
    if (preferredId) {
      const preferred = partsWithStatus.find(
        (p) =>
          p.id === preferredId &&
          p.tier === tierId &&
          p.fundedPercent < 100 &&
          !p.isPreviewOnly &&
          !(isCompany && p.excludeCompanyLogo)
      )
      if (preferred) return preferred
    }
    return partsWithStatus.find(
      (p) =>
        p.tier === tierId &&
        p.fundedPercent < 100 &&
        !p.isPreviewOnly &&
        !(isCompany && p.excludeCompanyLogo)
    )
  }

  const handleRegisterDonation = ({
    name,
    message,
    amount,
    tierId,
    isCompany,
    logoFile,
  }) => {
    return new Promise((resolve, reject) => {
      if (!tierId) {
        reject(new Error('Tier inválido'))
        return
      }
      const target = findStartingPart(tierId, {
        isCompany: !!isCompany,
        preferredId: preferredPartId,
      })
      if (!target) {
        reject(new Error('No hay piezas disponibles'))
        return
      }
      const numericAmount = Number(amount)
      if (!numericAmount || numericAmount <= 0) {
        reject(new Error('Monto inválido'))
        return
      }
      setPendingDonation({
        name,
        message,
        amount: numericAmount,
        isCompany: !!isCompany,
        logoFile: logoFile || null,
        targetPart: target,
        resolve,
        reject,
      })
    })
  }

  const planSpillover = (startPart, amount) => {
    const chunks = []
    let amountLeft = amount
    const sameTier = partsWithStatus.filter(
      (p) => p.tier === startPart.tier && !p.isPreviewOnly
    )
    const orderedParts = [
      startPart,
      ...sameTier.filter((p) => p.id !== startPart.id),
    ]
    for (const part of orderedParts) {
      if (amountLeft <= 0) break
      const fundedSoFar = part.fundedAmount || 0
      const remaining = Math.max(0, part.price - fundedSoFar)
      if (remaining <= 0) continue
      const take = Math.min(amountLeft, remaining)
      chunks.push({ partId: part.id, amount: take })
      amountLeft -= take
    }
    if (amountLeft > 0) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1].amount += amountLeft
      } else {
        chunks.push({ partId: startPart.id, amount: amountLeft })
      }
    }
    return chunks
  }

  const handleConfirmTransfer = async ({
    receiptFile,
    firstName,
    lastName,
    rut,
    recipient,
  }) => {
    const pd = pendingDonation
    if (!pd) return
    try {
      const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null

      const chunks = planSpillover(pd.targetPart, pd.amount)
      const savedAll = []
      const baseDonor = {
        name: pd.name,
        message: pd.message,
        isCompany: pd.isCompany,
        transferFirstName: firstName,
        transferLastName: lastName,
        transferRut: rut,
        receiptUrl,
      }

      // recipient (miembro del Consejo) se usa como zoneId — cada donación
      // queda taggeada con el miembro al que va dirigida.
      const zoneId = recipient || selectedZone.id

      for (const c of chunks) {
        const saved = await insertDonation(zoneId, {
          ...baseDonor,
          partId: c.partId,
          amount: c.amount,
        })
        savedAll.push(saved)
      }

      setDonors((prev) => [...savedAll, ...prev])

      setFlashPartId(pd.targetPart.id)
      setTimeout(() => {
        const el = document.getElementById('modelo')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      setTimeout(() => setFlashPartId(null), 5000)

      pd.resolve(savedAll[0])
      setPendingDonation(null)
      setPreferredPartId(null)
    } catch (err) {
      console.error('[App] No se pudo registrar la donación:', err)
      if (typeof window !== 'undefined') {
        window.alert('No se pudo registrar tu aporte. Intenta de nuevo.')
      }
      throw err
    }
  }

  const handleCancelTransfer = () => {
    if (pendingDonation) {
      pendingDonation.reject(new Error('Cancelado'))
      setPendingDonation(null)
      setPreferredPartId(null)
    }
  }

  const scrollToForm = () => {
    if (formRef.current)
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const scrollToTiers = () => {
    const el = document.getElementById('tiers')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen pb-20">
      <Header onDonateClick={scrollToForm} />

      <main className="space-y-24">
        <Hero
          selectedZone={selectedZone}
          buildingType={buildingType}
          stats={stats}
          parts={partsWithStatus}
          flashPartId={flashPartId}
          flashPart={
            flashPartId
              ? partsWithStatus.find((p) => p.id === flashPartId)
              : null
          }
          onDonateClick={scrollToForm}
          onViewParts={scrollToTiers}
          onPartClick={(part) => {
            setPreferredPartId(part.id)
            handleSelectTier(part.tier, { scroll: true })
          }}
        />

        <section className="tp-section">
          <ProgressPanel stats={stats} buildingType={buildingType} />
        </section>

        <section id="tiers" className="tp-section">
          <SectionHeader
            eyebrow="Categorías de aporte"
            title="Elige cómo quieres aportar"
            subtitle={
              <>
                Cada categoría tiene un costo total.{' '}
                <span className="text-tp-red font-semibold">
                  Puedes aportar la pieza entera o un porcentaje
                </span>{' '}
                — cada peso suma.
              </>
            }
          />
          <div className="mt-8">
            <DonationTiers
              tiers={tiers}
              parts={partsWithStatus}
              onPickTier={(tierId) => {
                setPreferredPartId(null)
                handleSelectTier(tierId, { scroll: true })
              }}
            />
          </div>
        </section>

        <section className="tp-section space-y-10">
          <div ref={formRef}>
            <SectionHeader
              eyebrow="Quiero aportar"
              title="Pon tu ladrillo"
              subtitle="Elige qué quieres aportar, ingresa el monto y tu nombre quedará marcado en el modelo."
              compact
            />
            <div className="mt-6">
              <DonationForm
                tiers={tiers}
                parts={partsWithStatus}
                selectedTierId={selectedTierId}
                preferredPartId={preferredPartId}
                onSelectTier={(tierId) => {
                  setPreferredPartId(null)
                  setSelectedTierId(tierId)
                }}
                onSubmit={handleRegisterDonation}
              />
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow="Últimos donantes"
              title="Quienes ya pusieron su ladrillo"
              compact
            />
            <div className="mt-6">
              <DonorList donors={donors} parts={partsWithStatus} limit={12} />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {pendingDonation && (
        <TransferModal
          donation={pendingDonation}
          onConfirm={handleConfirmTransfer}
          onCancel={handleCancelTransfer}
          buildingType={buildingType}
        />
      )}
    </div>
  )
}

function Header({ onDonateClick }) {
  return (
    <header className="tp-section flex items-center justify-between pt-2 pb-2 sm:pt-3 sm:pb-3">
      <a href="#" className="flex items-center gap-6">
        <img
          src="/logotp.png"
          alt="Trabajo País 2026"
          className="h-28 sm:h-36 w-auto"
        />
        <span className="hidden sm:block h-20 w-px bg-stone-300" />
        <span className="hidden sm:inline-flex flex-col leading-tight">
          <span className="text-sm uppercase tracking-[0.22em] text-slate-500 font-semibold">
            Campaña
          </span>
          <span className="font-display text-3xl sm:text-4xl font-extrabold text-tp-blue-dark mt-1">
            Pon tu ladrillo
          </span>
          <span className="inline-flex items-center gap-1.5 mt-1.5 text-tp-red text-sm font-bold uppercase tracking-[0.18em]">
            Trabajo País 2026
          </span>
        </span>
      </a>
      <div className="flex items-center gap-3">
        <button
          onClick={onDonateClick}
          className="tp-btn-primary text-lg py-3.5 px-7"
        >
          Quiero donar
        </button>
      </div>
    </header>
  )
}

function SectionHeader({ eyebrow, title, subtitle, compact }) {
  return (
    <div className={compact ? '' : 'max-w-2xl'}>
      <span className="tp-eyebrow">{eyebrow}</span>
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-tp-blue-dark mt-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-600 mt-3 text-base sm:text-lg">{subtitle}</p>
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer className="tp-section mt-24 border-t border-stone-200 pt-8 text-sm text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src="/logotp.png" alt="Trabajo País 2026" className="h-10 w-auto" />
        <p>
          Campaña <strong className="text-tp-blue-dark">Pon tu ladrillo</strong> ·{' '}
          <span className="text-tp-blue-dark font-semibold">Trabajo País 2026</span>
        </p>
      </div>
    </footer>
  )
}
