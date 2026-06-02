// Una sola capilla — versión Consejo. Sin selector de zona ni multi-zona.

export const zones = [
  { id: 'capilla', name: 'Capilla', building: 'capilla' },
]

export function findZone(id) {
  return zones.find((z) => z.id === id) || zones[0]
}
