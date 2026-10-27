import type { BuildingDefinition, BuildingId } from './types'

export const BUILDINGS: Record<BuildingId, BuildingDefinition> = {
  farmer: {
    id: 'farmer',
    name: 'Granjero',
    buildingName: 'La Granja',
    icon: '🐄',
    maxCount: 6,
    description: 'Votan entre ellos para elegir de entre los Granjeros al Alguacil.',
  },
  baker: {
    id: 'baker',
    name: 'Panadero',
    buildingName: 'La Panadería',
    icon: '🥖',
    maxCount: 1,
    description: 'Abre los ojos unos instantes cada noche justo cuando los Lobos vuelven a dormir.',
  },
  innkeeper: {
    id: 'innkeeper',
    name: 'Tabernero',
    buildingName: 'La Taberna',
    icon: '🍺',
    maxCount: 1,
    description: 'Inmune a los Lobos y a las votaciones. Pierde su taberna si vota contra alguien que resulte eliminado.',
  },
  noble: {
    id: 'noble',
    name: 'Noble',
    buildingName: 'El Palacete',
    icon: '👑',
    maxCount: 1,
    uniquePower: true,
    description: 'Una vez por partida puede indultar al jugador elegido por la aldea (salvo que sea Vagabundo).',
  },
  barber: {
    id: 'barber',
    name: 'Barbero',
    buildingName: 'La Barbería',
    icon: '🪒',
    maxCount: 1,
    uniquePower: true,
    description: 'Una vez por partida, de día, elimina a alguien con edificio: si no es Lobo, muere también el Barbero.',
  },
  confessor: {
    id: 'confessor',
    name: 'Confesor',
    buildingName: 'La Iglesia',
    icon: '📿',
    maxCount: 1,
    uniquePower: true,
    description: 'Una vez por partida, de día, obliga a un jugador a mostrarle en secreto su carta de personaje.',
  },
  apothecary: {
    id: 'apothecary',
    name: 'Boticario',
    buildingName: 'La Choza',
    icon: '⚗️',
    maxCount: 1,
    uniquePower: true,
    description: 'Una vez por partida, de día, devuelve a otro jugador el poder único ya gastado de su edificio.',
  },
  headmistress: {
    id: 'headmistress',
    name: 'Institutriz',
    buildingName: 'La Escuela',
    icon: '🔔',
    maxCount: 1,
    description: 'Cada día antes de votar puede prohibir el voto hasta a 2 personas con edificio. Ella no vota nunca.',
  },
  mayor: {
    id: 'mayor',
    name: 'Alcalde',
    buildingName: 'El Ayuntamiento',
    icon: '🗝️',
    maxCount: 1,
    description: 'Cuando un edificio queda vacío tras una muerte, puede entregárselo a un Vagabundo con su poder restaurado.',
  },
  vagrant: {
    id: 'vagrant',
    name: 'Vagabundo',
    buildingName: 'Sin edificio (Hatillo)',
    icon: '🎒',
    maxCount: 15,
    description: 'No ocupa edificio. Es inmune a la Institutriz, el Barbero, el Cuervo y el Pirómano, y puede ocupar casas vacías.',
  },
}

export const BUILDING_LIST: BuildingDefinition[] = Object.values(BUILDINGS)

export function recommendedBuildings(playerCount: number): BuildingId[] {
  const priority: BuildingId[] = [
    'farmer', 'farmer', 'baker', 'innkeeper', 'noble',
    'barber', 'mayor', 'vagrant', 'farmer', 'confessor',
    'headmistress', 'apothecary', 'vagrant', 'farmer', 'vagrant',
    'farmer', 'farmer',
  ]
  const result: BuildingId[] = []
  for (let i = 0; i < playerCount; i += 1) {
    result.push(priority[i] ?? 'vagrant')
  }
  return result
}
