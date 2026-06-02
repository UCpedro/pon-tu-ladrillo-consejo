import { useEffect, useState } from 'react'
import { formatCLP } from '../utils/format.js'

// Datos bancarios para la transferencia
const TRANSFER_DATA = {
  banco: 'Banco Itau',
  nombre: 'PUC',
  rut: '81.698.900-0',
  tipoCuenta: 'Cuenta Corriente',
  numeroCuenta: '231392483',
  correo: 'donaciones.uc@uc.cl',
}

// Texto exacto que se copia al portapapeles. NO modificar las etiquetas
// — los bancos esperan este formato para detectar los datos.
const TRANSFER_TEXT = `${TRANSFER_DATA.nombre}
${TRANSFER_DATA.correo}
RUT: ${TRANSFER_DATA.rut}
${TRANSFER_DATA.banco}
${TRANSFER_DATA.tipoCuenta}
${TRANSFER_DATA.numeroCuenta}`

const MAX_RECEIPT_BYTES = 3 * 1024 * 1024 // 3 MB

// Lista de personas a las que se puede dirigir el aporte (Consejo TP).
const RECIPIENTS = [
  'Martín Moreno',
  'Flori Vigil',
  'Clemente Arrieta',
  'Agu Cases',
  'Clemente Cisneros',
  'Javi Ebensperger',
  'Maca Poblete',
  'Jeremy Escalona',
  'Alfonso Besa',
  'Pedro Ruiz-Tagle',
  'Juan Diego Herrera',
  'Fede López',
  'Flopi Martínez',
  'Jesu Ledezma',
  'Agustín Sánchez',
  'Josefa Errázuriz',
  'Agu Soza',
  'Cristobal Correa',
  'Seba Novoa',
  'Fran Abumohor',
  'Agu Letelier',
  'Isi Cheyre',
]

export default function TransferModal({ donation, onConfirm, onCancel, buildingType = 'salon' }) {
  const [step, setStep] = useState(1) // 1 = datos transferencia, 2 = comprobante
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [rut, setRut] = useState('')
  const [recipient, setRecipient] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptError, setReceiptError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const canSubmit =
    !!receiptFile &&
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!rut.trim() &&
    !!recipient &&
    !submitting

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, submitting])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TRANSFER_TEXT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const handleFile = (file) => {
    if (!file) {
      setReceiptFile(null)
      setReceiptError(null)
      return
    }
    const ok =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    if (!ok) {
      setReceiptError('El archivo debe ser una imagen o PDF.')
      return
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setReceiptError(
        `El comprobante debe pesar menos de 3 MB (este pesa ${Math.round(
          file.size / 1024
        )} KB).`
      )
      return
    }
    setReceiptFile(file)
    setReceiptError(null)
  }

  const handleConfirm = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onConfirm({
        receiptFile,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        rut: rut.trim(),
        recipient,
      })
    } catch (e) {
      setSubmitting(false)
    }
  }

  const part = donation?.targetPart

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div
        className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !submitting) onCancel?.()
        }}
      >
        <div className="tp-card max-w-lg w-full p-5 sm:p-8 my-3 sm:my-6 tp-pop relative">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Cerrar"
          className="absolute top-3 right-3 h-9 w-9 rounded-full hover:bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ✕
        </button>

        <span className="tp-eyebrow">
          Paso {step} de 2
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-tp-blue-dark mt-1">
          {step === 1 ? 'Realiza tu transferencia' : 'Confirma tu aporte'}
        </h2>
        <p className="text-slate-600 text-sm mt-2">
          Aporte de{' '}
          <strong className="text-tp-red">
            {formatCLP(donation?.amount || 0)}
          </strong>{' '}
          {part && (
            <>
              · irá a <strong>{part.name}</strong>
            </>
          )}
        </p>

        {step === 1 && (
          <>
            <p className="text-sm text-slate-600 mt-4">
              Copia los datos, haz la transferencia desde tu banco y luego
              continúa al siguiente paso.
            </p>

            {/* Datos bancarios */}
            <div className="mt-4 rounded-xl bg-tp-cream border border-stone-200 p-4 space-y-2">
              <DataRow label="Nombre" value={TRANSFER_DATA.nombre} />
              <DataRow label="Correo" value={TRANSFER_DATA.correo} />
              <DataRow label="RUT" value={TRANSFER_DATA.rut} />
              <DataRow label="Banco" value={TRANSFER_DATA.banco} />
              <DataRow label="Tipo de cuenta" value={TRANSFER_DATA.tipoCuenta} />
              <DataRow label="N° de cuenta" value={TRANSFER_DATA.numeroCuenta} />
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`mt-3 w-full rounded-full px-4 py-2.5 text-sm font-bold transition ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-tp-blue text-white hover:bg-tp-blue-dark'
              }`}
            >
              {copied ? '✓ Datos copiados al portapapeles' : '📋 Copiar datos'}
            </button>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-full px-6 py-3 font-semibold text-slate-600 bg-white border border-stone-300 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 tp-btn-primary"
              >
                Siguiente paso →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-slate-600 mt-4">
              Ya hiciste la transferencia? Ingresa tus datos y sube el
              comprobante para registrar tu aporte.
            </p>

            {/* Datos del aportante */}
            <div className="mt-5 space-y-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Datos de quien transfiere
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="tp-label" htmlFor="transfer-first-name">
                    Nombre *
                  </label>
                  <input
                    id="transfer-first-name"
                    type="text"
                    className="tp-input"
                    placeholder="Ej: María"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={60}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="tp-label" htmlFor="transfer-last-name">
                    Apellido *
                  </label>
                  <input
                    id="transfer-last-name"
                    type="text"
                    className="tp-input"
                    placeholder="Ej: González"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={60}
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div>
                <label className="tp-label" htmlFor="transfer-rut">
                  RUT *
                </label>
                <input
                  id="transfer-rut"
                  type="text"
                  className="tp-input"
                  placeholder="12.345.678-9"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  maxLength={20}
                  inputMode="text"
                />
              </div>
              <div>
                <label className="tp-label" htmlFor="transfer-recipient">
                  Aporte dirigido a *
                </label>
                <select
                  id="transfer-recipient"
                  className="tp-input"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                >
                  <option value="">Selecciona un miembro del Consejo</option>
                  {RECIPIENTS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500">
                Estos datos los usamos solo para verificar la transferencia
                con el banco. No se muestran públicamente.
              </p>
            </div>

            {/* Comprobante */}
            <div className="mt-6">
              <label
                htmlFor="receipt-file"
                className="tp-label flex items-center gap-2"
              >
                Subir comprobante de transferencia *
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Imagen (PNG/JPG) o PDF, máximo 3 MB.
              </p>

              <label
                htmlFor="receipt-file"
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition ${
                  receiptFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-stone-300 bg-white hover:border-tp-blue/50 hover:bg-tp-blue/5'
                }`}
              >
                <input
                  id="receipt-file"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="sr-only"
                />
                {receiptFile ? (
                  <>
                    <span className="text-3xl">📄</span>
                    <p className="text-sm font-semibold text-emerald-700 text-center truncate max-w-full">
                      {receiptFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.round(receiptFile.size / 1024)} KB · Click para
                      cambiar
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl text-slate-400">📤</span>
                    <p className="text-sm font-semibold text-tp-blue-dark">
                      Subir comprobante
                    </p>
                    <p className="text-xs text-slate-500">
                      Click para seleccionar archivo
                    </p>
                  </>
                )}
              </label>
              {receiptError && (
                <p className="text-xs text-tp-red mt-2">{receiptError}</p>
              )}
            </div>

            {/* Botones */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex-1 rounded-full px-6 py-3 font-semibold text-slate-600 bg-white border border-stone-300 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Volver
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="flex-1 tp-btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting
                  ? 'Enviando aporte…'
                  : !firstName.trim() || !lastName.trim() || !rut.trim()
                    ? 'Completa nombre, apellido y RUT'
                    : !recipient
                      ? 'Selecciona a quién va dirigido'
                      : !receiptFile
                        ? 'Sube el comprobante'
                        : 'Confirmar aporte'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-4">
              Tu aporte queda registrado cuando subas el comprobante. La
              organización lo verificará y aparecerá en el modelo {buildingType === 'capilla' ? 'de la capilla' : 'del salón'}.
            </p>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-tp-blue-dark break-all">{value}</span>
    </div>
  )
}
