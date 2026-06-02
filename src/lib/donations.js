import { supabase } from './supabase.js'

// ────────────────────────────────────────────────────────────────────────────
// Versión Consejo: una sola capilla. Cada donación queda taggeada con el
// miembro del Consejo al que va dirigida (zone_id = nombre del miembro).
// fetchDonations y subscribeNewDonations devuelven TODAS las donaciones
// (no filtran por zone_id) — todas suman al total de la capilla.
// ────────────────────────────────────────────────────────────────────────────

function rowToDonor(row) {
  return {
    id: row.id,
    zoneId: row.zone_id, // nombre del miembro del Consejo
    partId: row.part_id,
    name: row.name,
    message: row.message || '',
    amount: row.amount,
    timestamp: row.created_at,
    isCompany: !!row.is_company,
    logoDataUrl: row.logo_url || null,
    receiptUrl: row.receipt_url || null,
    transferFirstName: row.transfer_first_name || null,
    transferLastName: row.transfer_last_name || null,
    transferRut: row.transfer_rut || null,
  }
}

export async function fetchDonations(_zoneId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[donations] fetch error:', error)
    return []
  }
  return (data || []).map(rowToDonor)
}

export function subscribeNewDonations(_zoneId, onInsert) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('donations-consejo-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'donations' },
      (payload) => {
        try {
          onInsert(rowToDonor(payload.new))
        } catch (e) {
          console.error('[donations] realtime callback error:', e)
        }
      }
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function uploadReceipt(file) {
  if (!supabase || !file) return null
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const rand = Math.random().toString(36).slice(2, 10)
  const path = `comp-${Date.now()}-${rand}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('comprobantes')
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadError) {
    console.error('[donations] upload receipt error:', uploadError)
    throw uploadError
  }
  const { data } = supabase.storage.from('comprobantes').getPublicUrl(path)
  return data.publicUrl
}

export async function insertDonation(zoneId, donation) {
  if (!supabase) throw new Error('Supabase no está configurado')

  const id = `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const row = {
    id,
    zone_id: zoneId || 'capilla',
    part_id: donation.partId,
    name: donation.name?.trim() || (donation.isCompany ? 'Empresa' : 'Anónimo'),
    message: donation.message?.trim() || '',
    amount: Number(donation.amount) || 0,
    is_company: !!donation.isCompany,
    logo_url: donation.logoUrl || null,
    receipt_url: donation.receiptUrl || null,
    transfer_first_name: donation.transferFirstName?.trim() || null,
    transfer_last_name: donation.transferLastName?.trim() || null,
    transfer_rut: donation.transferRut?.trim() || null,
  }
  const { data, error } = await supabase
    .from('donations')
    .insert(row)
    .select()
    .single()
  if (error) {
    console.error('[donations] insert error:', error)
    throw error
  }
  return rowToDonor(data)
}
