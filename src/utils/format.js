export const formatCLP = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)

export const formatNumber = (value) =>
  new Intl.NumberFormat('es-CL').format(value || 0)
