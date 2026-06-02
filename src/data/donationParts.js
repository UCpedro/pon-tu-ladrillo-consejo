// ────────────────────────────────────────────────────────────────────────────
// Piezas donables — soporta DOS tipos de edificio: 'salon' y 'capilla'
// ────────────────────────────────────────────────────────────────────────────

const WOOD = '#c9a06a'
const ZINC = '#a9b3bd'
const GLASS = '#a9c9ec'
const DOOR_COLOR = '#7b2d1f'
const VARNISH = '#f3eee2'
const CARDBOARD = '#b07a45'
const INSULATION = '#d6c485'

// Categorías de aporte (mismas para ambos edificios)
export const tiers = [
  {
    id: 'ventana',
    title: 'Ventana',
    price: 20000,
    color: 'bg-tp-blue',
    badge: '🪟',
    description: 'Cada ventana deja entrar la luz al edificio.',
  },
  {
    id: 'techo',
    title: 'Pieza techo',
    price: 100000,
    color: 'bg-tp-zinc-dark',
    badge: '🏠',
    description: 'Plancha de zinc del techo a dos aguas.',
  },
  {
    id: 'panel',
    title: 'Panel',
    price: 200000,
    color: 'bg-tp-earth-dark',
    badge: '🪵',
    description: 'Paneles estructurales de los muros del edificio.',
  },
  {
    id: 'puerta',
    title: 'Puerta',
    price: 60000,
    color: 'bg-tp-red-dark',
    badge: '🚪',
    description: 'La puerta principal de doble hoja.',
  },
  {
    id: 'barniz',
    title: 'Lata de barniz',
    price: 10000,
    color: 'bg-amber-700',
    badge: '🪣',
    description: 'Una lata de barniz para terminar la madera.',
  },
  {
    id: 'clavos',
    title: 'Caja de clavos',
    price: 10000,
    color: 'bg-stone-700',
    badge: '📦',
    description: 'Una caja de clavos para fijar los tablones.',
  },
  {
    id: 'aislante',
    title: 'Rollo de aislante',
    price: 20000,
    color: 'bg-yellow-700',
    badge: '🧶',
    description: 'Un rollo de aislante térmico para los muros.',
  },
  {
    id: 'cruz',
    title: 'Cruz',
    price: 50000,
    color: 'bg-amber-900',
    badge: '✝',
    description: 'La cruz de madera de la capilla, montada en la fachada.',
  },
]

// Ángulos de techo
const ROOF_TILT_SALON = Math.atan(2 / 3) // ~33.7°
const ROOF_TILT_CAPILLA = Math.atan(2.9 / 2.5) // ~49.2°

// ════════════════════════════════════════════════════════════════════════════
// CONSUMIBLES — factories genéricas que reciben sus posiciones por afuera
// ════════════════════════════════════════════════════════════════════════════

function makeVarnishCan(i, position, rot = 0, isPreview = false) {
  return {
    id: `B${i + 1}`,
    name: `Lata de barniz #${i + 1}`,
    description: 'Lata de barniz para terminar la madera.',
    tier: 'barniz',
    price: 10000,
    shape: 'paint-can',
    position,
    rotation: [0, rot, 0],
    size: [0.48, 0.6, 0.48],
    color: VARNISH,
    ...(isPreview ? { isPreviewOnly: true } : {}),
  }
}

function makeNailBox(i, position, rot = 0, isPreview = false) {
  return {
    id: `N${i + 1}`,
    name: `Caja de clavos #${i + 1}`,
    description: 'Caja de clavos para fijar los tablones.',
    tier: 'clavos',
    price: 10000,
    shape: 'nail-box',
    position,
    rotation: [0, rot, 0],
    size: [0.64, 0.4, 0.48],
    color: CARDBOARD,
    ...(isPreview ? { isPreviewOnly: true } : {}),
  }
}

function makeInsulationRoll(i, position, rotZ = 0, isPreview = false) {
  return {
    id: `R${i + 1}`,
    name: `Rollo de aislante #${i + 1}`,
    description: 'Rollo de aislante térmico.',
    tier: 'aislante',
    price: 20000,
    shape: 'insulation-roll',
    position,
    rotation: [Math.PI / 2, 0, rotZ],
    size: [0.4, 0.8, 0.4],
    color: INSULATION,
    ...(isPreview ? { isPreviewOnly: true } : {}),
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SALÓN — modelo grande (10 × 6 m). Lo que ya teníamos.
// ════════════════════════════════════════════════════════════════════════════

function buildSalonStructural() {
  const parts = []
  const PANEL_W = 3.33
  const PANEL_H = 3
  const PANEL_T = 0.15
  const HALF_W = PANEL_W / 2
  const HALF_OFFSET = PANEL_W / 4

  const bigBases = [
    { base: 'P1', label: 'Frontal izquierdo', position: [-3.33, 1.6, 3], hasWindow: true },
    { base: 'P2', label: 'Frontal centro (entrada)', position: [0, 1.6, 3], excludeCompanyLogo: true },
    { base: 'P3', label: 'Frontal derecho', position: [3.33, 1.6, 3], hasWindow: true },
    { base: 'P4', label: 'Trasero izquierdo', position: [-3.33, 1.6, -3], hasWindow: true },
    { base: 'P5', label: 'Trasero centro', position: [0, 1.6, -3], hasWindow: true },
    { base: 'P6', label: 'Trasero derecho', position: [3.33, 1.6, -3], hasWindow: true },
  ]

  bigBases.forEach((p) => {
    parts.push({
      id: `${p.base}-1`,
      name: `Panel ${p.base} · ${p.label} (mitad izquierda)`,
      description: 'Mitad izquierda del muro de madera.',
      tier: 'panel',
      price: 200000,
      shape: 'panel',
      position: [p.position[0] - HALF_OFFSET, p.position[1], p.position[2]],
      rotation: [0, 0, 0],
      size: [HALF_W, PANEL_H, PANEL_T],
      color: WOOD,
      ...(p.hasWindow ? { hasWindow: true } : {}),
      ...(p.excludeCompanyLogo ? { excludeCompanyLogo: true } : {}),
    })
    parts.push({
      id: `${p.base}-2`,
      name: `Panel ${p.base} · ${p.label} (mitad derecha)`,
      description: 'Mitad derecha del muro de madera.',
      tier: 'panel',
      price: 200000,
      shape: 'panel',
      position: [p.position[0] + HALF_OFFSET, p.position[1], p.position[2]],
      rotation: [0, 0, 0],
      size: [HALF_W, PANEL_H, PANEL_T],
      color: WOOD,
      ...(p.hasWindow ? { hasWindow: true } : {}),
      ...(p.excludeCompanyLogo ? { excludeCompanyLogo: true } : {}),
    })
  })

  // Muros laterales del salón
  const sides = [
    { id: 'P7', label: 'Lateral oeste (trasero)', position: [-5, 1.6, -2] },
    { id: 'P8', label: 'Lateral oeste (centro)', position: [-5, 1.6, 0], hasWindow: true },
    { id: 'P9', label: 'Lateral oeste (frontal)', position: [-5, 1.6, 2] },
    { id: 'P10', label: 'Lateral este (trasero)', position: [5, 1.6, -2] },
    { id: 'P11', label: 'Lateral este (centro)', position: [5, 1.6, 0], hasWindow: true },
    { id: 'P12', label: 'Lateral este (frontal)', position: [5, 1.6, 2] },
  ]
  sides.forEach((p) =>
    parts.push({
      id: p.id,
      name: `Panel ${p.id} · ${p.label}`,
      description: 'Sección del muro lateral.',
      tier: 'panel',
      price: 200000,
      shape: 'side-panel',
      position: p.position,
      rotation: [0, 0, 0],
      size: [0.15, 3, 2],
      color: WOOD,
      ...(p.hasWindow ? { hasWindow: true } : {}),
    })
  )

  // Puerta
  parts.push({
    id: 'D1',
    name: 'Puerta principal',
    description: 'Puerta de acceso doble hoja en madera.',
    tier: 'puerta',
    price: 60000,
    shape: 'door',
    position: [0, 1.1, 3.09],
    rotation: [0, 0, 0],
    size: [1.3, 2.2, 0.1],
    color: DOOR_COLOR,
  })

  // Ventanas
  const windows = [
    { id: 'V1', label: 'Frontal derecha', position: [3.33, 1.9, 3.09], size: [1.4, 1, 0.06], shape: 'window' },
    { id: 'V2', label: 'Trasera izquierda', position: [-3.33, 1.9, -3.09], size: [1.4, 1, 0.06], shape: 'window' },
    { id: 'V3', label: 'Trasera centro', position: [0, 1.9, -3.09], size: [1.4, 1, 0.06], shape: 'window' },
    { id: 'V4', label: 'Trasera derecha', position: [3.33, 1.9, -3.09], size: [1.4, 1, 0.06], shape: 'window' },
    { id: 'V5', label: 'Lateral oeste', position: [-5.09, 1.9, 0], size: [0.06, 1, 1.4], shape: 'side-window' },
    { id: 'V6', label: 'Frontal izquierda', position: [-3.33, 1.9, 3.09], size: [1.4, 1, 0.06], shape: 'window' },
    { id: 'V7', label: 'Lateral este', position: [5.09, 1.9, 0], size: [0.06, 1, 1.4], shape: 'side-window' },
  ]
  windows.forEach((w) =>
    parts.push({
      id: w.id,
      name: `Ventana ${w.id} · ${w.label}`,
      description: 'Ventana del salón.',
      tier: 'ventana',
      price: 20000,
      shape: w.shape,
      position: w.position,
      rotation: [0, 0, 0],
      size: w.size,
      color: GLASS,
    })
  )

  // Techo salón — 12 secciones
  const SECTION_WIDTH = 10 / 6
  const sectionCenters = [0, 1, 2, 3, 4, 5].map(
    (k) => -5 + SECTION_WIDTH / 2 + k * SECTION_WIDTH
  )
  sectionCenters.forEach((x, i) => {
    parts.push({
      id: `T${i + 1}`,
      name: `Techo T${i + 1} · Agua sur, sector ${i + 1}`,
      description: 'Plancha de zinc del agua sur.',
      tier: 'techo',
      price: 100000,
      shape: 'roof',
      position: [x, 4.1, 1.5],
      rotation: [ROOF_TILT_SALON, 0, 0],
      size: [SECTION_WIDTH, 0.1, 3.606],
      color: ZINC,
    })
  })
  sectionCenters.forEach((x, i) => {
    parts.push({
      id: `T${i + 7}`,
      name: `Techo T${i + 7} · Agua norte, sector ${i + 1}`,
      description: 'Plancha de zinc del agua norte.',
      tier: 'techo',
      price: 100000,
      shape: 'roof',
      position: [x, 4.1, -1.5],
      rotation: [-ROOF_TILT_SALON, 0, 0],
      size: [SECTION_WIDTH, 0.1, 3.606],
      color: ZINC,
    })
  })

  // Hastiales salón (4 mitades)
  const gables = [
    { id: 'G1-1', side: 'left', position: [-5, 3.1, 0], rotation: [0, Math.PI / 2, 0] },
    { id: 'G1-2', side: 'right', position: [-5, 3.1, 0], rotation: [0, Math.PI / 2, 0] },
    { id: 'G2-1', side: 'left', position: [5, 3.1, 0], rotation: [0, -Math.PI / 2, 0] },
    { id: 'G2-2', side: 'right', position: [5, 3.1, 0], rotation: [0, -Math.PI / 2, 0] },
  ]
  gables.forEach((g) =>
    parts.push({
      id: g.id,
      name: `Hastial ${g.id}`,
      description: 'Mitad del panel triangular del frontón.',
      tier: 'panel',
      price: 200000,
      shape: 'gable-half',
      gableSide: g.side,
      position: g.position,
      rotation: g.rotation,
      size: [6, 2, 0.15],
      color: WOOD,
      excludeCompanyLogo: true,
    })
  )

  return parts
}

function buildSalonConsumables() {
  const cans = [
    [-4.7, 0.15, 3.65],
    [-4.05, 0.15, 3.85],
    [-3.4, 0.15, 3.6],
    [-2.75, 0.15, 3.85],
    [-2.1, 0.15, 3.65],
  ].map((pos, i) => makeVarnishCan(i, pos, (i * Math.PI) / 7, i === 0))

  const nails = [
    [2.15, 0.05, 3.65],
    [2.85, 0.05, 3.85],
    [3.55, 0.05, 3.6],
    [4.25, 0.05, 3.85],
    [4.85, 0.05, 3.65],
  ].map((pos, i) => makeNailBox(i, pos, (i * Math.PI) / 9, i === 0))

  const rolls = [
    { pos: [-5.55, 0.05, -2.7], rotZ: 0 },
    { pos: [-5.95, 0.05, -1.85], rotZ: Math.PI / 8 },
    { pos: [-5.6, 0.05, -1.0], rotZ: -Math.PI / 10 },
    { pos: [-5.9, 0.05, -0.15], rotZ: Math.PI / 6 },
    { pos: [-5.55, 0.05, 0.7], rotZ: -Math.PI / 7 },
    { pos: [-5.95, 0.05, 1.55], rotZ: Math.PI / 5 },
    { pos: [-5.6, 0.05, 2.5], rotZ: -Math.PI / 9 },
  ].map((e, i) => makeInsulationRoll(i, e.pos, e.rotZ, i === 0))

  return [...cans, ...nails, ...rolls]
}

// ════════════════════════════════════════════════════════════════════════════
// CAPILLA — eje LARGO en Z (10m), eje CORTO en X (6m).
// La entrada va en el lado corto (z=+5). El techo a dos aguas tiene la
// cumbrera a lo largo de Z (x=0). Los frontones quedan al frente y atrás.
// Sobre el techo, cerca del frente, sobresale una pequeña linterna
// (clerestory) y la cruz va MONTADA en el frontón delantero.
// ════════════════════════════════════════════════════════════════════════════

function buildCapillaStructural() {
  const parts = []
  const PANEL_T = 0.15
  const PANEL_H = 3

  // ── Muros de los lados cortos (frontón frente y atrás) ───────────────────
  // Frente (z=+5): 3 paneles de 2m (izq+ventana, centro+puertas, der+ventana)
  // Atrás (z=-5):  3 paneles de 2m con ventanas a los costados
  const shortWalls = [
    { id: 'P1', label: 'Frontal izquierdo (ventana)', position: [-2, 1.6, 5], hasWindow: true },
    { id: 'P2', label: 'Frontal centro (entradas)', position: [0, 1.6, 5], excludeCompanyLogo: true },
    { id: 'P3', label: 'Frontal derecho (ventana)', position: [2, 1.6, 5], hasWindow: true },
    { id: 'P4', label: 'Trasero izquierdo', position: [-2, 1.6, -5], hasWindow: true },
    { id: 'P5', label: 'Trasero centro', position: [0, 1.6, -5] },
    { id: 'P6', label: 'Trasero derecho', position: [2, 1.6, -5], hasWindow: true },
  ]
  shortWalls.forEach((p) =>
    parts.push({
      id: p.id,
      name: `Panel ${p.id} · ${p.label}`,
      description: 'Muro de la capilla.',
      tier: 'panel',
      price: 200000,
      shape: 'panel',
      position: p.position,
      rotation: [0, 0, 0],
      size: [2, PANEL_H, PANEL_T],
      color: WOOD,
      ...(p.hasWindow ? { hasWindow: true } : {}),
      ...(p.excludeCompanyLogo ? { excludeCompanyLogo: true } : {}),
    })
  )

  // ── Muros laterales largos (x=±3), cada uno dividido en 3 paneles ───────
  const longWalls = [
    { id: 'P7', label: 'Lateral oeste (trasero)', position: [-3, 1.6, -3.33] },
    { id: 'P8', label: 'Lateral oeste (centro)', position: [-3, 1.6, 0], hasWindow: true },
    { id: 'P9', label: 'Lateral oeste (frontal)', position: [-3, 1.6, 3.33] },
    { id: 'P10', label: 'Lateral este (trasero)', position: [3, 1.6, -3.33] },
    { id: 'P11', label: 'Lateral este (centro)', position: [3, 1.6, 0], hasWindow: true },
    { id: 'P12', label: 'Lateral este (frontal)', position: [3, 1.6, 3.33] },
  ]
  longWalls.forEach((p) =>
    parts.push({
      id: p.id,
      name: `Panel ${p.id} · ${p.label}`,
      description: 'Sección del muro lateral.',
      tier: 'panel',
      price: 200000,
      shape: 'side-panel',
      position: p.position,
      rotation: [0, 0, 0],
      size: [PANEL_T, PANEL_H, 3.33],
      color: WOOD,
      ...(p.hasWindow ? { hasWindow: true } : {}),
    })
  )

  // ── DOS puertas dobles pegadas y espejadas (manillas hacia el centro) ────
  // D1 lleva mirrorTexture → la textura de puerta.jpg se voltea horizontal,
  // manilla queda mirando al centro.
  parts.push({
    id: 'D1',
    name: 'Puerta principal izquierda',
    description: 'Hoja izquierda del acceso.',
    tier: 'puerta',
    price: 60000,
    shape: 'door',
    position: [-0.475, 1.1, 5.09],
    rotation: [0, 0, 0],
    size: [0.95, 2.2, 0.1],
    color: DOOR_COLOR,
    mirrorTexture: true,
  })
  parts.push({
    id: 'D2',
    name: 'Puerta principal derecha',
    description: 'Hoja derecha del acceso.',
    tier: 'puerta',
    price: 60000,
    shape: 'door',
    position: [0.475, 1.1, 5.09],
    rotation: [0, 0, 0],
    size: [0.95, 2.2, 0.1],
    color: DOOR_COLOR,
  })

  // ── Ventanas ─────────────────────────────────────────────────────────────
  const windows = [
    { id: 'V1', label: 'Frontal izquierda', position: [-2, 1.9, 5.09], size: [1.2, 1, 0.06], shape: 'window' },
    { id: 'V2', label: 'Frontal derecha', position: [2, 1.9, 5.09], size: [1.2, 1, 0.06], shape: 'window' },
    { id: 'V3', label: 'Trasera izquierda', position: [-2, 1.9, -5.09], size: [1.2, 1, 0.06], shape: 'window' },
    { id: 'V4', label: 'Trasera derecha', position: [2, 1.9, -5.09], size: [1.2, 1, 0.06], shape: 'window' },
    { id: 'V5', label: 'Lateral oeste', position: [-3.09, 1.9, 0], size: [0.06, 1, 1.4], shape: 'side-window' },
    { id: 'V6', label: 'Lateral este', position: [3.09, 1.9, 0], size: [0.06, 1, 1.4], shape: 'side-window' },
  ]
  windows.forEach((w) =>
    parts.push({
      id: w.id,
      name: `Ventana ${w.id} · ${w.label}`,
      description: 'Ventana de la capilla.',
      tier: 'ventana',
      price: 20000,
      shape: w.shape,
      position: w.position,
      rotation: [0, 0, 0],
      size: w.size,
      color: GLASS,
    })
  )

  // ── Techo capilla ────────────────────────────────────────────────────────
  // Cumbrera a lo largo de Z (eje largo), x=0, y=5.1
  // Pendientes a ambos lados de X. Misma inclinación que el salón.
  // 6 sectores a lo largo de Z, x 2 aguas = 12 secciones
  const Z_SECTION_W = 10 / 6
  const zSectionCenters = [0, 1, 2, 3, 4, 5].map(
    (k) => -5 + Z_SECTION_W / 2 + k * Z_SECTION_W
  )
  const SLOPE_LEN = 3.606
  // Agua ESTE (x=+1.5), rotación NEGATIVA alrededor de Z → cae hacia +X
  zSectionCenters.forEach((z, i) => {
    parts.push({
      id: `T${i + 1}`,
      name: `Techo T${i + 1} · Agua este, sector ${i + 1}`,
      description: 'Plancha de zinc del agua este.',
      tier: 'techo',
      price: 100000,
      shape: 'roof',
      position: [1.5, 4.1, z],
      rotation: [0, 0, -ROOF_TILT_SALON],
      size: [SLOPE_LEN, 0.1, Z_SECTION_W],
      color: ZINC,
    })
  })
  // Agua OESTE (x=-1.5), rotación POSITIVA alrededor de Z → cae hacia -X
  zSectionCenters.forEach((z, i) => {
    parts.push({
      id: `T${i + 7}`,
      name: `Techo T${i + 7} · Agua oeste, sector ${i + 1}`,
      description: 'Plancha de zinc del agua oeste.',
      tier: 'techo',
      price: 100000,
      shape: 'roof',
      position: [-1.5, 4.1, z],
      rotation: [0, 0, ROOF_TILT_SALON],
      size: [SLOPE_LEN, 0.1, Z_SECTION_W],
      color: ZINC,
    })
  })

  // ── Hastiales (frontones del frente y atrás) ─────────────────────────────
  // Base 6m × altura 2m. Frente en z=+5, atrás en z=-5.
  // Default extrusion shape ya está en XY, así que no hace falta rotar para
  // el frente. Para el atrás, rotamos 180° en Y para que la cara mire -Z.
  const gables = [
    { id: 'G1-1', side: 'left', position: [0, 3.1, 5], rotation: [0, 0, 0] },
    { id: 'G1-2', side: 'right', position: [0, 3.1, 5], rotation: [0, 0, 0] },
    { id: 'G2-1', side: 'left', position: [0, 3.1, -5], rotation: [0, Math.PI, 0] },
    { id: 'G2-2', side: 'right', position: [0, 3.1, -5], rotation: [0, Math.PI, 0] },
  ]
  gables.forEach((g) =>
    parts.push({
      id: g.id,
      name: `Hastial ${g.id}`,
      description: 'Mitad del frontón triangular.',
      tier: 'panel',
      price: 200000,
      shape: 'gable-half',
      gableSide: g.side,
      position: g.position,
      rotation: g.rotation,
      size: [6, 2, 0.15],
      color: WOOD,
      excludeCompanyLogo: true,
    })
  )

  // ── CRUZ donable ($50.000) — montada en el frontón delantero ─────────────
  parts.push({
    id: 'C1',
    name: 'Cruz de la capilla',
    description: 'Cruz de madera montada en el frontón delantero.',
    tier: 'cruz',
    price: 50000,
    shape: 'cross',
    position: [0, 4.3, 5.18],
    rotation: [0, 0, 0],
    size: [1.2, 2.2, 0.12],
    color: '#3d2817',
    excludeCompanyLogo: true,
  })

  // ── Clerestory (extensión sobresaliente que recorre TODO el largo) ───────
  // Muros bajan hasta y=4.6 (donde corta el techo principal a x=±0.75).
  // Top de muro a y=5.6. Roof peak a y=5.9 (rise 0.3m sobre muro).
  // Piezas donables: 2 muros + 2 aguas + 2 frontones triangulares.
  const CLERE_HALF = 0.75
  const CLERE_WALL_TOP = 5.6
  const CLERE_WALL_BOT = 4.6
  const CLERE_WALL_H = CLERE_WALL_TOP - CLERE_WALL_BOT // 1.0
  const CLERE_WALL_CY = (CLERE_WALL_TOP + CLERE_WALL_BOT) / 2 // 5.1
  const CLERE_RISE = 0.3
  const CLERE_PEAK = CLERE_WALL_TOP + CLERE_RISE // 5.9
  const CLERE_SLOPE_LEN = Math.sqrt(CLERE_HALF * CLERE_HALF + CLERE_RISE * CLERE_RISE)
  const CLERE_TILT = Math.atan(CLERE_RISE / CLERE_HALF)
  const CLERE_LEN = 10

  // Muros largos laterales (este y oeste)
  parts.push({
    id: 'CW1',
    name: 'Muro superior este',
    description: 'Muro este de la sección superior, recorre el largo del techo.',
    tier: 'panel',
    price: 200000,
    shape: 'side-panel',
    position: [CLERE_HALF, CLERE_WALL_CY, 0],
    rotation: [0, 0, 0],
    size: [0.1, CLERE_WALL_H, CLERE_LEN],
    color: WOOD,
    excludeCompanyLogo: true,
  })
  parts.push({
    id: 'CW2',
    name: 'Muro superior oeste',
    description: 'Muro oeste de la sección superior, recorre el largo del techo.',
    tier: 'panel',
    price: 200000,
    shape: 'side-panel',
    position: [-CLERE_HALF, CLERE_WALL_CY, 0],
    rotation: [0, 0, 0],
    size: [0.1, CLERE_WALL_H, CLERE_LEN],
    color: WOOD,
    excludeCompanyLogo: true,
  })
  // Muros de los extremos (frente y atrás), abajo de los frontones
  parts.push({
    id: 'CW3',
    name: 'Muro superior delantero',
    description: 'Muro delantero de la sección superior, debajo del frontón.',
    tier: 'panel',
    price: 200000,
    shape: 'panel',
    position: [0, CLERE_WALL_CY, 5],
    rotation: [0, 0, 0],
    size: [CLERE_HALF * 2, CLERE_WALL_H, 0.1],
    color: WOOD,
    excludeCompanyLogo: true,
  })
  parts.push({
    id: 'CW4',
    name: 'Muro superior trasero',
    description: 'Muro trasero de la sección superior, debajo del frontón.',
    tier: 'panel',
    price: 200000,
    shape: 'panel',
    position: [0, CLERE_WALL_CY, -5],
    rotation: [0, 0, 0],
    size: [CLERE_HALF * 2, CLERE_WALL_H, 0.1],
    color: WOOD,
    excludeCompanyLogo: true,
  })
  // Aguas del techo superior (planchas de zinc)
  parts.push({
    id: 'CR1',
    name: 'Techo superior este',
    description: 'Plancha de zinc del agua este del techo superior.',
    tier: 'techo',
    price: 100000,
    shape: 'roof',
    position: [CLERE_HALF / 2, (CLERE_WALL_TOP + CLERE_PEAK) / 2, 0],
    rotation: [0, 0, -CLERE_TILT],
    size: [CLERE_SLOPE_LEN, 0.06, CLERE_LEN],
    color: ZINC,
  })
  parts.push({
    id: 'CR2',
    name: 'Techo superior oeste',
    description: 'Plancha de zinc del agua oeste del techo superior.',
    tier: 'techo',
    price: 100000,
    shape: 'roof',
    position: [-CLERE_HALF / 2, (CLERE_WALL_TOP + CLERE_PEAK) / 2, 0],
    rotation: [0, 0, CLERE_TILT],
    size: [CLERE_SLOPE_LEN, 0.06, CLERE_LEN],
    color: ZINC,
  })
  // Frontones triangulares de cierre (delantero y trasero)
  parts.push({
    id: 'CG1',
    name: 'Frontón superior delantero',
    description: 'Triángulo de cierre delantero de la sección superior.',
    tier: 'panel',
    price: 200000,
    shape: 'gable',
    position: [0, CLERE_WALL_TOP, 5],
    rotation: [0, 0, 0],
    size: [CLERE_HALF * 2, CLERE_RISE, 0.1],
    color: WOOD,
    excludeCompanyLogo: true,
  })
  parts.push({
    id: 'CG2',
    name: 'Frontón superior trasero',
    description: 'Triángulo de cierre trasero de la sección superior.',
    tier: 'panel',
    price: 200000,
    shape: 'gable',
    position: [0, CLERE_WALL_TOP, -5],
    rotation: [0, Math.PI, 0],
    size: [CLERE_HALF * 2, CLERE_RISE, 0.1],
    color: WOOD,
    excludeCompanyLogo: true,
  })

  return parts
}

function buildCapillaConsumables() {
  // Posiciones ajustadas al footprint reorientado (entrada en z=+5).
  // Latas frente a la fachada delantera, lado izquierdo (-X).
  const cans = [
    [-2.7, 0.15, 5.65],
    [-2.1, 0.15, 5.85],
    [-1.4, 0.15, 5.55],
    [-0.75, 0.15, 5.85],
    [-0.05, 0.15, 5.65],
  ].map((pos, i) => makeVarnishCan(i, pos, (i * Math.PI) / 7, i === 0))

  // Cajas de clavos también al frente pero lado derecho (+X)
  const nails = [
    [0.55, 0.05, 5.65],
    [1.2, 0.05, 5.85],
    [1.85, 0.05, 5.55],
    [2.5, 0.05, 5.85],
    [2.95, 0.05, 5.65],
  ].map((pos, i) => makeNailBox(i, pos, (i * Math.PI) / 9, i === 0))

  // Rollos de aislante a lo largo del muro lateral oeste (x=-3, varias z)
  const rolls = [
    { pos: [-3.6, 0.05, -4.5], rotZ: 0 },
    { pos: [-3.95, 0.05, -3.0], rotZ: Math.PI / 8 },
    { pos: [-3.6, 0.05, -1.5], rotZ: -Math.PI / 10 },
    { pos: [-3.95, 0.05, 0], rotZ: Math.PI / 6 },
    { pos: [-3.6, 0.05, 1.5], rotZ: -Math.PI / 7 },
    { pos: [-3.95, 0.05, 3.0], rotZ: Math.PI / 5 },
    { pos: [-3.6, 0.05, 4.4], rotZ: -Math.PI / 9 },
  ].map((e, i) => makeInsulationRoll(i, e.pos, e.rotZ, i === 0))

  return [...cans, ...nails, ...rolls]
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS — diccionario por tipo de edificio
// ════════════════════════════════════════════════════════════════════════════

export const donationPartsByBuilding = {
  salon: [...buildSalonStructural(), ...buildSalonConsumables()],
  capilla: [...buildCapillaStructural(), ...buildCapillaConsumables()],
}

// Dimensiones del radier (piso de cemento) por edificio.
// Capilla rotada 90°: eje largo a lo largo de Z.
export const radierByBuilding = {
  salon: { size: [10.2, 0.18, 6.2], position: [0, 0.05, 0] },
  capilla: { size: [6.2, 0.18, 10.2], position: [0, 0.05, 0] },
}

// Las decoraciones del clerestory ahora son piezas donables (ver
// buildCapillaStructural). Sólo dejamos esto vacío para los dos edificios.
export const staticDecorationsByBuilding = {
  salon: [],
  capilla: [],
}

export const sampleDonors = []
